import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// ASSET CATEGORY SERVICES
// ========================================

export const createAssetCategory = async (data, tenantId) => {
  const category = await prisma.assetCategory.create({
    data: {
      ...data,
      tenantId,
    },
  });
  return category;
};

export const listAssetCategories = async (tenantId) => {
  const categories = await prisma.assetCategory.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { assets: true },
      },
    },
  });
  return categories;
};

export const getAssetCategoryById = async (id, tenantId) => {
  const category = await prisma.assetCategory.findFirst({
    where: { id, tenantId },
    include: {
      assets: {
        select: {
          id: true,
          assetCode: true,
          name: true,
          status: true,
        },
      },
    },
  });
  return category;
};

export const updateAssetCategory = async (id, data, tenantId) => {
  const category = await prisma.assetCategory.update({
    where: { id },
    data: {
      ...data,
      tenantId,
    },
  });
  return category;
};

export const deleteAssetCategory = async (id, tenantId) => {
  // Check if category has assets
  const assetCount = await prisma.asset.count({
    where: { categoryId: id, tenantId },
  });

  if (assetCount > 0) {
    throw new Error('Cannot delete category with existing assets');
  }

  await prisma.assetCategory.delete({
    where: { id },
  });
};

// ========================================
// ASSET SERVICES
// ========================================

export const createAsset = async (data, tenantId) => {
  const asset = await prisma.asset.create({
    data: {
      ...data,
      tenantId,
      currentValue: data.purchasePrice, // Initial value equals purchase price
    },
    include: {
      category: true,
    },
  });
  return asset;
};

export const listAssets = async (tenantId, filters = {}) => {
  const where = { tenantId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { assetCode: { contains: filters.search, mode: 'insensitive' } },
      { serialNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      category: true,
      allocations: {
        where: { status: 'ACTIVE' },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
            },
          },
        },
      },
      _count: {
        select: {
          maintenanceSchedules: true,
          depreciationRecords: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assets;
};

export const getAssetById = async (id, tenantId) => {
  const asset = await prisma.asset.findFirst({
    where: { id, tenantId },
    include: {
      category: true,
      allocations: {
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              email: true,
              designation: true,
            },
          },
        },
        orderBy: { allocatedDate: 'desc' },
      },
      maintenanceSchedules: {
        orderBy: { scheduledDate: 'desc' },
      },
      depreciationRecords: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
      },
    },
  });
  return asset;
};

export const updateAsset = async (id, data, tenantId) => {
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...data,
      tenantId,
    },
    include: {
      category: true,
    },
  });
  return asset;
};

export const deleteAsset = async (id, tenantId) => {
  // Check if asset has active allocations
  const activeAllocations = await prisma.assetAllocation.count({
    where: { assetId: id, tenantId, status: 'ACTIVE' },
  });

  if (activeAllocations > 0) {
    throw new Error('Cannot delete asset with active allocations');
  }

  await prisma.asset.delete({
    where: { id },
  });
};

// ========================================
// ASSET STATISTICS
// ========================================

export const getAssetStatistics = async (tenantId) => {
  const [
    totalAssets,
    availableAssets,
    allocatedAssets,
    maintenanceAssets,
    retiredAssets,
    totalValue,
    categoryStats,
  ] = await Promise.all([
    prisma.asset.count({ where: { tenantId } }),
    prisma.asset.count({ where: { tenantId, status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { tenantId, status: 'ALLOCATED' } }),
    prisma.asset.count({ where: { tenantId, status: 'MAINTENANCE' } }),
    prisma.asset.count({ where: { tenantId, status: 'RETIRED' } }),
    prisma.asset.aggregate({
      where: { tenantId },
      _sum: { currentValue: true, purchasePrice: true },
    }),
    prisma.asset.groupBy({
      by: ['categoryId'],
      where: { tenantId },
      _count: true,
    }),
  ]);

  const categories = await prisma.assetCategory.findMany({
    where: {
      id: { in: categoryStats.map((s) => s.categoryId) },
      tenantId,
    },
    select: { id: true, name: true },
  });

  const categoryBreakdown = categoryStats.map((stat) => {
    const category = categories.find((c) => c.id === stat.categoryId);
    return {
      categoryId: stat.categoryId,
      categoryName: category?.name || 'Unknown',
      count: stat._count,
    };
  });

  return {
    totalAssets,
    availableAssets,
    allocatedAssets,
    maintenanceAssets,
    retiredAssets,
    totalPurchaseValue: totalValue._sum.purchasePrice || 0,
    totalCurrentValue: totalValue._sum.currentValue || 0,
    categoryBreakdown,
  };
};
