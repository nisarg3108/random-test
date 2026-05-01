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
  // Validate required fields
  if (!data.categoryId) {
    throw new Error('Asset category is required');
  }
  if (!data.name) {
    throw new Error('Asset name is required');
  }
  if (!data.purchaseDate) {
    throw new Error('Purchase date is required');
  }
  if (!data.purchasePrice) {
    throw new Error('Purchase price is required');
  }

  // Fetch category to get default values
  const category = await prisma.assetCategory.findFirst({
    where: { 
      id: data.categoryId,
      tenantId 
    },
  });

  if (!category) {
    throw new Error('Asset category not found');
  }

  // Generate asset code if not provided
  const assetCode = data.assetCode || `AST${Date.now()}`;

  // Apply category defaults if asset-specific values not provided
  const assetData = {
    tenantId,
    categoryId: data.categoryId,
    assetCode,
    name: data.name,
    description: data.description || null,
    purchaseDate: new Date(data.purchaseDate),
    purchasePrice: parseFloat(data.purchasePrice),
    vendor: data.vendor || null,
    invoiceNumber: data.invoiceNumber || null,
    serialNumber: data.serialNumber || null,
    model: data.model || null,
    manufacturer: data.manufacturer || null,
    location: data.location || null,
    status: data.status || 'AVAILABLE',
    condition: data.condition || 'GOOD',
    depreciationMethod: data.depreciationMethod || category.defaultDepreciationMethod || null,
    depreciationRate: data.depreciationRate !== undefined && data.depreciationRate !== null && data.depreciationRate !== '' 
      ? parseFloat(data.depreciationRate) 
      : category.defaultDepreciationRate || null,
    usefulLife: data.usefulLife !== undefined && data.usefulLife !== null && data.usefulLife !== '' 
      ? parseInt(data.usefulLife) 
      : category.defaultUsefulLife || null,
    salvageValue: data.salvageValue !== undefined && data.salvageValue !== null && data.salvageValue !== '' 
      ? parseFloat(data.salvageValue) 
      : 0,
    totalExpectedUnits: data.totalExpectedUnits !== undefined && data.totalExpectedUnits !== null && data.totalExpectedUnits !== '' 
      ? parseInt(data.totalExpectedUnits) 
      : null,
    unitsProducedToDate: 0,
    currentValue: parseFloat(data.purchasePrice),
    accumulatedDepreciation: 0,
    warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
    insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
    insuranceProvider: data.insuranceProvider || null,
    insurancePolicyNo: data.insurancePolicyNo || null,
    notes: data.notes || null,
    tags: data.tags || null,
  };

  const asset = await prisma.asset.create({
    data: assetData,
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
  // Build update data object with only provided fields
  const updateData = {
    tenantId,
  };

  // Only include fields that are provided
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.assetCode !== undefined) updateData.assetCode = data.assetCode;
  if (data.purchaseDate !== undefined) updateData.purchaseDate = new Date(data.purchaseDate);
  if (data.purchasePrice !== undefined) updateData.purchasePrice = parseFloat(data.purchasePrice);
  if (data.vendor !== undefined) updateData.vendor = data.vendor || null;
  if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber || null;
  if (data.serialNumber !== undefined) updateData.serialNumber = data.serialNumber || null;
  if (data.model !== undefined) updateData.model = data.model || null;
  if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer || null;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.condition !== undefined) updateData.condition = data.condition;
  if (data.depreciationMethod !== undefined) updateData.depreciationMethod = data.depreciationMethod || null;
  if (data.depreciationRate !== undefined && data.depreciationRate !== null && data.depreciationRate !== '') {
    updateData.depreciationRate = parseFloat(data.depreciationRate);
  } else if (data.depreciationRate === '' || data.depreciationRate === null) {
    updateData.depreciationRate = null;
  }
  if (data.usefulLife !== undefined && data.usefulLife !== null && data.usefulLife !== '') {
    updateData.usefulLife = parseInt(data.usefulLife);
  } else if (data.usefulLife === '' || data.usefulLife === null) {
    updateData.usefulLife = null;
  }
  if (data.salvageValue !== undefined && data.salvageValue !== null && data.salvageValue !== '') {
    updateData.salvageValue = parseFloat(data.salvageValue);
  } else if (data.salvageValue === '' || data.salvageValue === null) {
    updateData.salvageValue = 0;
  }
  if (data.totalExpectedUnits !== undefined && data.totalExpectedUnits !== null && data.totalExpectedUnits !== '') {
    updateData.totalExpectedUnits = parseInt(data.totalExpectedUnits);
  } else if (data.totalExpectedUnits === '' || data.totalExpectedUnits === null) {
    updateData.totalExpectedUnits = null;
  }
  if (data.warrantyExpiry !== undefined) updateData.warrantyExpiry = data.warrantyExpiry ? new Date(data.warrantyExpiry) : null;
  if (data.insuranceExpiry !== undefined) updateData.insuranceExpiry = data.insuranceExpiry ? new Date(data.insuranceExpiry) : null;
  if (data.insuranceProvider !== undefined) updateData.insuranceProvider = data.insuranceProvider || null;
  if (data.insurancePolicyNo !== undefined) updateData.insurancePolicyNo = data.insurancePolicyNo || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.tags !== undefined) updateData.tags = data.tags || null;

  const asset = await prisma.asset.update({
    where: { id },
    data: updateData,
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
