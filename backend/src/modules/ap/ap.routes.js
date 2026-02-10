import express from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import * as apController from './ap.controller.js';
import { upload } from '../../config/upload.js';

const router = express.Router();

// ==================== AP BILLS ROUTES ====================

// List all bills with filters
router.get('/bills', requireAuth, apController.listBillsController);

// Get bill by ID
router.get('/bills/:id', requireAuth, apController.getBillByIdController);

// Create new bill
router.post('/bills', requireAuth, apController.createBillController);

// Update bill
router.put('/bills/:id', requireAuth, apController.updateBillController);

// Delete bill
router.delete('/bills/:id', requireAuth, apController.deleteBillController);

// Approve bill
router.post('/bills/:id/approve', requireAuth, apController.approveBillController);

// Reject bill
router.post('/bills/:id/reject', requireAuth, apController.rejectBillController);

// Perform three-way match
router.post('/bills/:id/match', requireAuth, apController.performThreeWayMatchController);

// Upload bill attachment
router.post('/bills/:id/attachments', requireAuth, upload.single('file'), apController.uploadBillAttachmentController);

// Delete bill attachment
router.delete('/bills/:id/attachments/:attachmentId', requireAuth, apController.deleteBillAttachmentController);

// ==================== PAYMENTS ROUTES ====================

// List all payments with filters
router.get('/payments', requireAuth, apController.listPaymentsController);

// Get payment by ID
router.get('/payments/:id', requireAuth, apController.getPaymentByIdController);

// Create new payment
router.post('/payments', requireAuth, apController.createPaymentController);

// Update payment
router.put('/payments/:id', requireAuth, apController.updatePaymentController);

// Delete payment
router.delete('/payments/:id', requireAuth, apController.deletePaymentController);

// Upload payment attachment
router.post('/payments/:id/attachments', requireAuth, upload.single('file'), apController.uploadPaymentAttachmentController);

// Delete payment attachment
router.delete('/payments/:id/attachments/:attachmentId', requireAuth, apController.deletePaymentAttachmentController);

// ==================== ANALYTICS & REPORTS ROUTES ====================

// Get AP analytics
router.get('/analytics', requireAuth, apController.getAPAnalyticsController);

// Get aging report
router.get('/aging', requireAuth, apController.getAgingReportController);

// Export aging report to Excel
router.get('/aging/export', requireAuth, apController.exportAgingReportController);

// Get vendor statement
router.get('/vendors/:vendorId/statement', requireAuth, apController.getVendorStatementController);

export default router;
