import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class BOMService {
  /**
   * Create a new Bill of Materials
   */
  async createBOM(data, tenantId, createdBy) {
    // Generate BOM number
    const count = await prisma.billOfMaterials.count({ where: { tenantId } });
    const bomNumber = `BOM-${String(count + 1).padStart(4, '0')}`;

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new Error('BOM must have at least one item');
    }

    // Calculate total cost
    const totalCost = this.calculateBOMCost(data);

    const bom = await prisma.billOfMaterials.create({
      data: {
        ...data,
        bomNumber,
        tenantId,
        createdBy,
        totalCost,
        items: {
          create: data.items.map((item, index) => ({
            ...item,
            sequence: index + 1,
            totalCost: (item.unitCost || 0) * (item.quantity || 0)
          }))
        }
      },
      include: {
        items: true
      }
    });

    return bom;
  }

  /**
   * Calculate total BOM cost
   */
  calculateBOMCost(data) {
    if (!data.items) return 0;
    
    let totalCost = 0;
    if (data.materialCost) totalCost += data.materialCost;
    if (data.laborCost) totalCost += data.laborCost;
    if (data.overheadCost) totalCost += data.overheadCost;
    
    // Add item costs if not explicitly set
    if (totalCost === 0 && data.items) {
      totalCost = data.items.reduce((sum, item) => {
        return sum + ((item.unitCost || 0) * (item.quantity || 0));
      }, 0);
    }
    
    return totalCost;
  }

  /**
   * Get all BOMs
   */
  async getAllBOMs(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.isDefault !== undefined) {
      where.isDefault = filters.isDefault;
    }

    if (filters.search) {
      where.OR = [
        { bomNumber: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const boms = await prisma.billOfMaterials.findMany({
      where,
      include: {
        items: {
          orderBy: { sequence: 'asc' }
        },
        _count: {
          select: {
            workOrders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return boms;
  }

  /**
   * Get BOM by ID
   */
  async getBOMById(id, tenantId) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          orderBy: { sequence: 'asc' }
        }
      }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    return bom;
  }

  /**
   * Get default BOM for product
   */
  async getDefaultBOM(productId, tenantId) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: {
        productId,
        tenantId,
        isDefault: true,
        isActive: true
      },
      include: {
        items: {
          orderBy: { sequence: 'asc' }
        }
      }
    });

    return bom || null;
  }

  /**
   * Update BOM
   */
  async updateBOM(id, data, tenantId) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id, tenantId }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    // Only allow updates to draft BOMs
    if (bom.status !== 'DRAFT') {
      throw new Error('Can only update draft BOMs');
    }

    const updateData = { ...data };

    // Recalculate cost if items are updated
    if (data.items) {
      // Delete existing items
      await prisma.bomItem.deleteMany({
        where: { bomId: id }
      });

      updateData.items = {
        create: data.items.map((item, index) => ({
          ...item,
          sequence: index + 1,
          totalCost: (item.unitCost || 0) * (item.quantity || 0)
        }))
      };

      updateData.totalCost = this.calculateBOMCost(data);
    }

    return await prisma.billOfMaterials.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { sequence: 'asc' }
        }
      }
    });
  }

  /**
   * Set BOM as default
   */
  async setAsDefault(id, tenantId) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id, tenantId }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    // Unset other default BOMs for the same product
    await prisma.billOfMaterials.updateMany({
      where: {
        productId: bom.productId,
        tenantId,
        isDefault: true
      },
      data: { isDefault: false }
    });

    // Set this BOM as default
    return await prisma.billOfMaterials.update({
      where: { id },
      data: { isDefault: true }
    });
  }

  /**
   * Activate BOM (move from DRAFT to ACTIVE)
   */
  async activateBOM(id, tenantId) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id, tenantId }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    if (bom.status !== 'DRAFT') {
      throw new Error('Can only activate draft BOMs');
    }

    if (!bom.items || bom.items.length === 0) {
      throw new Error('Cannot activate BOM without items');
    }

    return await prisma.billOfMaterials.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        effectiveFrom: new Date()
      },
      include: {
        items: true
      }
    });
  }

  /**
   * Archive BOM
   */
  async archiveBOM(id, tenantId) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id, tenantId }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    return await prisma.billOfMaterials.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        effectiveTo: new Date(),
        isActive: false
      }
    });
  }

  /**
   * Delete BOM
   */
  async deleteBOM(id, tenantId) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            workOrders: true
          }
        }
      }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    if (bom.status !== 'DRAFT') {
      throw new Error('Can only delete draft BOMs');
    }

    if (bom._count.workOrders > 0) {
      throw new Error('Cannot delete BOM with associated work orders');
    }

    // Delete items first
    await prisma.bomItem.deleteMany({
      where: { bomId: id }
    });

    return await prisma.billOfMaterials.delete({
      where: { id }
    });
  }

  /**
   * Clone BOM
   */
  async cloneBOM(id, tenantId, newVersion, createdBy) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id, tenantId },
      include: {
        items: true
      }
    });

    if (!bom) {
      throw new Error('BOM not found');
    }

    const count = await prisma.billOfMaterials.count({ where: { tenantId } });
    const bomNumber = `BOM-${String(count + 1).padStart(4, '0')}`;

    return await prisma.billOfMaterials.create({
      data: {
        bomNumber,
        tenantId,
        createdBy,
        productId: bom.productId,
        version: newVersion || `${parseFloat(bom.version) + 0.1}`,
        name: `${bom.name} (v${newVersion})`,
        description: bom.description,
        quantity: bom.quantity,
        unit: bom.unit,
        materialCost: bom.materialCost,
        laborCost: bom.laborCost,
        overheadCost: bom.overheadCost,
        totalCost: bom.totalCost,
        status: 'DRAFT',
        isActive: false,
        isDefault: false,
        items: {
          create: bom.items.map(item => ({
            itemId: item.itemId,
            sequence: item.sequence,
            quantity: item.quantity,
            unit: item.unit,
            warehouseId: item.warehouseId,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            alternativeItems: item.alternativeItems,
            scrapPercentage: item.scrapPercentage,
            notes: item.notes
          }))
        }
      },
      include: {
        items: true
      }
    });
  }
}

export default new BOMService();
