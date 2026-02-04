import express from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  getProfitLossReportController,
  getBalanceSheetReportController,
  getHRAnalyticsReportController,
  getInventoryReportController,
  executeCustomReportController,
  createReportTemplateController,
  listReportTemplatesController,
  getReportTemplateController,
  saveReportController,
  listReportsController,
  getReportController,
  exportReportController,
} from './report.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ==================== FINANCIAL REPORTS ====================
router.get(
  '/financial/profit-loss',
  requirePermission('reports.financial.view'),
  getProfitLossReportController
);

router.get(
  '/financial/balance-sheet',
  requirePermission('reports.financial.view'),
  getBalanceSheetReportController
);

// ==================== HR REPORTS ====================
router.get(
  '/hr/analytics',
  requirePermission('reports.hr.view'),
  getHRAnalyticsReportController
);

// ==================== INVENTORY REPORTS ====================
router.get(
  '/inventory',
  requirePermission('reports.inventory.view'),
  getInventoryReportController
);

// ==================== CUSTOM REPORTS ====================
router.post(
  '/custom/execute',
  requirePermission('reports.custom.create'),
  executeCustomReportController
);

// ==================== REPORT TEMPLATES ====================
router.post(
  '/templates',
  requirePermission('reports.templates.create'),
  createReportTemplateController
);

router.get(
  '/templates',
  requirePermission('reports.templates.view'),
  listReportTemplatesController
);

router.get(
  '/templates/:id',
  requirePermission('reports.templates.view'),
  getReportTemplateController
);

// ==================== SAVED REPORTS ====================
router.post(
  '/saved',
  requirePermission('reports.view'),
  saveReportController
);

router.get(
  '/saved',
  requirePermission('reports.view'),
  listReportsController
);

router.get(
  '/saved/:id',
  requirePermission('reports.view'),
  getReportController
);

// ==================== EXPORT ====================
router.get(
  '/export',
  requirePermission('reports.export'),
  exportReportController
);

router.post(
  '/export',
  requirePermission('reports.export'),
  exportReportController
);

export default router;
