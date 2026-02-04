import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class BranchService {
  /**
   * Create a new branch
   */
  async createBranch(data, tenantId) {
    // Check for duplicate code
    const existing = await prisma.branch.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: data.code
        }
      }
    });

    if (existing) {
      throw new Error('Branch code already exists');
    }

    // If this is the first branch or marked as main, set as main
    if (data.isMainBranch) {
      // Unset other main branches
      await prisma.branch.updateMany({
        where: {
          tenantId,
          isMainBranch: true
        },
        data: { isMainBranch: false }
      });
    }

    return await prisma.branch.create({
      data: {
        ...data,
        tenantId
      },
      include: {
        warehouses: true
      }
    });
  }

  /**
   * Get all branches
   */
  async getAllBranches(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
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

    const branches = await prisma.branch.findMany({
      where,
      include: {
        warehouses: true,
        _count: {
          select: {
            warehouses: true
          }
        }
      },
      orderBy: { isMainBranch: 'desc' }
    });

    return branches;
  }

  /**
   * Get branch by ID
   */
  async getBranchById(id, tenantId) {
    const branch = await prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        warehouses: {
          include: {
            _count: {
              select: {
                stockItems: true,
                stockMovements: true
              }
            }
          }
        },
        _count: {
          select: {
            warehouses: true
          }
        }
      }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  /**
   * Update branch
   */
  async updateBranch(id, data, tenantId) {
    const branch = await prisma.branch.findFirst({
      where: { id, tenantId }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Check for duplicate code if code is being updated
    if (data.code && data.code !== branch.code) {
      const existing = await prisma.branch.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: data.code
          }
        }
      });

      if (existing) {
        throw new Error('Branch code already exists');
      }
    }

    // Handle main branch flag
    if (data.isMainBranch && !branch.isMainBranch) {
      await prisma.branch.updateMany({
        where: {
          tenantId,
          isMainBranch: true
        },
        data: { isMainBranch: false }
      });
    }

    return await prisma.branch.update({
      where: { id },
      data,
      include: {
        warehouses: true
      }
    });
  }

  /**
   * Delete branch
   */
  async deleteBranch(id, tenantId) {
    const branch = await prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            warehouses: true
          }
        }
      }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Cannot delete main branch
    if (branch.isMainBranch) {
      throw new Error('Cannot delete main branch. Set another branch as main first.');
    }

    // Check if branch has warehouses
    if (branch._count.warehouses > 0) {
      throw new Error('Cannot delete branch with existing warehouses');
    }

    return await prisma.branch.delete({
      where: { id }
    });
  }

  /**
   * Set as main branch
   */
  async setAsMainBranch(id, tenantId) {
    const branch = await prisma.branch.findFirst({
      where: { id, tenantId }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Unset current main branch
    await prisma.branch.updateMany({
      where: {
        tenantId,
        isMainBranch: true
      },
      data: { isMainBranch: false }
    });

    // Set this as main
    return await prisma.branch.update({
      where: { id },
      data: { isMainBranch: true }
    });
  }

  /**
   * Get branch statistics
   */
  async getBranchStatistics(id, tenantId) {
    const branch = await prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        warehouses: true
      }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Get warehouse statistics
    const warehouseStats = await Promise.all(
      branch.warehouses.map(async (wh) => {
        const stock = await prisma.warehouseStock.aggregate({
          where: { warehouseId: wh.id },
          _sum: {
            quantity: true,
            reservedQty: true,
            availableQty: true
          },
          _count: true
        });

        const movements = await prisma.stockMovement.count({
          where: {
            OR: [
              { warehouseId: wh.id },
              { fromWarehouseId: wh.id },
              { toWarehouseId: wh.id }
            ]
          }
        });

        return {
          warehouseId: wh.id,
          warehouseName: wh.name,
          totalItems: stock._count,
          totalQuantity: stock._sum.quantity || 0,
          totalMovements: movements
        };
      })
    );

    // Aggregate stats
    const totalQuantity = warehouseStats.reduce((sum, ws) => sum + ws.totalQuantity, 0);
    const totalMovements = warehouseStats.reduce((sum, ws) => sum + ws.totalMovements, 0);

    return {
      branch,
      warehouseCount: branch.warehouses.length,
      warehouseStats,
      totalQuantity,
      totalMovements
    };
  }

  /**
   * Get main branch
   */
  async getMainBranch(tenantId) {
    const mainBranch = await prisma.branch.findFirst({
      where: {
        tenantId,
        isMainBranch: true
      },
      include: {
        warehouses: true
      }
    });

    return mainBranch;
  }

  /**
   * Get branch by code
   */
  async getBranchByCode(code, tenantId) {
    const branch = await prisma.branch.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code
        }
      },
      include: {
        warehouses: true
      }
    });

    if (!branch) {
      throw new Error('Branch not found');
    }

    return branch;
  }

  /**
   * Transfer inventory between branches
   */
  async transferBetweenBranches(data, tenantId, createdBy) {
    const { fromBranchId, toBranchId, itemId, quantity, notes } = data;

    // Validate branches
    const fromBranch = await prisma.branch.findFirst({
      where: { id: fromBranchId, tenantId }
    });

    const toBranch = await prisma.branch.findFirst({
      where: { id: toBranchId, tenantId }
    });

    if (!fromBranch || !toBranch) {
      throw new Error('Invalid branch');
    }

    if (fromBranchId === toBranchId) {
      throw new Error('Cannot transfer to the same branch');
    }

    // Get main warehouse from each branch
    const fromWarehouse = await prisma.warehouse.findFirst({
      where: { branchId: fromBranchId }
    });

    const toWarehouse = await prisma.warehouse.findFirst({
      where: { branchId: toBranchId }
    });

    if (!fromWarehouse || !toWarehouse) {
      throw new Error('Branch does not have a warehouse');
    }

    // Create stock movement
    const count = await prisma.stockMovement.count({ where: { tenantId } });
    const movementNumber = `SM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const movement = await prisma.stockMovement.create({
      data: {
        tenantId,
        movementNumber,
        type: 'TRANSFER',
        reason: 'TRANSFER',
        itemId,
        fromWarehouseId: fromWarehouse.id,
        toWarehouseId: toWarehouse.id,
        quantity,
        status: 'PENDING',
        notes: notes || `Transfer from ${fromBranch.name} to ${toBranch.name}`,
        createdBy
      }
    });

    return movement;
  }
}

export default new BranchService();
