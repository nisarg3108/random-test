import dataImportExportService from './data-import-export.service.js';

class DataImportExportController {
  // ==================== IMPORT ENDPOINTS ====================

  async importItems(req, res) {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ 
          message: 'CSV data is required' 
        });
      }

      const results = await dataImportExportService.importItems(
        csvData,
        req.user.tenantId
      );

      res.json({
        message: 'Import completed',
        summary: {
          total: results.success.length + results.errors.length,
          success: results.success.length,
          errors: results.errors.length
        },
        results
      });
    } catch (error) {
      console.error('Import items error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to import items' 
      });
    }
  }

  async importWarehouses(req, res) {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ 
          message: 'CSV data is required' 
        });
      }

      const results = await dataImportExportService.importWarehouses(
        csvData,
        req.user.tenantId
      );

      res.json({
        message: 'Import completed',
        summary: {
          total: results.success.length + results.errors.length,
          success: results.success.length,
          errors: results.errors.length
        },
        results
      });
    } catch (error) {
      console.error('Import warehouses error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to import warehouses' 
      });
    }
  }

  async importJournalEntries(req, res) {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ 
          message: 'CSV data is required' 
        });
      }

      const results = await dataImportExportService.importJournalEntries(
        csvData,
        req.user.tenantId
      );

      res.json({
        message: 'Import completed',
        summary: {
          total: results.success.length + results.errors.length,
          success: results.success.length,
          errors: results.errors.length
        },
        results
      });
    } catch (error) {
      console.error('Import journal entries error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to import journal entries' 
      });
    }
  }

  // ==================== EXPORT ENDPOINTS ====================

  async exportItems(req, res) {
    try {
      const { category, status } = req.query;
      const filters = {};
      
      if (category) filters.category = category;
      if (status) filters.status = status;

      const csv = await dataImportExportService.exportItems(
        req.user.tenantId,
        filters
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=items.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export items error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to export items' 
      });
    }
  }

  async exportWarehouses(req, res) {
    try {
      const csv = await dataImportExportService.exportWarehouses(
        req.user.tenantId
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=warehouses.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export warehouses error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to export warehouses' 
      });
    }
  }

  async exportWarehouseStock(req, res) {
    try {
      const { warehouseId } = req.query;
      
      const csv = await dataImportExportService.exportWarehouseStock(
        req.user.tenantId,
        warehouseId
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=warehouse-stock.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export warehouse stock error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to export warehouse stock' 
      });
    }
  }

  async exportChartOfAccounts(req, res) {
    try {
      const csv = await dataImportExportService.exportChartOfAccounts(
        req.user.tenantId
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=chart-of-accounts.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export chart of accounts error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to export chart of accounts' 
      });
    }
  }

  async exportGeneralLedger(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const csv = await dataImportExportService.exportGeneralLedger(
        req.user.tenantId,
        startDate,
        endDate
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=general-ledger.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export general ledger error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to export general ledger' 
      });
    }
  }

  async exportStockMovements(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const csv = await dataImportExportService.exportStockMovements(
        req.user.tenantId,
        startDate,
        endDate
      );

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=stock-movements.csv');
      res.send(csv);
    } catch (error) {
      console.error('Export stock movements error:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to export stock movements' 
      });
    }
  }

  // ==================== TEMPLATE DOWNLOAD ====================

  async downloadImportTemplate(req, res) {
    try {
      const { type } = req.params;

      const templates = {
        items: 'name,description,sku,category,unitPrice,quantity,minStockLevel,unit\n'
          + 'Product A,Example product,SKU001,Electronics,100.00,50,10,pcs\n',
        
        warehouses: 'code,name,type,location,capacity\n'
          + 'WH001,Main Warehouse,MAIN,Building A,10000\n',
        
        journal_entries: 'date,description,reference,accountCode,debit,credit\n'
          + '2024-01-01,Opening entry,JE001,1000,1000.00,0.00\n'
          + '2024-01-01,Opening entry,JE001,3000,0.00,1000.00\n'
      };

      if (!templates[type]) {
        return res.status(404).json({ 
          message: 'Template not found' 
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-template.csv`);
      res.send(templates[type]);
    } catch (error) {
      console.error('Download template error:', error);
      res.status(500).json({ 
        message: 'Failed to download template' 
      });
    }
  }
}

export default new DataImportExportController();
