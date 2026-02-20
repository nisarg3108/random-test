import { PrismaClient } from '@prisma/client';
import integrationEventManager from '../integration/events/integrationEventManager.js';
const prisma = new PrismaClient();

class WorkOrderService {
  /**
   * Create a new work order
   */
  async createWorkOrder(data, tenantId, createdBy) {
    // Generate work order number
    const count = await prisma.workOrder.count({ where: { tenantId } });
    const woNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Validate BOM exists
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id: data.bomId, tenantId },
      include: { items: true }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        ...data,
        workOrderNumber: woNumber,
        tenantId,
        createdBy,
        status: 'DRAFT',
        estimatedCost: bom.totalCost * data.plannedQty
      },
      include: {
        bom: {
          include: { items: true }
        }
      }
    });

    return workOrder;
  }

  /**
   * Get all work orders
   */
  async getAllWorkOrders(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.scheduledStart = {};
      if (filters.dateFrom) {
        where.scheduledStart.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.scheduledStart.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { workOrderNumber: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        bom: true,
        operations: {
          orderBy: { sequence: 'asc' }
        },
        materialUsage: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return workOrders;
  }

  /**
   * Get work order by ID
   */
  async getWorkOrderById(id, tenantId) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: {
        bom: {
          include: { items: true }
        },
        operations: {
          orderBy: { sequence: 'asc' }
        },
        materialUsage: true
      }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    return workOrder;
  }

  /**
   * Update work order
   */
  async updateWorkOrder(id, data, tenantId) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Only allow updates to draft or planned work orders
    if (!['DRAFT', 'PLANNED'].includes(workOrder.status)) {
      throw new Error('Can only update draft or planned work orders');
    }

    return await prisma.workOrder.update({
      where: { id },
      data,
      include: {
        bom: true,
        operations: true,
        materialUsage: true
      }
    });
  }

  /**
   * Plan work order (DRAFT → PLANNED)
   */
  async planWorkOrder(id, tenantId) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'DRAFT') {
      throw new Error('Only draft work orders can be planned');
    }

    return await prisma.workOrder.update({
      where: { id },
      data: { status: 'PLANNED' }
    });
  }

  /**
   * Start work order (PLANNED → IN_PROGRESS)
   */
  async startWorkOrder(id, tenantId) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'PLANNED') {
      throw new Error('Only planned work orders can be started');
    }

    return await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date()
      }
    });
  }

  /**
   * Complete work order
   */
  async completeWorkOrder(id, data, tenantId, completedBy) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      throw new Error('Only in-progress work orders can be completed');
    }

    const { producedQty, scrappedQty } = data;

    if (!producedQty || producedQty <= 0) {
      throw new Error('Produced quantity must be greater than 0');
    }

    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        producedQty,
        scrappedQty: scrappedQty || 0,
        actualEnd: new Date(),
        completedBy,
        completedAt: new Date()
      }
    });

    integrationEventManager.emitWorkOrderCompleted(id, tenantId);

    return updatedWorkOrder;
  }

  /**
   * Cancel work order
   */
  async cancelWorkOrder(id, tenantId) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id, tenantId }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed work order');
    }

    return await prisma.workOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }

  /**
   * Add operation to work order
   */
  async addOperation(workOrderId, data, tenantId) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Get the next sequence number
    const lastOp = await prisma.workOrderOperation.findFirst({
      where: { workOrderId },
      orderBy: { sequence: 'desc' }
    });

    const nextSequence = (lastOp?.sequence || 0) + 1;

    return await prisma.workOrderOperation.create({
      data: {
        ...data,
        workOrderId,
        sequence: nextSequence,
        status: 'PENDING'
      }
    });
  }

  /**
   * Update operation
   */
  async updateOperation(operationId, data, tenantId) {
    const operation = await prisma.workOrderOperation.findUnique({
      where: { id: operationId }
    });

    if (!operation) {
      throw new Error('Operation not found');
    }

    return await prisma.workOrderOperation.update({
      where: { id: operationId },
      data
    });
  }

  /**
   * Start operation
   */
  async startOperation(operationId, tenantId) {
    const operation = await prisma.workOrderOperation.findUnique({
      where: { id: operationId }
    });

    if (!operation) {
      throw new Error('Operation not found');
    }

    if (operation.status !== 'PENDING') {
      throw new Error('Operation is not pending');
    }

    return await prisma.workOrderOperation.update({
      where: { id: operationId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    });
  }

  /**
   * Complete operation
   */
  async completeOperation(operationId, data, tenantId) {
    const operation = await prisma.workOrderOperation.findUnique({
      where: { id: operationId }
    });

    if (!operation) {
      throw new Error('Operation not found');
    }

    if (operation.status !== 'IN_PROGRESS') {
      throw new Error('Operation is not in progress');
    }

    const { actualHours, laborCost } = data;

    return await prisma.workOrderOperation.update({
      where: { id: operationId },
      data: {
        status: 'COMPLETED',
        actualHours,
        laborCost,
        completedAt: new Date()
      }
    });
  }

  /**
   * Add material requirement
   */
  async addMaterialRequirement(workOrderId, data, tenantId) {
    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId }
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    return await prisma.workOrderMaterial.create({
      data: {
        ...data,
        workOrderId,
        tenantId,
        status: 'PENDING'
      }
    });
  }

  /**
   * Issue material
   */
  async issueMaterial(materialId, data, tenantId, issuedBy) {
    const material = await prisma.workOrderMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      throw new Error('Material requirement not found');
    }

    if (material.status !== 'PENDING') {
      throw new Error('Material is not pending');
    }

    const { issuedQty } = data;

    if (issuedQty > material.plannedQty) {
      throw new Error('Issued quantity cannot exceed planned quantity');
    }

    return await prisma.workOrderMaterial.update({
      where: { id: materialId },
      data: {
        issuedQty,
        status: issuedQty === material.plannedQty ? 'ISSUED' : 'PARTIAL',
        issuedBy,
        issuedAt: new Date()
      }
    });
  }

  /**
   * Record material consumption
   */
  async consumeMaterial(materialId, data, tenantId) {
    const material = await prisma.workOrderMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) {
      throw new Error('Material requirement not found');
    }

    const { consumedQty } = data;

    if (consumedQty > material.issuedQty) {
      throw new Error('Consumed quantity cannot exceed issued quantity');
    }

    const remainingQty = material.issuedQty - consumedQty;

    return await prisma.workOrderMaterial.update({
      where: { id: materialId },
      data: {
        consumedQty,
        returnedQty: material.returnedQty + remainingQty,
        status: consumedQty === material.issuedQty ? 'CONSUMED' : 'PARTIAL'
      }
    });
  }

  /**
   * Get work order statistics
   */
  async getWorkOrderStatistics(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.dateFrom || filters.dateTo) {
      where.scheduledStart = {};
      if (filters.dateFrom) {
        where.scheduledStart.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.scheduledStart.lte = new Date(filters.dateTo);
      }
    }

    const stats = await prisma.workOrder.groupBy({
      by: ['status', 'priority'],
      where,
      _count: true,
      _sum: {
        plannedQty: true,
        producedQty: true,
        estimatedCost: true,
        actualCost: true
      }
    });

    return stats;
  }

  /**
   * Get work order with full details (for dashboard)
   */
  async getWorkOrderDashboard(tenantId) {
    const workOrders = await prisma.workOrder.findMany({
      where: { tenantId },
      include: {
        bom: true,
        operations: true,
        materialUsage: true
      }
    });

    // Calculate metrics
    const metrics = {
      total: workOrders.length,
      byStatus: {},
      overdue: 0,
      efficiency: 0
    };

    // Count by status
    workOrders.forEach(wo => {
      metrics.byStatus[wo.status] = (metrics.byStatus[wo.status] || 0) + 1;
      
      // Check for overdue
      if (wo.scheduledEnd && new Date(wo.scheduledEnd) < new Date() && wo.status !== 'COMPLETED') {
        metrics.overdue++;
      }
    });

    // Calculate efficiency (produced / planned)
    const completed = workOrders.filter(wo => wo.status === 'COMPLETED');
    if (completed.length > 0) {
      const totalProduced = completed.reduce((sum, wo) => sum + (wo.producedQty || 0), 0);
      const totalPlanned = completed.reduce((sum, wo) => sum + (wo.plannedQty || 0), 0);
      metrics.efficiency = totalPlanned > 0 ? (totalProduced / totalPlanned) * 100 : 0;
    }

    return {
      workOrders,
      metrics
    };
  }
}

export default new WorkOrderService();
