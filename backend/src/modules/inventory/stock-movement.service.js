import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class StockMovementService {
  /**
   * Create a stock movement
   */
  async createMovement(data, tenantId, createdBy) {
    // Generate movement number
    const count = await prisma.stockMovement.count({ where: { tenantId } });
    const movementNumber = `SM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Validate movement type and required fields
    this.validateMovementData(data);

    // Calculate total cost if unit cost is provided
    if (data.unitCost && data.quantity) {
      data.totalCost = data.unitCost * data.quantity;
    }

    const movement = await prisma.stockMovement.create({
      data: {
        ...data,
        movementNumber,
        tenantId,
        createdBy,
        status: 'PENDING'
      },
      include: {
        warehouse: true
      }
    });

    return movement;
  }

  /**
   * Validate movement data based on type
   */
  validateMovementData(data) {
    const { type, fromWarehouseId, toWarehouseId, warehouseId } = data;

    switch (type) {
      case 'IN':
      case 'OUT':
      case 'ADJUSTMENT':
        if (!warehouseId) {
          throw new Error(`warehouseId is required for ${type} movements`);
        }
        break;
      case 'TRANSFER':
        if (!fromWarehouseId || !toWarehouseId) {
          throw new Error('Both fromWarehouseId and toWarehouseId are required for TRANSFER');
        }
        if (fromWarehouseId === toWarehouseId) {
          throw new Error('Cannot transfer to the same warehouse');
        }
        break;
      default:
        throw new Error('Invalid movement type');
    }
  }

  /**
   * Get all stock movements
   */
  async getAllMovements(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.warehouseId) {
      where.OR = [
        { warehouseId: filters.warehouseId },
        { fromWarehouseId: filters.warehouseId },
        { toWarehouseId: filters.warehouseId }
      ];
    }

    if (filters.itemId) {
      where.itemId = filters.itemId;
    }

    if (filters.referenceType) {
      where.referenceType = filters.referenceType;
    }

    if (filters.referenceId) {
      where.referenceId = filters.referenceId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { movementNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { lotNumber: { contains: filters.search, mode: 'insensitive' } },
        { batchNumber: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        warehouse: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return movements;
  }

  /**
   * Get movement by ID
   */
  async getMovementById(id, tenantId) {
    const movement = await prisma.stockMovement.findFirst({
      where: { id, tenantId },
      include: {
        warehouse: true
      }
    });

    if (!movement) {
      throw new Error('Stock movement not found');
    }

    return movement;
  }

  /**
   * Update stock movement
   */
  async updateMovement(id, data, tenantId) {
    const movement = await prisma.stockMovement.findFirst({
      where: { id, tenantId }
    });

    if (!movement) {
      throw new Error('Stock movement not found');
    }

    if (movement.status !== 'PENDING') {
      throw new Error('Cannot update movement that is not in PENDING status');
    }

    // Recalculate total cost if unit cost or quantity changed
    if (data.unitCost !== undefined || data.quantity !== undefined) {
      const unitCost = data.unitCost !== undefined ? data.unitCost : movement.unitCost;
      const quantity = data.quantity !== undefined ? data.quantity : movement.quantity;
      if (unitCost && quantity) {
        data.totalCost = unitCost * quantity;
      }
    }

    return await prisma.stockMovement.update({
      where: { id },
      data,
      include: {
        warehouse: true
      }
    });
  }

  /**
   * Approve and process stock movement
   */
  async approveMovement(id, tenantId, approvedBy) {
    const movement = await prisma.stockMovement.findFirst({
      where: { id, tenantId }
    });

    if (!movement) {
      throw new Error('Stock movement not found');
    }

    if (movement.status !== 'PENDING') {
      throw new Error('Movement is not in PENDING status');
    }

    return await prisma.$transaction(async (tx) => {
      // Process based on movement type
      switch (movement.type) {
        case 'IN':
          await this.processStockIn(tx, movement, tenantId);
          break;
        case 'OUT':
          await this.processStockOut(tx, movement, tenantId);
          break;
        case 'ADJUSTMENT':
          await this.processStockAdjustment(tx, movement, tenantId);
          break;
        case 'TRANSFER':
          await this.processStockTransfer(tx, movement, tenantId);
          break;
      }

      // Update movement status
      return await tx.stockMovement.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          approvedBy,
          approvedAt: new Date()
        }
      });
    });
  }

  /**
   * Process stock IN movement
   */
  async processStockIn(tx, movement, tenantId) {
    const stock = await tx.warehouseStock.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.warehouseId,
          itemId: movement.itemId
        }
      }
    });

    if (stock) {
      // Update existing stock
      await tx.warehouseStock.update({
        where: {
          warehouseId_itemId: {
            warehouseId: movement.warehouseId,
            itemId: movement.itemId
          }
        },
        data: {
          quantity: { increment: movement.quantity },
          availableQty: { increment: movement.quantity },
          lastPurchasePrice: movement.unitCost || stock.lastPurchasePrice,
          avgCost: movement.unitCost
            ? ((stock.avgCost || 0) * stock.quantity + movement.unitCost * movement.quantity) /
              (stock.quantity + movement.quantity)
            : stock.avgCost
        }
      });
    } else {
      // Create new stock entry
      await tx.warehouseStock.create({
        data: {
          tenantId,
          warehouseId: movement.warehouseId,
          itemId: movement.itemId,
          quantity: movement.quantity,
          availableQty: movement.quantity,
          reservedQty: 0,
          lastPurchasePrice: movement.unitCost,
          avgCost: movement.unitCost
        }
      });
    }

    // Create lot/batch record if provided
    if (movement.lotNumber || movement.batchNumber) {
      await this.createLotBatch(tx, movement, tenantId);
    }
  }

  /**
   * Process stock OUT movement
   */
  async processStockOut(tx, movement, tenantId) {
    const stock = await tx.warehouseStock.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.warehouseId,
          itemId: movement.itemId
        }
      }
    });

    if (!stock || stock.availableQty < movement.quantity) {
      throw new Error('Insufficient stock available');
    }

    await tx.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.warehouseId,
          itemId: movement.itemId
        }
      },
      data: {
        quantity: { decrement: movement.quantity },
        availableQty: { decrement: movement.quantity }
      }
    });

    // Update lot/batch if provided
    if (movement.lotNumber) {
      await this.updateLotBatch(tx, movement.lotNumber, movement.quantity, tenantId);
    }
  }

  /**
   * Process stock ADJUSTMENT movement
   */
  async processStockAdjustment(tx, movement, tenantId) {
    const stock = await tx.warehouseStock.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.warehouseId,
          itemId: movement.itemId
        }
      }
    });

    if (!stock) {
      throw new Error('Stock record not found for adjustment');
    }

    // Adjustment can be positive or negative
    const adjustmentQty = movement.quantity; // Already includes sign

    await tx.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.warehouseId,
          itemId: movement.itemId
        }
      },
      data: {
        quantity: stock.quantity + adjustmentQty,
        availableQty: stock.availableQty + adjustmentQty
      }
    });
  }

  /**
   * Process stock TRANSFER movement
   */
  async processStockTransfer(tx, movement, tenantId) {
    // Deduct from source warehouse
    const sourceStock = await tx.warehouseStock.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.fromWarehouseId,
          itemId: movement.itemId
        }
      }
    });

    if (!sourceStock || sourceStock.availableQty < movement.quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    await tx.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.fromWarehouseId,
          itemId: movement.itemId
        }
      },
      data: {
        quantity: { decrement: movement.quantity },
        availableQty: { decrement: movement.quantity }
      }
    });

    // Add to destination warehouse
    const destStock = await tx.warehouseStock.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: movement.toWarehouseId,
          itemId: movement.itemId
        }
      }
    });

    if (destStock) {
      await tx.warehouseStock.update({
        where: {
          warehouseId_itemId: {
            warehouseId: movement.toWarehouseId,
            itemId: movement.itemId
          }
        },
        data: {
          quantity: { increment: movement.quantity },
          availableQty: { increment: movement.quantity }
        }
      });
    } else {
      await tx.warehouseStock.create({
        data: {
          tenantId,
          warehouseId: movement.toWarehouseId,
          itemId: movement.itemId,
          quantity: movement.quantity,
          availableQty: movement.quantity,
          reservedQty: 0,
          lastPurchasePrice: sourceStock.lastPurchasePrice,
          avgCost: sourceStock.avgCost
        }
      });
    }
  }

  /**
   * Create lot/batch record
   */
  async createLotBatch(tx, movement, tenantId) {
    await tx.lotBatch.create({
      data: {
        tenantId,
        itemId: movement.itemId,
        lotNumber: movement.lotNumber,
        batchNumber: movement.batchNumber,
        serialNumber: movement.serialNumber,
        expiryDate: movement.expiryDate,
        quantity: movement.quantity,
        remainingQty: movement.quantity,
        purchaseOrderId: movement.referenceType === 'PURCHASE_ORDER' ? movement.referenceId : null,
        status: 'ACTIVE'
      }
    });
  }

  /**
   * Update lot/batch record
   */
  async updateLotBatch(tx, lotNumber, quantity, tenantId) {
    const lot = await tx.lotBatch.findUnique({
      where: {
        tenantId_lotNumber: {
          tenantId,
          lotNumber
        }
      }
    });

    if (lot) {
      await tx.lotBatch.update({
        where: {
          tenantId_lotNumber: {
            tenantId,
            lotNumber
          }
        },
        data: {
          remainingQty: { decrement: quantity },
          status: lot.remainingQty - quantity <= 0 ? 'DEPLETED' : 'ACTIVE'
        }
      });
    }
  }

  /**
   * Cancel stock movement
   */
  async cancelMovement(id, tenantId) {
    const movement = await prisma.stockMovement.findFirst({
      where: { id, tenantId }
    });

    if (!movement) {
      throw new Error('Stock movement not found');
    }

    if (movement.status !== 'PENDING') {
      throw new Error('Can only cancel PENDING movements');
    }

    return await prisma.stockMovement.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }

  /**
   * Get stock movement statistics
   */
  async getMovementStatistics(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.warehouseId) {
      where.OR = [
        { warehouseId: filters.warehouseId },
        { fromWarehouseId: filters.warehouseId },
        { toWarehouseId: filters.warehouseId }
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const stats = await prisma.stockMovement.groupBy({
      by: ['type', 'status'],
      where,
      _count: true,
      _sum: {
        quantity: true,
        totalCost: true
      }
    });

    return stats;
  }
}

export default new StockMovementService();
