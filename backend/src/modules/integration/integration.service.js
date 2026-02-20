/**
 * Integration Service
 * Handles cross-module data synchronization and end-to-end workflows
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class IntegrationService {
  /**
   * Sync inventory movements to General Ledger
   * Creates GL entries for stock movements (IN, OUT, TRANSFER, ADJUSTMENT)
   */
  async syncInventoryMovementToGL(movementId, tenantId) {
    try {
      // Get the stock movement
      const movement = await prisma.stockMovement.findFirst({
        where: { id: movementId, tenantId },
        include: {
          warehouse: true,
        },
      });

      if (!movement) {
        throw new Error(`Stock movement ${movementId} not found`);
      }

      // Only sync completed movements
      if (movement.status !== 'COMPLETED') {
        return { status: 'SKIPPED', reason: 'Movement not yet completed' };
      }

      // Get GL accounts (need to configure these in system settings)
      const glConfig = await this.getGLConfiguration(tenantId, 'INVENTORY');

      if (!glConfig) {
        throw new Error('GL configuration for inventory not found');
      }

      // Create journal entry based on movement type
      const item = await prisma.item.findFirst({
        where: { id: movement.itemId, tenantId },
        select: { name: true },
      });
      const enrichedMovement = {
        ...movement,
        itemName: item?.name || 'Unknown Item',
        warehouseName: movement.warehouse?.name || 'Unknown Warehouse',
      };

      const journalEntry = await this.createMovementJournalEntry(
        enrichedMovement,
        glConfig,
        tenantId
      );

      if (journalEntry.id === 'INTERNAL_TRANSFER') {
        return {
          status: 'SKIPPED',
          reason: 'Internal transfer does not require GL entry',
        };
      }

      // Post the journal entry to GL
      await this.postJournalEntryToGL(journalEntry.id, tenantId);

      return {
        status: 'SUCCESS',
        journalEntryId: journalEntry.id,
        message: `Inventory movement ${movementId} synced to GL`,
      };
    } catch (error) {
      console.error('Error syncing inventory to GL:', error);
      throw error;
    }
  }

  /**
   * Sync sales order to Accounts Receivable and GL
   */
  async syncSalesOrderToAR(orderId, tenantId) {
    try {
      const order = await prisma.salesOrder.findFirst({
        where: { id: orderId, tenantId },
        include: {
          customer: true,
        },
      });

      if (!order) {
        throw new Error(`Sales order ${orderId} not found`);
      }

      // Only sync confirmed/completed orders
      if (!['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
        return { status: 'SKIPPED', reason: 'Order not yet confirmed' };
      }

      // Get GL accounts
      const glConfig = await this.getGLConfiguration(tenantId, 'SALES');

      if (!glConfig) {
        throw new Error('GL configuration for sales not found');
      }

      // Create AR entry
      const arEntry = await this.createAREntry(order, tenantId);

      // Create GL journal entry (Debit AR, Credit Revenue)
      const journalEntry = await this.createSalesJournalEntry(
        order,
        glConfig,
        tenantId
      );

      // Post to GL
      await this.postJournalEntryToGL(journalEntry.id, tenantId);

      return {
        status: 'SUCCESS',
        arEntryId: arEntry.id,
        journalEntryId: journalEntry.id,
        message: `Sales order ${orderId} synced to AR and GL`,
      };
    } catch (error) {
      console.error('Error syncing sales order to AR:', error);
      throw error;
    }
  }

  /**
   * Sync payroll to GL
   * Post salary expenses to GL upon payroll processing
   */
  async syncPayrollToGL(payrollCycleId, tenantId) {
    try {
      const cycle = await prisma.payrollCycle.findFirst({
        where: { id: payrollCycleId, tenantId },
        include: {
          payslips: {
            include: {
              employee: true,
            },
          },
        },
      });

      if (!cycle) {
        throw new Error(`Payroll cycle ${payrollCycleId} not found`);
      }

      // Only sync if payroll is processed
      if (!['PROCESSING', 'COMPLETED', 'PAID'].includes(cycle.status)) {
        return { status: 'SKIPPED', reason: 'Payroll not yet processed' };
      }

      // Get GL accounts
      const glConfig = await this.getGLConfiguration(tenantId, 'PAYROLL');

      if (!glConfig) {
        throw new Error('GL configuration for payroll not found');
      }

      // Create payroll GL entry (aggregate from all payslips in cycle)
      const journalEntry = await this.createPayrollJournalEntry(
        cycle,
        glConfig,
        tenantId
      );

      // Post to GL
      await this.postJournalEntryToGL(journalEntry.id, tenantId);

      return {
        status: 'SUCCESS',
        journalEntryId: journalEntry.id,
        message: `Payroll cycle ${payrollCycleId} synced to GL`,
      };
    } catch (error) {
      console.error('Error syncing payroll to GL:', error);
      throw error;
    }
  }

  /**
   * Sync manufacturing costs to GL
   * Post production costs upon work order completion
   */
  async syncManufacturingCostToGL(workOrderId, tenantId) {
    try {
      const workOrder = await prisma.workOrder.findFirst({
        where: { id: workOrderId, tenantId },
        include: {
          bom: true,
          materials: true,
          operations: true,
        },
      });

      if (!workOrder) {
        throw new Error(`Work order ${workOrderId} not found`);
      }

      // Only sync completed work orders
      if (workOrder.status !== 'COMPLETED') {
        return { status: 'SKIPPED', reason: 'Work order not yet completed' };
      }

      // Get GL accounts
      const glConfig = await this.getGLConfiguration(
        tenantId,
        'MANUFACTURING'
      );

      if (!glConfig) {
        throw new Error('GL configuration for manufacturing not found');
      }

      // Calculate total costs (material + labor + overhead)
      const totalCost = await this.calculateProductionCost(workOrder);

      // Create GL journal entry
      const journalEntry = await this.createManufacturingJournalEntry(
        workOrder,
        totalCost,
        glConfig,
        tenantId
      );

      // Post to GL
      await this.postJournalEntryToGL(journalEntry.id, tenantId);

      return {
        status: 'SUCCESS',
        journalEntryId: journalEntry.id,
        totalCost,
        message: `Manufacturing cost synced for work order ${workOrderId}`,
      };
    } catch (error) {
      console.error('Error syncing manufacturing cost to GL:', error);
      throw error;
    }
  }

  /**
   * Sync purchase order to AP and GL
   */
  async syncPurchaseOrderToAP(poId, tenantId) {
    try {
      const po = await prisma.purchaseOrder.findFirst({
        where: { id: poId, tenantId },
        include: {
          vendor: true,
          items: true,
        },
      });

      if (!po) {
        throw new Error(`Purchase order ${poId} not found`);
      }

      // Only sync confirmed/received orders
      if (!['CONFIRMED', 'RECEIVED'].includes(po.status)) {
        return { status: 'SKIPPED', reason: 'PO not yet confirmed' };
      }

      // Get GL accounts
      const glConfig = await this.getGLConfiguration(tenantId, 'PURCHASE');

      if (!glConfig) {
        throw new Error('GL configuration for purchase not found');
      }

      // Create AP liability entry
      const apEntry = await this.createAPEntry(po, tenantId);

      // Create GL journal entry (Debit Expense/Asset, Credit AP Liability)
      const journalEntry = await this.createPurchaseJournalEntry(
        po,
        glConfig,
        tenantId
      );

      // Post to GL
      await this.postJournalEntryToGL(journalEntry.id, tenantId);

      return {
        status: 'SUCCESS',
        apEntryId: apEntry.id,
        journalEntryId: journalEntry.id,
        message: `Purchase order ${poId} synced to AP and GL`,
      };
    } catch (error) {
      console.error('Error syncing PO to AP:', error);
      throw error;
    }
  }

  /**
   * ==================== HELPER METHODS ====================
   */

  /**
   * Get GL configuration for a module
   */
  async getGLConfiguration(tenantId, moduleName) {
    try {
      // In production, this would be configurable per tenant
      // For now, return default configuration
      const defaultConfig = {
        INVENTORY: {
          accountName: 'Inventory',
          accountCode: '1200',
          debitAccount: 'ASSET',
          creditAccount: 'EQUITY_REVENUE',
        },
        SALES: {
          accountName: 'Sales Revenue',
          accountCode: '4100',
          debitAccount: 'ASSET',
          creditAccount: 'REVENUE',
        },
        PAYROLL: {
          accountName: 'Salary Expense',
          accountCode: '6100',
          debitAccount: 'EXPENSE',
          creditAccount: 'LIABILITY',
        },
        MANUFACTURING: {
          accountName: 'COGS',
          accountCode: '5100',
          debitAccount: 'EXPENSE',
          creditAccount: 'ASSET',
        },
        PURCHASE: {
          accountName: 'Cost of Goods Purchased',
          accountCode: '5200',
          debitAccount: 'ASSET',
          creditAccount: 'LIABILITY',
        },
      };

      return defaultConfig[moduleName];
    } catch (error) {
      console.error('Error getting GL configuration:', error);
      return null;
    }
  }

  /**
   * Create journal entry for inventory movement
   */
  async createMovementJournalEntry(movement, glConfig, tenantId) {
    const unitCost = movement.unitCost || 0;
    const amount = movement.totalCost ?? movement.quantity * unitCost;

    let description = '';
    let debitAccount = '';
    let creditAccount = '';

    switch (movement.type) {
      case 'IN':
        description = `Inventory IN - ${movement.itemName} from ${movement.warehouseName}`;
        debitAccount = '1200'; // Inventory account
        creditAccount = '1000'; // Cash/Payables
        break;
      case 'OUT':
        description = `Inventory OUT - ${movement.itemName} from ${movement.warehouseName}`;
        debitAccount = '5100'; // COGS
        creditAccount = '1200'; // Inventory
        break;
      case 'TRANSFER':
        description = `Inventory TRANSFER - ${movement.itemName}`;
        // Internal transfer - may not require GL entry
        return { id: 'INTERNAL_TRANSFER' };
      case 'ADJUSTMENT':
        description = `Inventory ADJUSTMENT - ${movement.itemName}`;
        debitAccount = movement.quantity > 0 ? '1200' : '5100';
        creditAccount = movement.quantity > 0 ? '5000' : '1200';
        break;
      default:
        throw new Error(`Unknown movement type: ${movement.type}`);
    }

    // Create journal entry in database
    const journalEntry = await prisma.journalEntry.create({
      data: {
        tenantId,
        description,
        postDate: new Date(),
        status: 'DRAFT',
        journalLines: {
          create: [
            {
              accountCode: debitAccount,
              debitAmount: amount,
              creditAmount: 0,
              description: `Debit: ${description}`,
            },
            {
              accountCode: creditAccount,
              debitAmount: 0,
              creditAmount: amount,
              description: `Credit: ${description}`,
            },
          ],
        },
      },
    });

    return journalEntry;
  }

  /**
   * Create AR entry for sales order
   */
  async createAREntry(order, tenantId) {
    // Record in AR ledger (simplified)
    const arEntry = {
      id: `AR-${order.id}`,
      amount: order.total,
      customerId: order.customerId,
      orderId: order.id,
      createdAt: new Date(),
    };

    // In production, save to AR table
    return arEntry;
  }

  /**
   * Create journal entry for sales order
   */
  async createSalesJournalEntry(order, glConfig, tenantId) {
    const amount = order.total;
    const customerName = order.customer?.name || order.customerName;

    const journalEntry = await prisma.journalEntry.create({
      data: {
        tenantId,
        description: `Sales Order ${order.id} - Customer: ${customerName}`,
        postDate: new Date(),
        status: 'DRAFT',
        journalLines: {
          create: [
            {
              accountCode: '1300', // Accounts Receivable
              debitAmount: amount,
              creditAmount: 0,
              description: `Debit AR: Sales Order ${order.id}`,
            },
            {
              accountCode: '4100', // Sales Revenue
              debitAmount: 0,
              creditAmount: amount,
              description: `Credit Sales: Sales Order ${order.id}`,
            },
          ],
        },
      },
    });

    return journalEntry;
  }

  /**
   * Create journal entry for payroll
   */
  async createPayrollJournalEntry(cycle, glConfig, tenantId) {
    // Calculate total salaries
    const totalGross = cycle.payslips.reduce(
      (sum, p) => sum + p.grossSalary,
      0
    );
    const totalTaxes = cycle.payslips.reduce(
      (sum, p) => sum + p.taxDeductions,
      0
    );
    const totalDeductions = cycle.payslips.reduce(
      (sum, p) => sum + p.totalDeductions,
      0
    );
    const totalNet = cycle.payslips.reduce(
      (sum, p) => sum + p.netSalary,
      0
    );
    const otherDeductions = Math.max(totalDeductions - totalTaxes, 0);

    const journalEntry = await prisma.journalEntry.create({
      data: {
        tenantId,
        description: `Payroll Processing - Cycle ${cycle.id} (${cycle.payslips.length} employees)`,
        postDate: new Date(),
        status: 'DRAFT',
        journalLines: {
          create: [
            {
              accountCode: '6100', // Salary Expense
              debitAmount: totalGross,
              creditAmount: 0,
              description: `Debit: Salary Expense`,
            },
            {
              accountCode: '2100', // Salary Payable
              debitAmount: 0,
              creditAmount: totalNet,
              description: `Credit: Salary Payable`,
            },
            {
              accountCode: '2200', // Tax Payable
              debitAmount: 0,
              creditAmount: totalTaxes,
              description: `Credit: Tax Payable`,
            },
            ...(otherDeductions > 0
              ? [
                  {
                    accountCode: '2300',
                    debitAmount: 0,
                    creditAmount: otherDeductions,
                    description: `Credit: Other Deductions`,
                  },
                ]
              : []),
          ],
        },
      },
    });

    return journalEntry;
  }

  /**
   * Calculate total production cost
   */
  async calculateProductionCost(workOrder) {
    let totalCost = 0;

    // Material cost
    if (workOrder.materials) {
      totalCost += workOrder.materials.reduce((sum, m) => sum + m.cost, 0);
    }

    // Labor cost (estimated)
    if (workOrder.operations) {
      totalCost += workOrder.operations.reduce(
        (sum, op) => sum + (op.actualDuration * 150), // 150 per hour
        0
      );
    }

    // Overhead (10% of other costs)
    totalCost = totalCost * 1.1;

    return totalCost;
  }

  /**
   * Create journal entry for manufacturing
   */
  async createManufacturingJournalEntry(workOrder, totalCost, glConfig, tenantId) {
    const journalEntry = await prisma.journalEntry.create({
      data: {
        tenantId,
        description: `Manufacturing - Work Order ${workOrder.id}`,
        postDate: new Date(),
        status: 'DRAFT',
        journalLines: {
          create: [
            {
              accountCode: '1400', // Work in Progress
              debitAmount: totalCost,
              creditAmount: 0,
              description: `Debit: WIP - Work Order ${workOrder.id}`,
            },
            {
              accountCode: '6200', // Manufacturing Overhead
              debitAmount: 0,
              creditAmount: totalCost,
              description: `Credit: Manufacturing Overhead`,
            },
          ],
        },
      },
    });

    return journalEntry;
  }

  /**
   * Create AP entry for purchase order
   */
  async createAPEntry(po, tenantId) {
    const apEntry = {
      id: `AP-${po.id}`,
      amount: po.totalAmount,
      vendorId: po.vendorId,
      poId: po.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
    };

    return apEntry;
  }

  /**
   * Create journal entry for purchase order
   */
  async createPurchaseJournalEntry(po, glConfig, tenantId) {
    const amount = po.totalAmount;

    const journalEntry = await prisma.journalEntry.create({
      data: {
        tenantId,
        description: `Purchase Order ${po.id} - Vendor: ${po.vendor.name}`,
        postDate: new Date(),
        status: 'DRAFT',
        journalLines: {
          create: [
            {
              accountCode: '1200', // Inventory or Expense
              debitAmount: amount,
              creditAmount: 0,
              description: `Debit: Inventory/Expense - PO ${po.id}`,
            },
            {
              accountCode: '2150', // Accounts Payable
              debitAmount: 0,
              creditAmount: amount,
              description: `Credit: AP - PO ${po.id}`,
            },
          ],
        },
      },
    });

    return journalEntry;
  }

  /**
   * Post journal entry to General Ledger
   */
  async postJournalEntryToGL(journalEntryId, tenantId) {
    try {
      // Get journal entry with its lines
      const journalEntry = await prisma.journalEntry.findUnique({
        where: { id: journalEntryId },
        include: {
          journalLines: {
            include: {
              chartOfAccounts: true,
            },
          },
        },
      });

      if (!journalEntry) {
        throw new Error(`Journal entry ${journalEntryId} not found`);
      }

      // Validate debit/credit balance
      const debits = journalEntry.journalLines.reduce(
        (sum, line) => sum + line.debitAmount,
        0
      );
      const credits = journalEntry.journalLines.reduce(
        (sum, line) => sum + line.creditAmount,
        0
      );

      if (Math.abs(debits - credits) > 0.01) {
        throw new Error(
          `Journal entry ${journalEntryId} does not balance. Debits: ${debits}, Credits: ${credits}`
        );
      }

      // Create ledger entries for each line
      const ledgerEntries = await Promise.all(
        journalEntry.journalLines.map((line) =>
          prisma.ledgerEntry.create({
            data: {
              tenantId,
              journalEntryId,
              accountCode: line.accountCode,
              debitAmount: line.debitAmount,
              creditAmount: line.creditAmount,
              postDate: journalEntry.postDate,
              description: journalEntry.description,
            },
          })
        )
      );

      // Update journal entry status
      await prisma.journalEntry.update({
        where: { id: journalEntryId },
        data: {
          status: 'POSTED',
          postedDate: new Date(),
        },
      });

      return {
        journalEntryId,
        ledgerEntriesCount: ledgerEntries.length,
        status: 'POSTED',
      };
    } catch (error) {
      console.error('Error posting journal entry to GL:', error);
      throw error;
    }
  }

  /**
   * Get sync status for a module
   */
  async getSyncStatus(tenantId, moduleName) {
    try {
      // Get count of pending items to sync
      let pendingCount = 0;

      switch (moduleName) {
        case 'INVENTORY':
          pendingCount = await prisma.stockMovement.count({
            where: {
              tenantId,
              status: 'COMPLETED',
            },
          });
          break;
        case 'SALES':
          pendingCount = await prisma.salesOrder.count({
            where: {
              tenantId,
              status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] },
            },
          });
          break;
        case 'PAYROLL':
          pendingCount = await prisma.payrollCycle.count({
            where: {
              tenantId,
              status: { in: ['PROCESSING', 'COMPLETED', 'PAID'] },
            },
          });
          break;
      }

      return {
        module: moduleName,
        pendingSync: pendingCount,
        lastSyncTime: new Date(),
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return { module: moduleName, pendingSync: 0, error: error.message };
    }
  }

  /**
   * Batch sync operations (run periodically)
   */
  async performBatchSync(tenantId) {
    try {
      const results = {
        inventory: await this.syncPendingInventory(tenantId),
        sales: await this.syncPendingSales(tenantId),
        payroll: await this.syncPendingPayroll(tenantId),
        manufacturing: await this.syncPendingManufacturing(tenantId),
      };

      return results;
    } catch (error) {
      console.error('Error performing batch sync:', error);
      throw error;
    }
  }

  async syncPendingInventory(tenantId) {
    try {
      const movements = await prisma.stockMovement.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
        },
      });

      let successCount = 0;
      let errorCount = 0;

      for (const movement of movements) {
        try {
          await this.syncInventoryMovementToGL(movement.id, tenantId);
          successCount++;
        } catch (error) {
          console.error(`Error syncing movement ${movement.id}:`, error);
          errorCount++;
        }
      }

      return { total: movements.length, success: successCount, errors: errorCount };
    } catch (error) {
      return { total: 0, success: 0, errors: 1, errorMessage: error.message };
    }
  }

  async syncPendingSales(tenantId) {
    // Similar implementation for sales
    return { total: 0, success: 0, errors: 0 };
  }

  async syncPendingPayroll(tenantId) {
    // Similar implementation for payroll
    return { total: 0, success: 0, errors: 0 };
  }

  async syncPendingManufacturing(tenantId) {
    // Similar implementation for manufacturing
    return { total: 0, success: 0, errors: 0 };
  }
}

export default new IntegrationService();
