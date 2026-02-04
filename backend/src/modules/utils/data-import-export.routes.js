import express from 'express';
import dataImportExportController from './data-import-export.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkPermission } from '../../middlewares/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==================== IMPORT ROUTES ====================

router.post(
  '/import/items',
  checkPermission('import_data'),
  (req, res) => dataImportExportController.importItems(req, res)
);

router.post(
  '/import/warehouses',
  checkPermission('import_data'),
  (req, res) => dataImportExportController.importWarehouses(req, res)
);

router.post(
  '/import/journal-entries',
  checkPermission('import_data'),
  (req, res) => dataImportExportController.importJournalEntries(req, res)
);

// ==================== EXPORT ROUTES ====================

router.get(
  '/export/items',
  checkPermission('export_data'),
  (req, res) => dataImportExportController.exportItems(req, res)
);

router.get(
  '/export/warehouses',
  checkPermission('export_data'),
  (req, res) => dataImportExportController.exportWarehouses(req, res)
);

router.get(
  '/export/warehouse-stock',
  checkPermission('export_data'),
  (req, res) => dataImportExportController.exportWarehouseStock(req, res)
);

router.get(
  '/export/chart-of-accounts',
  checkPermission('export_data'),
  (req, res) => dataImportExportController.exportChartOfAccounts(req, res)
);

router.get(
  '/export/general-ledger',
  checkPermission('export_data'),
  (req, res) => dataImportExportController.exportGeneralLedger(req, res)
);

router.get(
  '/export/stock-movements',
  checkPermission('export_data'),
  (req, res) => dataImportExportController.exportStockMovements(req, res)
);

// ==================== TEMPLATE ROUTES ====================

router.get(
  '/templates/:type',
  checkPermission('import_data'),
  (req, res) => dataImportExportController.downloadImportTemplate(req, res)
);

export default router;
