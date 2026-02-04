import express from 'express';
import * as reportingController from './reporting.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkPermission } from '../../middlewares/permissions.js';

const router = express.Router();

// Dashboard
router.get('/dashboard-summary', authenticate, reportingController.getDashboardSummary);

// Financial Reports
router.get('/income-statement', 
  authenticate, 
  checkPermission('reports.view'),
  reportingController.getIncomeStatement
);

router.get('/balance-sheet', 
  authenticate, 
  checkPermission('reports.view'),
  reportingController.getBalanceSheet
);

// Inventory Reports
router.get('/inventory-summary', 
  authenticate, 
  checkPermission('inventory.view'),
  reportingController.getInventorySummary
);

router.get('/stock-movement', 
  authenticate, 
  checkPermission('inventory.view'),
  reportingController.getStockMovementReport
);

// Manufacturing Reports
router.get('/production', 
  authenticate, 
  checkPermission('manufacturing.view'),
  reportingController.getProductionReport
);

router.get('/bom-analysis', 
  authenticate, 
  checkPermission('manufacturing.view'),
  reportingController.getBOMAnalysis
);

// Sales Reports
router.get('/sales', 
  authenticate, 
  checkPermission('sales.view'),
  reportingController.getSalesReport
);

// Report Scheduling
router.post('/schedule', 
  authenticate, 
  checkPermission('reports.manage'),
  reportingController.scheduleReport
);

router.get('/scheduled', 
  authenticate, 
  checkPermission('reports.view'),
  reportingController.getScheduledReports
);

export default router;
