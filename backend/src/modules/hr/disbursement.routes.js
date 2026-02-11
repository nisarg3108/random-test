import express from 'express';
import disbursementController from './disbursement.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   POST /api/hr/disbursements
 * @desc    Create disbursements from approved payslips
 * @body    { payslipIds: string[], paymentMethod: string }
 * @access  Private
 */
router.post('/', disbursementController.createDisbursements);

/**
 * @route   GET /api/hr/disbursements
 * @desc    Get all disbursements with filters
 * @query   status, payrollCycleId, employeeId, paymentMethod, dateFrom, dateTo
 * @access  Private
 */
router.get('/', disbursementController.getDisbursements);

/**
 * @route   GET /api/hr/disbursements/stats
 * @desc    Get disbursement statistics
 * @query   payrollCycleId, dateFrom, dateTo
 * @access  Private
 */
router.get('/stats', disbursementController.getStats);

/**
 * @route   PATCH /api/hr/disbursements/:id/status
 * @desc    Update single disbursement status
 * @body    { status: string, transactionRef?: string, failureReason?: string, notes?: string }
 * @access  Private
 */
router.patch('/:id/status', disbursementController.updateStatus);

/**
 * @route   PATCH /api/hr/disbursements/bulk-status
 * @desc    Bulk update disbursement statuses
 * @body    { disbursementIds: string[], status: string, transactionRef?: string }
 * @access  Private
 */
router.patch('/bulk-status', disbursementController.bulkUpdateStatus);

/**
 * @route   POST /api/hr/disbursements/generate-payment-file
 * @desc    Generate payment file for bank transfer (CSV/NEFT)
 * @body    { disbursementIds: string[], fileFormat: 'CSV' | 'NEFT' }
 * @access  Private
 */
router.post('/generate-payment-file', disbursementController.generatePaymentFile);

/**
 * @route   POST /api/hr/disbursements/reconcile
 * @desc    Reconcile payments with bank statement
 * @body    { reconciliationData: Array<{employeeId, accountNumber, amount, transactionRef}> }
 * @access  Private
 */
router.post('/reconcile', disbursementController.reconcilePayments);

export default router;
