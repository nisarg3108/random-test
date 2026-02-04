import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { createObjectCsvWriter } from 'csv-writer';

const prisma = new PrismaClient();

class DataImportExportService {
  /**
   * Import items from CSV
   */
  async importItems(csvContent, tenantId, createdBy) {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        try {
          // Validate required fields
          if (!record.name || !record.sku) {
            throw new Error('Name and SKU are required');
          }

          // Check for duplicate SKU
          const existing = await prisma.item.findUnique({
            where: {
              sku_tenantId: {
                sku: record.sku,
                tenantId
              }
            }
          });

          if (existing) {
            throw new Error(`SKU ${record.sku} already exists`);
          }

          // Create item
          await prisma.item.create({
            data: {
              name: record.name,
              sku: record.sku,
              price: parseFloat(record.price) || 0,
              quantity: parseInt(record.quantity) || 0,
              description: record.description || '',
              category: record.category || '',
              tenantId
            }
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            sku: record.sku,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }

  /**
   * Import warehouses from CSV
   */
  async importWarehouses(csvContent, tenantId) {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        try {
          if (!record.name || !record.code) {
            throw new Error('Name and code are required');
          }

          // Check for duplicate code
          const existing = await prisma.warehouse.findUnique({
            where: {
              tenantId_code: {
                tenantId,
                code: record.code
              }
            }
          });

          if (existing) {
            throw new Error(`Code ${record.code} already exists`);
          }

          await prisma.warehouse.create({
            data: {
              name: record.name,
              code: record.code,
              type: record.type || 'GENERAL',
              address: record.address,
              city: record.city,
              state: record.state,
              country: record.country,
              capacity: record.capacity ? parseFloat(record.capacity) : null,
              tenantId
            }
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            code: record.code,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }

  /**
   * Export items to CSV
   */
  async exportItems(tenantId, filters = {}) {
    const where = { tenantId };

    if (filters.category) {
      where.category = filters.category;
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Format for CSV
    const csvData = items.map(item => ({
      'SKU': item.sku,
      'Name': item.name,
      'Category': item.category || '',
      'Price': item.price,
      'Quantity': item.quantity,
      'Description': item.description || '',
      'Created Date': new Date(item.createdAt).toISOString()
    }));

    return csvData;
  }

  /**
   * Export warehouses to CSV
   */
  async exportWarehouses(tenantId) {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    const csvData = warehouses.map(wh => ({
      'Code': wh.code,
      'Name': wh.name,
      'Type': wh.type,
      'Address': wh.address || '',
      'City': wh.city || '',
      'State': wh.state || '',
      'Country': wh.country || '',
      'Capacity': wh.capacity || '',
      'Status': wh.isActive ? 'Active' : 'Inactive',
      'Created Date': new Date(wh.createdAt).toISOString()
    }));

    return csvData;
  }

  /**
   * Export warehouse stock to CSV
   */
  async exportWarehouseStock(warehouseId, tenantId) {
    const stock = await prisma.warehouseStock.findMany({
      where: { warehouseId, tenantId }
    });

    const csvData = stock.map(item => ({
      'Item ID': item.itemId,
      'Quantity': item.quantity,
      'Reserved': item.reservedQty,
      'Available': item.availableQty,
      'Bin Location': item.binLocation || '',
      'Zone': item.zone || '',
      'Reorder Point': item.reorderPoint || '',
      'Min Stock': item.minStock || '',
      'Max Stock': item.maxStock || '',
      'Last Purchase Price': item.lastPurchasePrice || '',
      'Avg Cost': item.avgCost || ''
    }));

    return csvData;
  }

  /**
   * Bulk import journal entries from CSV
   */
  async importJournalEntries(csvContent, tenantId, createdBy) {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });

      const results = {
        success: 0,
        failed: 0,
        errors: [],
        entries: []
      };

      // Group records by entry number (assuming multiple lines per entry)
      const entriesByNumber = {};

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const entryKey = record.entry_number || `IMPORT-${i}`;

        if (!entriesByNumber[entryKey]) {
          entriesByNumber[entryKey] = {
            entry_number: entryKey,
            description: record.description,
            entry_date: record.entry_date || new Date().toISOString(),
            lines: []
          };
        }

        entriesByNumber[entryKey].lines.push({
          account_code: record.account_code,
          description: record.line_description,
          debit: record.debit ? parseFloat(record.debit) : 0,
          credit: record.credit ? parseFloat(record.credit) : 0
        });
      }

      // Create journal entries
      for (const key in entriesByNumber) {
        try {
          const entry = entriesByNumber[key];

          // Get account IDs from codes
          const lines = await Promise.all(
            entry.lines.map(async (line) => {
              const account = await prisma.chartOfAccounts.findFirst({
                where: {
                  accountCode: line.account_code,
                  tenantId
                }
              });

              if (!account) {
                throw new Error(`Account code ${line.account_code} not found`);
              }

              return {
                accountId: account.id,
                description: line.description,
                debit: line.debit,
                credit: line.credit
              };
            })
          );

          // Validate balance
          const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
          const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

          if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error('Entry not balanced');
          }

          // Get or generate entry number
          const count = await prisma.journalEntry.count({ where: { tenantId } });
          const entryNumber = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

          const journalEntry = await prisma.journalEntry.create({
            data: {
              entryNumber,
              tenantId,
              description: entry.description,
              entryDate: new Date(entry.entry_date),
              status: 'DRAFT',
              createdBy,
              totalDebit,
              totalCredit,
              lines: {
                create: lines.map((line, idx) => ({
                  ...line,
                  lineNumber: idx + 1
                }))
              }
            }
          });

          results.success++;
          results.entries.push(entryNumber);
        } catch (error) {
          results.failed++;
          results.errors.push({
            entry: key,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }

  /**
   * Export chart of accounts to CSV
   */
  async exportChartOfAccounts(tenantId) {
    const accounts = await prisma.chartOfAccounts.findMany({
      where: { tenantId },
      orderBy: { accountCode: 'asc' }
    });

    const csvData = accounts.map(account => ({
      'Account Code': account.accountCode,
      'Account Name': account.accountName,
      'Type': account.accountType,
      'Category': account.category || '',
      'Normal Balance': account.normalBalance,
      'Status': account.isActive ? 'Active' : 'Inactive',
      'System Account': account.isSystem ? 'Yes' : 'No',
      'Description': account.description || ''
    }));

    return csvData;
  }

  /**
   * Export general ledger to CSV
   */
  async exportGeneralLedger(tenantId, accountId = null) {
    const where = { tenantId };

    if (accountId) {
      where.accountId = accountId;
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      include: {
        account: true
      },
      orderBy: { date: 'asc' }
    });

    const csvData = entries.map(entry => ({
      'Date': new Date(entry.date).toISOString().split('T')[0],
      'Account Code': entry.account.accountCode,
      'Account Name': entry.account.accountName,
      'Description': entry.description,
      'Debit': entry.debit || '',
      'Credit': entry.credit || '',
      'Balance': entry.balance,
      'Reference': entry.referenceType || ''
    }));

    return csvData;
  }

  /**
   * Validate CSV structure
   */
  validateCSVStructure(csvContent, expectedColumns) {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });

      if (records.length === 0) {
        throw new Error('CSV file is empty');
      }

      const headers = Object.keys(records[0]);
      const missingColumns = expectedColumns.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      return {
        valid: true,
        rowCount: records.length,
        columns: headers
      };
    } catch (error) {
      throw new Error(`CSV validation error: ${error.message}`);
    }
  }
}

export default new DataImportExportService();
