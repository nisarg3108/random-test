import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import * as billingController from './billing.controller.js';
import * as webhookController from './webhook.controller.js';
import * as invoiceController from './invoice.controller.js';

const router = Router();

/**
 * Billing Operations (require authentication)
 */

// Public plan list for registration
router.get('/public/plans', billingController.getPublicPlansController);

// Get subscription details
router.get('/subscription', requireAuth, billingController.getSubscriptionController);

// Get available plans
router.get('/plans', requireAuth, billingController.getAvailablePlansController);

// Change subscription plan
router.post('/subscription/change-plan', requireAuth, billingController.changePlanController);

// Cancel subscription
router.post('/subscription/cancel', requireAuth, billingController.cancelSubscriptionController);

// Get payment history
router.get('/payments', requireAuth, billingController.getPaymentHistoryController);

// Get billing events (debugging)
router.get('/events', requireAuth, billingController.getBillingEventsController);

// Get billing metrics and usage
router.get('/metrics', requireAuth, billingController.getBillingMetricsController);

/**
 * Invoice Operations (require authentication)
 */

// Get all invoices
router.get('/invoices', requireAuth, invoiceController.getInvoices);

// Get invoice by payment ID
router.get('/invoices/:paymentId', requireAuth, invoiceController.getInvoiceByPaymentId);

// Preview invoice (formatted data)
router.get('/invoices/:paymentId/preview', requireAuth, invoiceController.previewInvoice);

// Download invoice as PDF
router.get('/invoices/:paymentId/download', requireAuth, invoiceController.downloadInvoice);

// Resend invoice email
router.post('/invoices/:paymentId/resend', requireAuth, invoiceController.resendInvoiceEmail);

/**
 * Webhooks (no authentication required)
 */

// Stripe webhook endpoint
router.post('/webhooks/stripe', webhookController.stripeWebhookController);

// Razorpay webhook endpoint
router.post('/webhooks/razorpay', webhookController.razorpayWebhookController);

/**
 * Development/Testing endpoints (only in development mode)
 */

// Stripe test webhook
router.post('/webhooks/stripe/test', webhookController.stripeWebhookTestController);

// Razorpay test webhook
router.post('/webhooks/razorpay/test', webhookController.razorpayWebhookTestController);

export default router;
