import prisma from '../../config/db.js';
import * as stripeService from './stripe.service.js';
import * as razorpayService from './razorpay.service.js';

/**
 * Handle Stripe webhook
 */
export const stripeWebhookController = async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook is from Stripe
    if (!event.id || !event.type) {
      return res.status(400).json({
        message: 'Invalid webhook format',
        error: 'INVALID_WEBHOOK'
      });
    }

    // Check if event already processed
    const existingEvent = await prisma.billingEvent.findUnique({
      where: { providerEventId: event.id }
    });

    if (existingEvent) {
      // Event already processed, return success to avoid duplicate processing
      return res.json({ received: true, status: 'already_processed' });
    }

    // Handle the event
    const billingEvent = await stripeService.handleStripeWebhookEvent(event);

    // Update event status to processed
    await prisma.billingEvent.update({
      where: { id: billingEvent.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });

    res.json({
      received: true,
      status: 'processed',
      eventId: event.id,
      eventType: event.type
    });
  } catch (error) {
    console.error('[Webhook] Stripe webhook error:', error);

    // Store error state
    if (req.body?.id) {
      await prisma.billingEvent.findFirst({
        where: { providerEventId: req.body.id }
      }).then(event => {
        if (event) {
          prisma.billingEvent.update({
            where: { id: event.id },
            data: {
              status: 'FAILED',
              errorMessage: error.message
            }
          }).catch(() => {});
        }
      });
    }

    // Return 200 to acknowledge receipt, but log error
    res.status(200).json({
      received: true,
      status: 'error',
      error: error.message
    });
  }
};

/**
 * Handle Razorpay webhook
 */
export const razorpayWebhookController = async (req, res) => {
  try {
    const body = req.body;
    const signature = req.headers['x-razorpay-signature'];

    if (!body || !signature) {
      return res.status(400).json({
        message: 'Missing webhook data or signature',
        error: 'INVALID_WEBHOOK'
      });
    }

    // Verify signature
    const isValid = razorpayService.verifyWebhookSignature(body, signature);
    if (!isValid) {
      return res.status(403).json({
        message: 'Invalid webhook signature',
        error: 'INVALID_SIGNATURE'
      });
    }

    const event = body;
    const eventId =
      req.headers['x-razorpay-event-id'] ||
      event?.payload?.payment?.entity?.id ||
      event?.payload?.subscription?.entity?.id ||
      `${event.event}_${new Date().getTime()}`;

    // Check if event already processed
    const existingEvent = await prisma.billingEvent.findUnique({
      where: { providerEventId: eventId }
    }).catch(() => null);

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      return res.json({ received: true, status: 'already_processed' });
    }

    // Handle the event
    const billingEvent = await razorpayService.handleRazorpayWebhookEvent({
      id: eventId,
      event: event.event,
      payload: event
    });

    // Update event status to processed
    await prisma.billingEvent.update({
      where: { id: billingEvent.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });

    res.json({
      received: true,
      status: 'processed',
      eventType: event.event
    });
  } catch (error) {
    console.error('[Webhook] Razorpay webhook error:', error);

    // Return 200 to acknowledge receipt, but log error
    res.status(200).json({
      received: true,
      status: 'error',
      error: error.message
    });
  }
};

/**
 * Stripe test endpoint for local development
 */
export const stripeWebhookTestController = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        message: 'Test endpoint only available in development',
        error: 'FORBIDDEN'
      });
    }

    const { eventType = 'customer.subscription.updated', tenantId } = req.body;

    const testEvent = {
      id: `test_evt_${Date.now()}`,
      type: eventType,
      data: {
        object: {
          id: `sub_test_${Date.now()}`,
          metadata: { tenantId }
        }
      }
    };

    const billingEvent = await stripeService.handleStripeWebhookEvent(testEvent);

    res.json({
      message: 'Test event processed',
      event: testEvent.id,
      status: 'received'
    });
  } catch (error) {
    console.error('[Webhook] Stripe test error:', error);
    res.status(500).json({
      message: 'Test event processing failed',
      error: error.message
    });
  }
};

/**
 * Razorpay test endpoint for local development
 */
export const razorpayWebhookTestController = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        message: 'Test endpoint only available in development',
        error: 'FORBIDDEN'
      });
    }

    const { eventType = 'subscription.activated', tenantId } = req.body;

    const testEvent = {
      id: `test_evt_${Date.now()}`,
      event: eventType,
      payload: {
        subscription: {
          id: `sub_test_${Date.now()}`,
          notes: { tenantId }
        }
      }
    };

    const billingEvent = await razorpayService.handleRazorpayWebhookEvent(testEvent);

    res.json({
      message: 'Test event processed',
      event: testEvent.id,
      status: 'received'
    });
  } catch (error) {
    console.error('[Webhook] Razorpay test error:', error);
    res.status(500).json({
      message: 'Test event processing failed',
      error: error.message
    });
  }
};
