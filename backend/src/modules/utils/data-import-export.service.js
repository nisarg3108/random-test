import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const prisma = new PrismaClient();

class DataImportExportService {
  // ==================== IMPORT FUNCTIONS ====================

  /**
   * Import items from CSV
   * Expected columns: name, description, sku, category, unitPrice, quantity, minStockLevel, unit
   */
  async importItems(csvData, tenantId) {
    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      const results = {
        success: [],
        errors: []
      };

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          // Validate required fields
          if (!record.name || !record.sku) {
            results.errors.push({
              row: i + 2,
              data: record,
              error: 'Missing required fields: name and sku are required'
            });
            continue;
          }

          // Check for duplicate SKU
          const existing = await prisma.item.findFirst({
            where: { 
              sku: record.sku,
              tenantId
            }
          });

          if (existing) {
            results.errors.push({
              row: i + 2,
              data: record,
              error: `Item with SKU ${record.sku} already exists`
            });
            continue;
          }

          // Create item
          const item = await prisma.item.create({
            data: {
              name: record.name,
              description: record.description || null,
              sku: record.sku,
              category: record.category || 'General',
              unitPrice: parseFloat(record.unitPrice) || 0,
              quantity: parseInt(record.quantity) || 0,
              minStockLevel: parseInt(record.minStockLevel) || 0,
              unit: record.unit || 'pcs',
              tenantId
            }
          });

          results.success.push({
            row: i + 2,
            id: item.id,
            name: item.name,
            sku: item.sku
          });
        } catch (error) {
          results.errors.push({
            row: i + 2,
            data: record,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Import warehouses from CSV
   * Expected columns: code, name, type, location, capacity
   */
  async importWarehouses(csvData, tenantId) {
    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      const results = {
        success: [],
        errors: []
      };

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          if (!record.code || !record.name) {
            results.errors.push({
              row: i + 2,
              data: record,
              error: 'Missing required fields: code and name are required'
            });
            continue;
          }

          const existing = await prisma.warehouse.findFirst({
            where: { 
              code: record.code,
              tenantId
            }
          });

          if (existing) {
            results.errors.push({
              row: i + 2,
              data: record,
              error: `Warehouse with code ${record.code} already exists`
            });
            continue;
          }

          const warehouse = await prisma.warehouse.create({
            data: {
              code: record.code,
              name: record.name,
              type: record.type || 'MAIN',
              location: record.location || null,
              capacity: record.capacity ? parseFloat(record.capacity) : null,
              status: 'ACTIVE',
              tenantId
            }
          });

          results.success.push({
            row: i + 2,
            id: warehouse.id,
            code: warehouse.code,
            name: warehouse.name
          });
        } catch (error) {
          results.errors.push({
            row: i + 2,
            data: record,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Import journal entries from CSV
   * Expected columns: date, description, reference, accountCode, debit, credit
   * Multiple lines with same date+reference will be grouped into one journal entry
   */
  async importJournalEntries(csvData, tenantId) {
    try {
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      const results = {
        success: [],
        errors: []
      };

      // Group records by date and reference
      const grouped = {};
      records.forEach((record, index) => {
        const key = `${record.date}-${record.reference || 'AUTO'}`;
        if (!grouped[key]) {
          grouped[key] = {
            date: record.date,
            reference: record.reference,
            description: record.description,
            lines: [],
            startRow: index + 2
          };
        }
        grouped[key].lines.push({
          accountCode: record.accountCode,
          debit: parseFloat(record.debit) || 0,
          credit: parseFloat(record.credit) || 0,
          row: index + 2
        });
      });

      for (const [key, entry] of Object.entries(grouped)) {
        try {
          // Validate balanced entry
          const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
          const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

          if (Math.abs(totalDebit - totalCredit) > 0.01) {
            results.errors.push({
              row: entry.startRow,
              data: entry,
              error: `Entry not balanced: Debit ${totalDebit} != Credit ${totalCredit}`
            });
            continue;
          }

          // Get accounts
          const accountCodes = entry.lines.map(l => l.accountCode);
          const accounts = await prisma.chartOfAccounts.findMany({
            where: {
              code: { in: accountCodes },
              tenantId
            }
          });

          if (accounts.length !== accountCodes.length) {
            results.errors.push({
              row: entry.startRow,
              data: entry,
              error: 'One or more account codes not found'
            });
            continue;
          }

          // Create journal entry with lines
          const journalEntry = await prisma.journalEntry.create({
            data: {
              date: new Date(entry.date),
              reference: entry.reference || `JE-${Date.now()}`,
              description: entry.description,
              status: 'DRAFT',
              tenantId,
              lines: {
                create: entry.lines.map(line => {
                  const account = accounts.find(a => a.code === line.accountCode);
                  return {
                    accountId: account.id,
                    debit: line.debit,
                    credit: line.credit,
                    tenantId
                  };
                })
              }
            },
            include: {
              lines: true
            }
          });

          results.success.push({
            row: entry.startRow,
            id: journalEntry.id,
            reference: journalEntry.reference,
            lines: journalEntry.lines.length
          });
        } catch (error) {
          results.errors.push({
            row: entry.startRow,
            data: entry,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  // ==================== EXPORT FUNCTIONS ====================

  /**
   * Export items to CSV
   */
  async exportItems(tenantId, filters = {}) {
    try {
      const items = await prisma.item.findMany({
        where: {
          tenantId,
          ...filters
        },
        orderBy: { name: 'asc' }
      });

      const records = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        sku: item.sku,
        category: item.category,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        minStockLevel: item.minStockLevel,
        unit: item.unit,
        status: item.status,
        createdAt: item.createdAt.toISOString()
      }));

      const csv = stringify(records, {
        header: true,
        columns: [
          'id', 'name', 'description', 'sku', 'category', 
          'unitPrice', 'quantity', 'minStockLevel', 'unit', 
          'status', 'createdAt'
        ]
      });

      return csv;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Export warehouses to CSV
   */
  async exportWarehouses(tenantId) {
    try {
      const warehouses = await prisma.warehouse.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { stock: true }
          }
        },
        orderBy: { code: 'asc' }
      });

      const records = warehouses.map(wh => ({
        id: wh.id,
        code: wh.code,
        name: wh.name,
        type: wh.type,
        location: wh.location || '',
        capacity: wh.capacity || '',
        status: wh.status,
        itemCount: wh._count.stock,
        createdAt: wh.createdAt.toISOString()
      }));

      const csv = stringify(records, {
        header: true,
        columns: [
          'id', 'code', 'name', 'type', 'location', 
          'capacity', 'status', 'itemCount', 'createdAt'
        ]
      });

      return csv;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Export warehouse stock to CSV
   */
  async exportWarehouseStock(tenantId, warehouseId = null) {
    try {
      const where = { tenantId };
      if (warehouseId) {
        where.warehouseId = parseInt(warehouseId);
      }

      const stock = await prisma.warehouseStock.findMany({
        where,
        include: {
          warehouse: true,
          item: true
        },
        orderBy: [
          { warehouseId: 'asc' },
          { item: { name: 'asc' } }
        ]
      });

      const records = stock.map(s => ({
        warehouseCode: s.warehouse.code,
        warehouseName: s.warehouse.name,
        itemName: s.item.name,
        itemSKU: s.item.sku,
        quantity: s.quantity,
        reservedQuantity: s.reservedQuantity,
        availableQuantity: s.quantity - s.reservedQuantity,
        location: s.location || '',
        lastUpdated: s.updatedAt.toISOString()
      }));

      const csv = stringify(records, {
        header: true,
        columns: [
          'warehouseCode', 'warehouseName', 'itemName', 'itemSKU',
          'quantity', 'reservedQuantity', 'availableQuantity',
          'location', 'lastUpdated'
        ]
      });

      return csv;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Export chart of accounts to CSV
   */
  async exportChartOfAccounts(tenantId) {
    try {
      const accounts = await prisma.chartOfAccounts.findMany({
        where: { tenantId },
        include: {
          parent: {
            select: { code: true, name: true }
          }
        },
        orderBy: { code: 'asc' }
      });

      const records = accounts.map(acc => ({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parentCode: acc.parent?.code || '',
        parentName: acc.parent?.name || '',
        description: acc.description || '',
        status: acc.status,
        createdAt: acc.createdAt.toISOString()
      }));

      const csv = stringify(records, {
        header: true,
        columns: [
          'code', 'name', 'type', 'parentCode', 'parentName',
          'description', 'status', 'createdAt'
        ]
      });

      return csv;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Export general ledger to CSV
   */
  async exportGeneralLedger(tenantId, startDate, endDate) {
    try {
      const where = {
        tenantId,
        date: {}
      };

      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }

      const entries = await prisma.ledgerEntry.findMany({
        where,
        include: {
          account: true,
          journalEntry: true
        },
        orderBy: [
          { date: 'asc' },
          { account: { code: 'asc' } }
        ]
      });

      const records = entries.map(entry => ({
        date: entry.date.toISOString().split('T')[0],
        accountCode: entry.account.code,
        accountName: entry.account.name,
        reference: entry.journalEntry?.reference || '',
        description: entry.description,
        debit: entry.debit,
        credit: entry.credit,
        balance: entry.balance,
        status: entry.status
      }));

      const csv = stringify(records, {
        header: true,
        columns: [
          'date', 'accountCode', 'accountName', 'reference',
          'description', 'debit', 'credit', 'balance', 'status'
        ]
      });

      return csv;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Export stock movements to CSV
   */
  async exportStockMovements(tenantId, startDate, endDate) {
    try {
      const where = {
        tenantId,
        date: {}
      };

      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }

      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          item: true,
          sourceWarehouse: true,
          targetWarehouse: true,
          createdBy: { select: { name: true } }
        },
        orderBy: { date: 'desc' }
      });

      const records = movements.map(mov => ({
        date: mov.date.toISOString().split('T')[0],
        type: mov.type,
        itemName: mov.item.name,
        itemSKU: mov.item.sku,
        quantity: mov.quantity,
        sourceWarehouse: mov.sourceWarehouse?.code || '',
        targetWarehouse: mov.targetWarehouse?.code || '',
        status: mov.status,
        reference: mov.reference || '',
        notes: mov.notes || '',
        createdBy: mov.createdBy?.name || ''
      }));

      const csv = stringify(records, {
        header: true,
        columns: [
          'date', 'type', 'itemName', 'itemSKU', 'quantity',
          'sourceWarehouse', 'targetWarehouse', 'status',
          'reference', 'notes', 'createdBy'
        ]
      });

      return csv;
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }
}

export default new DataImportExportService();
