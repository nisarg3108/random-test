import prisma from '../../config/db.js';

// ==================== FINANCIAL REPORTS ====================

export const generateProfitLossReport = async (tenantId, startDate, endDate) => {
  // Get all expense claims (expenses)
  const expenses = await prisma.expenseClaim.findMany({
    where: {
      tenantId,
      status: 'APPROVED',
      expenseDate: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      category: true,
      employee: true,
    },
  });

  // Calculate total expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const categoryName = expense.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = 0;
    }
    acc[categoryName] += expense.amount;
    return acc;
  }, {});

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // For revenue, we would need a sales/revenue tracking system
  // Placeholder for now - can be extended based on actual revenue data
  const revenue = 0; // TODO: Implement revenue tracking

  const netProfit = revenue - totalExpenses;

  return {
    period: {
      startDate,
      endDate,
    },
    revenue: {
      total: revenue,
      breakdown: {}, // Can be extended
    },
    expenses: {
      total: totalExpenses,
      breakdown: expensesByCategory,
    },
    netProfit,
    profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    generatedAt: new Date(),
  };
};

export const generateBalanceSheetReport = async (tenantId, asOfDate) => {
  // Assets - Inventory Items
  let inventoryItems = [];
  try {
    inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
      },
    });
  } catch (error) {
    console.log('InventoryItem table not available:', error.message);
  }

  const totalInventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  // Assets - Fixed Assets
  let fixedAssets = [];
  try {
    fixedAssets = await prisma.asset.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
    });
  } catch (error) {
    console.log('Asset table not available:', error.message);
  }

  const totalFixedAssets = fixedAssets.reduce(
    (sum, asset) => sum + (asset.purchasePrice || 0),
    0
  );

  // Liabilities - Pending Expenses
  const pendingExpenses = await prisma.expenseClaim.findMany({
    where: {
      tenantId,
      status: 'PENDING',
    },
  });

  const totalPendingExpenses = pendingExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const totalAssets = totalInventoryValue + totalFixedAssets;
  const totalLiabilities = totalPendingExpenses;
  const equity = totalAssets - totalLiabilities;

  return {
    asOfDate,
    assets: {
      current: {
        inventory: totalInventoryValue,
      },
      fixed: {
        equipment: totalFixedAssets,
      },
      total: totalAssets,
    },
    liabilities: {
      current: {
        pendingExpenses: totalPendingExpenses,
      },
      total: totalLiabilities,
    },
    equity: {
      total: equity,
    },
    generatedAt: new Date(),
  };
};

// ==================== HR ANALYTICS ====================

export const generateHRAnalyticsReport = async (tenantId, startDate, endDate) => {
  // Employee statistics
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    include: {
      department: true,
      salaryStructure: true,
    },
  });

  // Department distribution
  const departmentDistribution = employees.reduce((acc, emp) => {
    const deptName = emp.department?.name || 'Unassigned';
    if (!acc[deptName]) {
      acc[deptName] = 0;
    }
    acc[deptName]++;
    return acc;
  }, {});

  // Leave statistics
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      leaveType: true,
      employee: true,
    },
  });

  const leaveStats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'PENDING').length,
    approved: leaveRequests.filter((r) => r.status === 'APPROVED').length,
    rejected: leaveRequests.filter((r) => r.status === 'REJECTED').length,
  };

  // Leave by type
  const leaveByType = leaveRequests.reduce((acc, leave) => {
    const typeName = leave.leaveType.name;
    if (!acc[typeName]) {
      acc[typeName] = 0;
    }
    acc[typeName]++;
    return acc;
  }, {});


  // Payroll stats
  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + (emp.salaryStructure?.netSalary || 0);
  }, 0);

  return {
    period: {
      startDate,
      endDate,
    },
    employees: {
      total: employees.length,
      byDepartment: departmentDistribution,
    },
    leaves: {
      statistics: leaveStats,
      byType: leaveByType,
    },
    payroll: {
      totalMonthlyPayroll: totalPayroll,
      averageSalary: employees.length > 0 ? totalPayroll / employees.length : 0,
    },
    generatedAt: new Date(),
  };
};

// ==================== INVENTORY REPORTS ====================

