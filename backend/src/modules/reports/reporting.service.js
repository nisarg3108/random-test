import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ReportingService {
  // Financial Reports

  async getIncomeStatement(fromDate, toDate, tenantId) {
    try {
      // Revenue
      const revenue = await prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: { tenantId },
          account: { type: 'REVENUE' },
          journalEntry: {
            transactionDate: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            },
            status: 'POSTED'
          }
        },
        _sum: { creditAmount: true }
      });

      // Cost of Goods Sold
      const cogs = await prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: { tenantId },
          account: { type: 'EXPENSE' },
          account: { name: { contains: 'COGS' } },
          journalEntry: {
            transactionDate: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            },
            status: 'POSTED'
          }
        },
        _sum: { debitAmount: true }
      });

      // Operating Expenses
      const opex = await prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: { tenantId },
          account: { type: 'EXPENSE' },
          account: { name: { not: { contains: 'COGS' } } },
          journalEntry: {
            transactionDate: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            },
            status: 'POSTED'
          }
        },
        _sum: { debitAmount: true }
      });

      const totalRevenue = revenue._sum?.creditAmount || 0;
      const totalCOGS = cogs._sum?.debitAmount || 0;
      const grossProfit = totalRevenue - totalCOGS;
      const totalOpEx = opex._sum?.debitAmount || 0;
      const netIncome = grossProfit - totalOpEx;

      return {
        periodFrom: fromDate,
        periodTo: toDate,
        totalRevenue,
        costOfGoodsSold: totalCOGS,
        grossProfit,
        operatingExpenses: totalOpEx,
        netIncome,
        grossProfitMargin: totalRevenue ? ((grossProfit / totalRevenue) * 100).toFixed(2) : 0,
        netProfitMargin: totalRevenue ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw new Error(`Failed to generate income statement: ${error.message}`);
    }
  }

  async getBalanceSheet(asOfDate, tenantId) {
    try {
      // Get all ledger entries up to the date
      const assets = await prisma.ledgerEntry.aggregate({
        where: {
          account: {
            type: 'ASSET',
            tenant: { id: tenantId }
          },
          transactionDate: { lte: new Date(asOfDate) },
          status: 'POSTED'
        },
        _sum: { debitAmount: true }
      });

      const liabilities = await prisma.ledgerEntry.aggregate({
        where: {
          account: {
            type: 'LIABILITY',
            tenant: { id: tenantId }
          },
          transactionDate: { lte: new Date(asOfDate) },
          status: 'POSTED'
        },
        _sum: { creditAmount: true }
      });

      const equity = await prisma.ledgerEntry.aggregate({
        where: {
          account: {
            type: 'EQUITY',
            tenant: { id: tenantId }
          },
          transactionDate: { lte: new Date(asOfDate) },
          status: 'POSTED'
        },
        _sum: { creditAmount: true }
      });

      const totalAssets = assets._sum?.debitAmount || 0;
      const totalLiabilities = liabilities._sum?.creditAmount || 0;
      const totalEquity = equity._sum?.creditAmount || 0;

      return {
        asOfDate,
        assets: {
          total: totalAssets
        },
        liabilities: {
          total: totalLiabilities
        },
        equity: {
          total: totalEquity
        },
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
      };
    } catch (error) {
      throw new Error(`Failed to generate balance sheet: ${error.message}`);
    }
  }

  // Inventory Reports

  async getInventorySummary(tenantId) {
    try {
      const warehouseStats = await prisma.warehouse.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { stockItems: true }
          }
        }
      });

      const totalItems = await prisma.item.count({
        where: { tenantId }
      });

      const totalValue = await prisma.warehouseStock.aggregate({
        where: {
          warehouse: { tenantId }
        },
        _sum: {
          valuation: true
        }
      });

      const lowStock = await prisma.warehouseStock.findMany({
        where: {
          warehouse: { tenantId },
          quantity: {
            lt: prisma.raw('item.minimum_quantity')
          }
        },
        include: {
          item: true,
          warehouse: true
        },
        take: 10
      });

      return {
        totalWarehouses: warehouseStats.length,
        totalItems,
        totalInventoryValue: totalValue._sum?.valuation || 0,
        warehouseStats,
        lowStockItems: lowStock,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to generate inventory summary: ${error.message}`);
    }
  }

  async getStockMovementReport(fromDate, toDate, tenantId) {
    try {
      const movements = await prisma.stockMovement.findMany({
        where: {
          warehouse: { tenantId },
          createdAt: {
            gte: new Date(fromDate),
            lte: new Date(toDate)
          }
        },
        include: {
          item: true,
          warehouse: true
        }
      });

      const byType = {
        IN: movements.filter(m => m.type === 'IN').length,
        OUT: movements.filter(m => m.type === 'OUT').length,
        TRANSFER: movements.filter(m => m.type === 'TRANSFER').length,
        ADJUSTMENT: movements.filter(m => m.type === 'ADJUSTMENT').length
      };

      const byStatus = {
        PENDING: movements.filter(m => m.status === 'PENDING').length,
        APPROVED: movements.filter(m => m.status === 'APPROVED').length,
        COMPLETED: movements.filter(m => m.status === 'COMPLETED').length,
        REJECTED: movements.filter(m => m.status === 'REJECTED').length
      };

      const totalQuantityMoved = movements.reduce((sum, m) => sum + m.quantity, 0);

      return {
        periodFrom: fromDate,
        periodTo: toDate,
        totalMovements: movements.length,
        byType,
        byStatus,
        totalQuantityMoved,
        movements
      };
    } catch (error) {
      throw new Error(`Failed to generate stock movement report: ${error.message}`);
    }
  }

  // Manufacturing Reports

  async getProductionReport(fromDate, toDate, tenantId) {
    try {
      const completedOrders = await prisma.workOrder.findMany({
        where: {
          status: 'COMPLETED',
          completedDate: {
            gte: new Date(fromDate),
            lte: new Date(toDate)
          },
          product: { tenantId }
        },
        include: {
          product: true,
          bom: true,
          _count: {
            select: { operations: true }
          }
        }
      });

      const totalQuantityProduced = completedOrders.reduce((sum, o) => sum + o.quantity, 0);
      const totalCost = completedOrders.reduce((sum, o) => sum + (o.actualCost || 0), 0);
      const avgCostPerUnit = totalQuantityProduced ? totalCost / totalQuantityProduced : 0;

      const efficiency = completedOrders.map(order => {
        const plannedTime = order.plannedDuration || 0;
        const actualTime = order.actualDuration || 0;
        return {
          workOrderNumber: order.workOrderNumber,
          efficiency: plannedTime ? ((plannedTime / actualTime) * 100).toFixed(2) : 0
        };
      });

      return {
        periodFrom: fromDate,
        periodTo: toDate,
        totalOrdersCompleted: completedOrders.length,
        totalQuantityProduced,
        totalCost,
        averageCostPerUnit: avgCostPerUnit.toFixed(2),
        efficiency,
        orders: completedOrders
      };
    } catch (error) {
      throw new Error(`Failed to generate production report: ${error.message}`);
    }
  }

  async getBOMAnalysis(tenantId) {
    try {
      const boms = await prisma.billOfMaterials.findMany({
        where: { tenantId, status: 'ACTIVE' },
        include: {
          product: true,
          items: {
            include: { item: true }
          },
          _count: {
            select: { workOrders: true }
          }
        }
      });

      const analysis = boms.map(bom => ({
        bomNumber: bom.bomNumber,
        product: bom.product?.name,
        version: bom.version,
        itemCount: bom.items.length,
        totalEstimatedCost: bom.items.reduce((sum, i) => 
          sum + ((i.quantity || 0) * (i.unitCost || 0)), 0
        ),
        workOrderCount: bom._count.workOrders,
        lastUsed: bom.updatedAt
      }));

      return {
        totalActiveBOMs: boms.length,
        analysis,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to analyze BOMs: ${error.message}`);
    }
  }

  // Sales & Revenue Reports

  async getSalesReport(fromDate, toDate, tenantId) {
    try {
      const salesTransactions = await prisma.journalEntryLine.findMany({
        where: {
          journalEntry: {
            tenantId,
            transactionDate: {
              gte: new Date(fromDate),
              lte: new Date(toDate)
            },
            status: 'POSTED'
          },
          account: { type: 'REVENUE' }
        },
        include: {
          account: true,
          journalEntry: true
        }
      });

      const totalSales = salesTransactions.reduce((sum, t) => sum + (t.creditAmount || 0), 0);
      
      const byAccount = {};
      salesTransactions.forEach(t => {
        const accountName = t.account?.name || 'Unknown';
        if (!byAccount[accountName]) {
          byAccount[accountName] = 0;
        }
        byAccount[accountName] += t.creditAmount || 0;
      });

      return {
        periodFrom: fromDate,
        periodTo: toDate,
        totalSales,
        transactionCount: salesTransactions.length,
        averageTransactionValue: salesTransactions.length ? (totalSales / salesTransactions.length).toFixed(2) : 0,
        byAccount,
        transactions: salesTransactions
      };
    } catch (error) {
      throw new Error(`Failed to generate sales report: ${error.message}`);
    }
  }

  // Dashboard Summary

  async getDashboardSummary(tenantId) {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [
        pendingApprovals,
        lowStockItems,
        activeWorkOrders,
        monthlyRevenue,
        monthlyExpenses
      ] = await Promise.all([
        prisma.stockMovement.count({
          where: {
            warehouse: { tenantId },
            status: 'PENDING'
          }
        }),
        prisma.warehouseStock.count({
          where: {
            warehouse: { tenantId },
            quantity: { lt: prisma.raw('item.minimum_quantity') }
          }
        }),
        prisma.workOrder.count({
          where: {
            status: { in: ['PLANNED', 'IN_PROGRESS'] },
            product: { tenantId }
          }
        }),
        this.getMonthlyRevenue(firstDayOfMonth, lastDayOfMonth, tenantId),
        this.getMonthlyExpenses(firstDayOfMonth, lastDayOfMonth, tenantId)
      ]);

      return {
        pendingApprovals,
        lowStockItems,
        activeWorkOrders,
        monthlyRevenue,
        monthlyExpenses,
        monthlyProfitMargin: monthlyRevenue ? 
          (((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100).toFixed(2) : 0,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to generate dashboard summary: ${error.message}`);
    }
  }

  async getMonthlyRevenue(fromDate, toDate, tenantId) {
    const revenue = await prisma.journalEntryLine.aggregate({
      where: {
        journalEntry: {
          tenantId,
          transactionDate: { gte: fromDate, lte: toDate },
          status: 'POSTED'
        },
        account: { type: 'REVENUE' }
      },
      _sum: { creditAmount: true }
    });
    return revenue._sum?.creditAmount || 0;
  }

  async getMonthlyExpenses(fromDate, toDate, tenantId) {
    const expenses = await prisma.journalEntryLine.aggregate({
      where: {
        journalEntry: {
          tenantId,
          transactionDate: { gte: fromDate, lte: toDate },
          status: 'POSTED'
        },
        account: { type: 'EXPENSE' }
      },
      _sum: { debitAmount: true }
    });
    return expenses._sum?.debitAmount || 0;
  }

  // Report Scheduling

  async scheduleReport(reportType, schedule, tenantId) {
    try {
      const report = await prisma.scheduledReport.create({
        data: {
          reportType,
          schedule,
          tenantId,
          lastRun: new Date(),
          isActive: true
        }
      });
      return report;
    } catch (error) {
      throw new Error(`Failed to schedule report: ${error.message}`);
    }
  }

  async getScheduledReports(tenantId) {
    try {
      return await prisma.scheduledReport.findMany({
        where: { tenantId, isActive: true }
      });
    } catch (error) {
      throw new Error(`Failed to fetch scheduled reports: ${error.message}`);
    }
  }
}

export default new ReportingService();
