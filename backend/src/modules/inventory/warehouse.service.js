import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class WarehouseService {
  /**
   * Create a new warehouse
   */
  async createWarehouse(data, tenantId) {
    // Generate warehouse code if not provided
    if (!data.code) {
      const count = await prisma.warehouse.count({ where: { tenantId } });
      data.code = `WH${String(count + 1).padStart(4, '0')}`;
    }

    // Check for duplicate code
    const existing = await prisma.warehouse.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: data.code
        }
      }
    });

    if (existing) {
      throw new Error('Warehouse code already exists');
    }

    // Map location to address if provided
    const warehouseData = { ...data };
    if (data.location && !data.address) {
      warehouseData.address = data.location;
      delete warehouseData.location;
    }

    return await prisma.warehouse.create({
      data: {
        ...warehouseData,
        tenantId
      },
      include: {
        branch: true,
        stockItems: true
      }
    });
  }

  /**
   * Get all warehouses for a tenant
   */
  async getAllWarehouses(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        branch: true,
        _count: {
          select: {
            stockItems: true,
            stockMovements: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return warehouses;
  }

  /**
   * Get warehouse by ID
   */
  async getWarehouseById(id, tenantId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: {
        branch: true,
        stockItems: {
          include: {
            warehouse: true
          }
        },
        _count: {
          select: {
            stockItems: true,
            stockMovements: true
          }
        }
      }
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    return warehouse;
  }

  /**
   * Update warehouse
   */
  async updateWarehouse(id, data, tenantId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId }
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Check for duplicate code if code is being updated
    if (data.code && data.code !== warehouse.code) {
      const existing = await prisma.warehouse.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: data.code
          }
        }
      });

      if (existing) {
        throw new Error('Warehouse code already exists');
      }
    }

    return await prisma.warehouse.update({
      where: { id },
      data,
      include: {
        branch: true,
        stockItems: true
      }
    });
  }

  /**
   * Delete warehouse
   */
  async deleteWarehouse(id, tenantId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            stockItems: true,
            stockMovements: true
          }
        }
      }
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Check if warehouse has stock items
    if (warehouse._count.stockItems > 0) {
      throw new Error('Cannot delete warehouse with existing stock items');
    }

    return await prisma.warehouse.delete({
      where: { id }
    });
  }

  /**
   * Get warehouse statistics
   */
  async getWarehouseStatistics(id, tenantId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId }
    });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Get stock statistics
    const stockStats = await prisma.warehouseStock.aggregate({
      where: { warehouseId: id, tenantId },
      _sum: {
        quantity: true,
        reservedQty: true,
        availableQty: true
      },
      _count: true
    });

    // Get low stock items
    const lowStockItems = await prisma.warehouseStock.findMany({
      where: {
        warehouseId: id,
        tenantId,
        availableQty: {
          lte: prisma.warehouseStock.fields.reorderPoint
        }
      },
      take: 10
    });

    // Get recent stock movements
    const recentMovements = await prisma.stockMovement.findMany({
      where: {
        OR: [
          { warehouseId: id },
          { fromWarehouseId: id },
          { toWarehouseId: id }
        ],
        tenantId
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Calculate utilization if capacity is set
    let utilization = null;
    if (warehouse.capacity) {
      const totalVolume = stockStats._sum.quantity || 0;
      utilization = (totalVolume / warehouse.capacity) * 100;
    }

    return {
      warehouse,
      totalItems: stockStats._count,
      totalQuantity: stockStats._sum.quantity || 0,
      reservedQuantity: stockStats._sum.reservedQty || 0,
      availableQuantity: stockStats._sum.availableQty || 0,
      utilization,
      lowStockItems,
      recentMovements
    };
  }

  /**
   * Get warehouse stock items with filters
   */
  async getWarehouseStock(warehouseId, tenantId, filters = {}) {
    const where = {
      warehouseId,
      tenantId
    };

    if (filters.lowStock) {
      where.availableQty = {
        lte: prisma.warehouseStock.fields.reorderPoint
      };
    }

    if (filters.zone) {
      where.zone = filters.zone;
    }

    if (filters.search) {
      // This would require joining with Item model
      // For now, we'll return all and filter in the controller
    }

    const stockItems = await prisma.warehouseStock.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    return stockItems;
  }

  /**
   * Update warehouse stock
   */
  async updateWarehouseStock(warehouseId, itemId, data, tenantId) {
    const stock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId,
          itemId
        }
      }
    });

    if (!stock) {
      // Create new stock entry
      return await prisma.warehouseStock.create({
        data: {
          warehouseId,
          itemId,
          tenantId,
          ...data,
          availableQty: (data.quantity || 0) - (data.reservedQty || 0)
        }
      });
    }

    // Update existing stock
    const updatedData = { ...data };
    if (data.quantity !== undefined || data.reservedQty !== undefined) {
      const newQty = data.quantity !== undefined ? data.quantity : stock.quantity;
      const newReserved = data.reservedQty !== undefined ? data.reservedQty : stock.reservedQty;
      updatedData.availableQty = newQty - newReserved;
    }

    return await prisma.warehouseStock.update({
      where: {
        warehouseId_itemId: {
          warehouseId,
          itemId
        }
      },
      data: updatedData
    });
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(data, tenantId) {
    const { fromWarehouseId, toWarehouseId, itemId, quantity, notes } = data;

    // Validate source warehouse has enough stock
    const sourceStock = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_itemId: {
          warehouseId: fromWarehouseId,
          itemId
        }
      }
    });

    if (!sourceStock || sourceStock.availableQty < quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    // Create stock movement record
    const movementCount = await prisma.stockMovement.count({
      where: { tenantId }
    });
    const movementNumber = `SM-${new Date().getFullYear()}-${String(movementCount + 1).padStart(4, '0')}`;

    const movement = await prisma.stockMovement.create({
      data: {
        tenantId,
        movementNumber,
        type: 'TRANSFER',
        reason: 'TRANSFER',
        itemId,
        fromWarehouseId,
        toWarehouseId,
        quantity,
        status: 'PENDING',
        notes,
        createdBy: data.createdBy
      }
    });

    return movement;
  }

  /**
   * Complete stock transfer
   */
  async completeStockTransfer(movementId, tenantId, approvedBy) {
    const movement = await prisma.stockMovement.findFirst({
      where: { id: movementId, tenantId, type: 'TRANSFER', status: 'PENDING' }
    });

    if (!movement) {
      throw new Error('Transfer not found or already completed');
    }

    return await prisma.$transaction(async (tx) => {
      // Deduct from source warehouse
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
            reservedQty: 0
          }
        });
      }

      // Update movement status
      return await tx.stockMovement.update({
        where: { id: movementId },
        data: {
          status: 'COMPLETED',
          approvedBy,
          approvedAt: new Date()
        }
      });
    });
  }
}

export default new WarehouseService();