export const generateInventoryReport = async (tenantId) => {
  let inventoryItems = [];
  try {
    inventoryItems = await prisma.inventoryItem.findMany({
      where: { tenantId },
      include: {
        category: true,
      },
    });
  } catch (error) {
    console.log('InventoryItem table not available:', error.message);
  }

  // Calculate inventory by category
  const inventoryByCategory = inventoryItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = {
        items: 0,
        quantity: 0,
        value: 0,
      };
    }
    acc[categoryName].items++;
    acc[categoryName].quantity += item.quantity;
    acc[categoryName].value += item.quantity * item.unitPrice;
    return acc;
  }, {});

  // Low stock items (quantity < 10)
  const lowStockItems = inventoryItems
    .filter((item) => item.quantity < 10)
    .map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      category: item.category?.name,
    }));

  // High value items (top 10)
  const highValueItems = inventoryItems
    .map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalValue: item.quantity * item.unitPrice,
      category: item.category?.name,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  const totalItems = inventoryItems.length;
  const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return {
    summary: {
      totalItems,
      totalQuantity,
      totalValue,
      averageItemValue: totalItems > 0 ? totalValue / totalItems : 0,
    },
    byCategory: inventoryByCategory,
    lowStock: {
      count: lowStockItems.length,
      items: lowStockItems,
    },
    highValue: {
      items: highValueItems,
    },
    generatedAt: new Date(),
  };
};

// ==================== CUSTOM REPORT BUILDER ====================

export const executeCustomReport = async (tenantId, config) => {
  const { dataSource, filters, columns, aggregations } = config;

  let query = {};
  let include = {};

  // Build dynamic query based on config
  if (filters) {
    Object.keys(filters).forEach((key) => {
      query[key] = filters[key];
    });
  }

  query.tenantId = tenantId;

  let data = [];

  // Execute query based on data source
  try {
    switch (dataSource) {
      case 'employees':
        data = await prisma.employee.findMany({ where: query, include });
        break;
      case 'inventory':
        data = await prisma.inventoryItem.findMany({ where: query, include });
        break;
      case 'expenses':
        data = await prisma.expenseClaim.findMany({ where: query, include });
        break;
      case 'leaves':
        data = await prisma.leaveRequest.findMany({ where: query, include });
        break;
      default:
        throw new Error(`Unsupported data source: ${dataSource}`);
    }
  } catch (error) {
    console.log(`Table for ${dataSource} not available:`, error.message);
    // Return empty data if table doesn't exist
  }

  // Apply column filtering if specified
  if (columns && columns.length > 0) {
    data = data.map((item) => {
      const filtered = {};
      columns.forEach((col) => {
        if (item.hasOwnProperty(col)) {
          filtered[col] = item[col];
        }
      });
      return filtered;
    });
  }

  // Apply aggregations if specified
  let aggregationResults = {};
  if (aggregations) {
    aggregations.forEach((agg) => {
      const { field, operation } = agg;
      switch (operation) {
        case 'sum':
          aggregationResults[`${field}_sum`] = data.reduce(
            (sum, item) => sum + (parseFloat(item[field]) || 0),
            0
          );
          break;
        case 'avg':
          const sum = data.reduce(
            (sum, item) => sum + (parseFloat(item[field]) || 0),
            0
          );
          aggregationResults[`${field}_avg`] = data.length > 0 ? sum / data.length : 0;
          break;
        case 'count':
          aggregationResults[`${field}_count`] = data.length;
          break;
        case 'min':
          aggregationResults[`${field}_min`] = Math.min(
            ...data.map((item) => parseFloat(item[field]) || 0)
          );
          break;
        case 'max':
          aggregationResults[`${field}_max`] = Math.max(
            ...data.map((item) => parseFloat(item[field]) || 0)
          );
          break;
      }
    });
  }

  return {
    data,
    aggregations: aggregationResults,
    totalRecords: data.length,
    generatedAt: new Date(),
  };
};

// ==================== REPORT TEMPLATE MANAGEMENT ====================

export const createReportTemplate = async (templateData, tenantId, userId) => {
  return prisma.reportTemplate.create({
    data: {
      ...templateData,
      tenantId,
      createdBy: userId,
    },
  });
};

export const listReportTemplates = async (tenantId, type = null) => {
  const where = { tenantId, isActive: true };
  if (type) {
    where.type = type;
  }
  
  return prisma.reportTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

export const getReportTemplate = async (templateId, tenantId) => {
  return prisma.reportTemplate.findFirst({
    where: { id: templateId, tenantId },
  });
};

// ==================== SAVED REPORTS ====================

export const saveReport = async (reportData, tenantId, userId) => {
  return prisma.report.create({
    data: {
      ...reportData,
      tenantId,
      generatedBy: userId,
    },
  });
};

export const listReports = async (tenantId, type = null) => {
  const where = { tenantId };
  if (type) {
    where.type = type;
  }
  
  return prisma.report.findMany({
    where,
    include: {
      template: true,
    },
    orderBy: { generatedAt: 'desc' },
    take: 50,
  });
};

export const getReport = async (reportId, tenantId) => {
  return prisma.report.findFirst({
    where: { id: reportId, tenantId },
    include: {
      template: true,
    },
  });
};
