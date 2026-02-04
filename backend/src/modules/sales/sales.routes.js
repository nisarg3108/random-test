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
  deleteTrackingController
} from './sales.controller.js';

const router = Router();

router.use(requireAuth);

// Quotations
router.get('/quotations', listQuotationsController);
router.post('/quotations', requireRole(['ADMIN', 'MANAGER']), createQuotationController);
router.put('/quotations/:id', requireRole(['ADMIN', 'MANAGER']), updateQuotationController);
router.delete('/quotations/:id', requireRole(['ADMIN', 'MANAGER']), deleteQuotationController);

// Sales Orders
router.get('/orders', listSalesOrdersController);
router.post('/orders', requireRole(['ADMIN', 'MANAGER']), createSalesOrderController);
router.put('/orders/:id', requireRole(['ADMIN', 'MANAGER']), updateSalesOrderController);
router.delete('/orders/:id', requireRole(['ADMIN', 'MANAGER']), deleteSalesOrderController);

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

export default router;
