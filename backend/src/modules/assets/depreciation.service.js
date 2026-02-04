import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// DEPRECIATION CALCULATION SERVICES
// ========================================

/**
 * Calculate straight-line depreciation
 * Formula: (Purchase Price - Salvage Value) / Useful Life in months
 */
const calculateStraightLineDepreciation = (purchasePrice, salvageValue, usefulLifeMonths) => {
  return (purchasePrice - salvageValue) / usefulLifeMonths;
};

/**
 * Calculate declining balance depreciation
 * Formula: Book Value * (Depreciation Rate / 12)
 */
const calculateDecliningBalanceDepreciation = (bookValue, depreciationRate) => {
  return bookValue * (depreciationRate / 100 / 12);
};

/**
 * Calculate depreciation for an asset for a specific month
 */
export const calculateAssetDepreciation = async (assetId, year, month, tenantId) => {
  // Get asset details
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, tenantId },
  });

  if (!asset) {
    throw new Error('Asset not found');
  }

  // Check if asset has depreciation configuration
  if (!asset.depreciationMethod || !asset.usefulLife) {
    throw new Error('Asset does not have depreciation configuration');
  }

  // Check if depreciation already exists for this period
  const existing = await prisma.assetDepreciation.findFirst({
    where: {
      assetId,
      tenantId,
      year,
      month,
    },
  });

  if (existing) {
    return existing;
  }

  // Get previous month's depreciation to get opening value
  let openingValue;
  let accumulatedDepreciation = asset.accumulatedDepreciation || 0;

  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  const previousDepreciation = await prisma.assetDepreciation.findFirst({
    where: {
      assetId,
      tenantId,
      year: previousYear,
      month: previousMonth,
    },
  });

  if (previousDepreciation) {
    openingValue = previousDepreciation.closingValue;
    accumulatedDepreciation = previousDepreciation.accumulatedDepreciation;
  } else {
    openingValue = asset.purchasePrice;
  }

  // Calculate depreciation based on method
  let depreciationAmount = 0;
  const salvageValue = asset.salvageValue || 0;

  if (asset.depreciationMethod === 'STRAIGHT_LINE') {
    depreciationAmount = calculateStraightLineDepreciation(
      asset.purchasePrice,
      salvageValue,
      asset.usefulLife
    );
  } else if (asset.depreciationMethod === 'DECLINING_BALANCE') {
    depreciationAmount = calculateDecliningBalanceDepreciation(
      openingValue,
      asset.depreciationRate || 0
    );
  }

  // Ensure depreciation doesn't go below salvage value
  const closingValue = Math.max(openingValue - depreciationAmount, salvageValue);
  depreciationAmount = openingValue - closingValue;
  accumulatedDepreciation += depreciationAmount;

  // Create depreciation record
  const depreciation = await prisma.assetDepreciation.create({
    data: {
      tenantId,
      assetId,
      year,
      month,
      openingValue,
      depreciationAmount,
      closingValue,
      accumulatedDepreciation,
      method: asset.depreciationMethod,
      rate: asset.depreciationRate || 0,
    },
  });

  // Update asset's current value and accumulated depreciation
  await prisma.asset.update({
    where: { id: assetId },
    data: {
      currentValue: closingValue,
      accumulatedDepreciation,
    },
  });

  return depreciation;
};

/**
 * Calculate depreciation for all assets for a specific period
 */
export const calculateAllAssetsDepreciation = async (year, month, tenantId) => {
  // Get all assets that need depreciation
  const assets = await prisma.asset.findMany({
    where: {
      tenantId,
      status: { notIn: ['DISPOSED', 'RETIRED'] },
      depreciationMethod: { not: null },
      usefulLife: { not: null },
    },
  });

  const results = {
    success: [],
    failed: [],
  };

  for (const asset of assets) {
    try {
      const depreciation = await calculateAssetDepreciation(asset.id, year, month, tenantId);
      results.success.push({
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        depreciation,
      });
    } catch (error) {
      results.failed.push({
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetName: asset.name,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Get depreciation records for an asset
 */
export const getAssetDepreciationHistory = async (assetId, tenantId, limit = 12) => {
  const records = await prisma.assetDepreciation.findMany({
    where: { assetId, tenantId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: limit,
    include: {
      asset: {
        select: {
          assetCode: true,
          name: true,
          purchasePrice: true,
          salvageValue: true,
        },
      },
    },
  });

  return records;
};

/**
 * Get depreciation summary for all assets
 */
export const getDepreciationSummary = async (tenantId, year, month) => {
  const where = { tenantId };

  if (year) {
    where.year = year;
  }

  if (month) {
    where.month = month;
  }

  const records = await prisma.assetDepreciation.findMany({
    where,
    include: {
      asset: {
        select: {
          assetCode: true,
          name: true,
          categoryId: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });

  // Calculate totals
  const totalDepreciation = records.reduce((sum, record) => sum + record.depreciationAmount, 0);
  const totalAccumulatedDepreciation = records.reduce(
    (sum, record) => sum + record.accumulatedDepreciation,
    0
  );

  // Group by category
  const categoryBreakdown = records.reduce((acc, record) => {
    const categoryName = record.asset.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = {
        categoryName,
        count: 0,
        depreciationAmount: 0,
      };
    }
    acc[categoryName].count++;
    acc[categoryName].depreciationAmount += record.depreciationAmount;
    return acc;
  }, {});

  return {
    totalRecords: records.length,
    totalDepreciation,
    totalAccumulatedDepreciation,
    categoryBreakdown: Object.values(categoryBreakdown),
    records,
  };
};

/**
 * Get depreciation report for a specific period
 */
export const getDepreciationReport = async (tenantId, startYear, startMonth, endYear, endMonth) => {
  const records = await prisma.assetDepreciation.findMany({
    where: {
      tenantId,
      OR: [
        {
          year: { gt: startYear },
          year: { lt: endYear },
        },
        {
          year: startYear,
          month: { gte: startMonth },
        },
        {
          year: endYear,
          month: { lte: endMonth },
        },
      ],
    },
    include: {
      asset: {
        include: {
          category: true,
        },
      },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  });

  return records;
};
