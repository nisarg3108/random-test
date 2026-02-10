import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requireRole } from '../../core/auth/role.middleware.js';
import {
  listQuotationsController,
  createQuotationController,
  updateQuotationController,
  deleteQuotationController,
  listSalesOrdersController,
  createSalesOrderController,
  updateSalesOrderController,
  deleteSalesOrderController,
  listInvoicesController,
  createInvoiceController,
  updateInvoiceController,
  deleteInvoiceController,
  listTrackingsController,
  createTrackingController,
  updateTrackingController,
  deleteTrackingController,
  convertQuotationToOrderController,
  convertOrderToInvoiceController,
  listInvoicePaymentsController,
  createInvoicePaymentController,
  updateInvoicePaymentController,
  deleteInvoicePaymentController,
  getSalesAnalyticsController,
  getRevenueMetricsController,
  getPaymentAnalyticsController,
  exportAnalyticsPDFController,
  exportAnalyticsCSVController,
  exportAnalyticsExcelController,
  emailAnalyticsReportController,
  scheduleAnalyticsReportController,
  cancelScheduledReportController,
  getRevenueForecastController
} from './sales.controller.js';

const router = Router();

router.use(requireAuth);

// Quotations
router.get('/quotations', listQuotationsController);
router.post('/quotations', requireRole(['ADMIN', 'MANAGER']), createQuotationController);
router.put('/quotations/:id', requireRole(['ADMIN', 'MANAGER']), updateQuotationController);
router.delete('/quotations/:id', requireRole(['ADMIN', 'MANAGER']), deleteQuotationController);
router.post('/quotations/:id/convert-to-order', requireRole(['ADMIN', 'MANAGER']), convertQuotationToOrderController);

// Sales Orders
router.get('/orders', listSalesOrdersController);
router.post('/orders', requireRole(['ADMIN', 'MANAGER']), createSalesOrderController);
router.put('/orders/:id', requireRole(['ADMIN', 'MANAGER']), updateSalesOrderController);
router.delete('/orders/:id', requireRole(['ADMIN', 'MANAGER']), deleteSalesOrderController);
router.post('/orders/:id/convert-to-invoice', requireRole(['ADMIN', 'MANAGER']), convertOrderToInvoiceController);

// Invoices
router.get('/invoices', listInvoicesController);
router.post('/invoices', requireRole(['ADMIN', 'MANAGER']), createInvoiceController);
router.put('/invoices/:id', requireRole(['ADMIN', 'MANAGER']), updateInvoiceController);
router.delete('/invoices/:id', requireRole(['ADMIN', 'MANAGER']), deleteInvoiceController);

// Order Tracking
router.get('/trackings', listTrackingsController);
router.post('/trackings', requireRole(['ADMIN', 'MANAGER']), createTrackingController);
router.put('/trackings/:id', requireRole(['ADMIN', 'MANAGER']), updateTrackingController);
router.delete('/trackings/:id', requireRole(['ADMIN', 'MANAGER']), deleteTrackingController);

// Invoice Payments
router.get('/invoices/:invoiceId/payments', listInvoicePaymentsController);
router.post('/invoices/:invoiceId/payments', requireRole(['ADMIN', 'MANAGER']), createInvoicePaymentController);
router.put('/payments/:id', requireRole(['ADMIN', 'MANAGER']), updateInvoicePaymentController);
router.delete('/payments/:id', requireRole(['ADMIN', 'MANAGER']), deleteInvoicePaymentController);

// Analytics
router.get('/analytics', getSalesAnalyticsController);
router.get('/analytics/revenue', getRevenueMetricsController);
router.get('/analytics/payments', getPaymentAnalyticsController);

// Export
router.get('/analytics/export/pdf', exportAnalyticsPDFController);
router.get('/analytics/export/csv', exportAnalyticsCSVController);
router.get('/analytics/export/excel', exportAnalyticsExcelController);

// Email Reports
router.post('/analytics/email', requireRole(['ADMIN', 'MANAGER']), emailAnalyticsReportController);
router.post('/analytics/schedule', requireRole(['ADMIN', 'MANAGER']), scheduleAnalyticsReportController);
router.delete('/analytics/schedule/:schedule', requireRole(['ADMIN', 'MANAGER']), cancelScheduledReportController);

// Forecasting
router.get('/analytics/forecast', getRevenueForecastController);

export default router;
