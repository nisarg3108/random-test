import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import { syncCompanyModulesFromSubscription } from './subscription.utils.js';
import { finalizePendingRegistration } from '../../core/auth/auth.service.js';

let razorpayClient = null;

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  return razorpayClient;
};

/**
 * Create a Razorpay customer for a tenant
 */
export const createRazorpayCustomer = async (tenantId, email, name, phone = null) => {
  try {
    const customer = await getRazorpayClient().customers.create({
      email,
      name,
      contact: phone,
      notes: {
        tenantId
      }
    });

    return customer.id;
  } catch (error) {
    console.error('[Razorpay] Error creating customer:', error);
    throw new Error(`Failed to create Razorpay customer: ${error.message}`);
  }
};

/**
 * Create a Razorpay subscription plan
 */
export const createRazorpayPlan = async (planName, planPrice, interval = 'monthly', period = 12) => {
  try {
    const planData = {
      period: interval, // monthly | yearly
      interval: period,
      period_count: 1,
      customer_notify: 1,
      notes: {
        planName
      }
    };

    // Set price in paise (1 rupee = 100 paise)
    // Assuming planPrice is in rupees
    planData.item = {
      active: true,
      description: planName,
      amount: Math.round(planPrice * 100), // Convert to paise
      currency: 'INR'
    };

    const plan = await getRazorpayClient().plans.create(planData);
    return plan.id;
  } catch (error) {
    console.error('[Razorpay] Error creating plan:', error);
    throw new Error(`Failed to create Razorpay plan: ${error.message}`);
  }
};

/**
 * Create a Razorpay subscription for a tenant
 */
export const createRazorpaySubscription = async (
  tenantId,
  customerId,
  planId,
  totalCount = 12,
  shortUrl = null
) => {
  try {
    const subscriptionData = {
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount,
      quantity: 1,
      notes: {
        tenantId
      }
    };

    if (shortUrl) {
      subscriptionData.short_url = shortUrl;
    }

    const subscription = await getRazorpayClient().subscriptions.create(customerId, subscriptionData);

    return {
      id: subscription.id,
      status: subscription.status,
      startAt: subscription.start_at ? new Date(subscription.start_at * 1000) : null,
      endAt: subscription.end_at ? new Date(subscription.end_at * 1000) : null,
      currentStart: new Date(subscription.current_start * 1000),
      currentEnd: new Date(subscription.current_end * 1000),
      short_url: subscription.short_url,
      customerNotify: subscription.customer_notify
    };
  } catch (error) {
    console.error('[Razorpay] Error creating subscription:', error);
    throw new Error(`Failed to create Razorpay subscription: ${error.message}`);
  }
};

/**
 * Cancel a Razorpay subscription
 */
export const cancelRazorpaySubscription = async (subscriptionId, atPeriodEnd = true) => {
  try {
    const subscription = await getRazorpayClient().subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: atPeriodEnd ? 1 : 0
    });

    return {
      id: subscription.id,
      status: subscription.status,
      cancelledAt: subscription.cancelled_at ? new Date(subscription.cancelled_at * 1000) : null
    };
  } catch (error) {
    console.error('[Razorpay] Error canceling subscription:', error);
    throw new Error(`Failed to cancel Razorpay subscription: ${error.message}`);
  }
};

/**
 * Get subscription details from Razorpay
 */
export const getRazorpaySubscription = async (subscriptionId) => {
  try {
    const subscription = await getRazorpayClient().subscriptions.fetch(subscriptionId);

    return {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer_id,
      planId: subscription.plan_id,
      currentStart: new Date(subscription.current_start * 1000),
      currentEnd: new Date(subscription.current_end * 1000),
      startAt: subscription.start_at ? new Date(subscription.start_at * 1000) : null,
      endAt: subscription.end_at ? new Date(subscription.end_at * 1000) : null,
      cancelledAt: subscription.cancelled_at ? new Date(subscription.cancelled_at * 1000) : null,
      remainingCount: subscription.remaining_count,
      totalCount: subscription.total_count,
      quantity: subscription.quantity
    };
  } catch (error) {
    console.error('[Razorpay] Error retrieving subscription:', error);
    throw new Error(`Failed to retrieve subscription: ${error.message}`);
  }
};

/**
 * Get payment details
 */
export const getRazorpayPayment = async (paymentId) => {
  try {
    const payment = await getRazorpayClient().payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('[Razorpay] Error retrieving payment:', error);
    throw new Error(`Failed to retrieve payment: ${error.message}`);
  }
};

/**
 * Create a payment link for one-time payment
 */
export const createPaymentLink = async (customerId, amount, description, notes = {}) => {
  try {
    const link = await getRazorpayClient().invoices.create({
      customer_id: customerId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      description,
      notes
    });

    return {
      id: link.id,
      short_url: link.short_url,
      amount: link.amount / 100,
      status: link.status
    };
  } catch (error) {
    console.error('[Razorpay] Error creating payment link:', error);
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
};

/**
 * Verify Razorpay webhook signature
 */
export const verifyWebhookSignature = (body, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_TOKEN || process.env.RAZORPAY_KEY_SECRET;
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return generated_signature === signature;
};

/**
 * Handle Razorpay webhook event
 */
export const handleRazorpayWebhookEvent = async (event) => {
  try {
    const { id, event: eventType, payload } = event;
    const payloadRoot = payload?.payload || {};
    const paymentEntity = payloadRoot.payment?.entity || null;
    const subscriptionEntity = payloadRoot.subscription?.entity || null;
    const invoiceEntity = payloadRoot.invoice?.entity || null;
    
    // Extract tenantId and pendingRegistrationId from various sources
    const tenantId =
      subscriptionEntity?.notes?.tenantId ||
      paymentEntity?.notes?.tenantId ||
      invoiceEntity?.notes?.tenantId ||
      null;

    const pendingRegistrationId =
      paymentEntity?.notes?.pendingRegistrationId ||
      invoiceEntity?.notes?.pendingRegistrationId ||
      null;

    // Add pendingRegistrationId to payment entity if found in invoice
    if (pendingRegistrationId && paymentEntity && !paymentEntity.notes?.pendingRegistrationId) {
      paymentEntity.notes = {
        ...paymentEntity.notes,
        pendingRegistrationId
      };
    }

    // Store the event in database
    const billingEvent = await prisma.billingEvent.upsert({
      where: { providerEventId: id },
      create: {
        providerEventId: id,
        eventType,
        provider: 'RAZORPAY',
        payload,
        tenantId
      },
      update: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });

    switch (eventType) {
      case 'payment.authorized':
        await handlePaymentAuthorized(paymentEntity, billingEvent.id);
        break;

      case 'payment.captured':
        await handlePaymentCaptured(paymentEntity, billingEvent.id);
        break;

      case 'payment.failed':
        await handlePaymentFailed(paymentEntity, billingEvent.id);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(invoiceEntity, billingEvent.id);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(subscriptionEntity, billingEvent.id);
        break;

      case 'subscription.pending':
        await handleSubscriptionPending(subscriptionEntity, billingEvent.id);
        break;

      case 'subscription.halted':
        await handleSubscriptionHalted(subscriptionEntity, billingEvent.id);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(subscriptionEntity, billingEvent.id);
        break;

      case 'subscription.completed':
        await handleSubscriptionCompleted(subscriptionEntity, billingEvent.id);
        break;

      default:
        console.log(`[Razorpay] Unhandled event type: ${eventType}`);
    }

    return billingEvent;
  } catch (error) {
    console.error('[Razorpay] Error handling webhook event:', error);
    throw error;
  }
};

/**
 * Handle payment authorized/succeeded
 */
const handlePaymentAuthorized = async (payment, billingEventId) => {
  if (!payment) return;
  const { id: paymentId, amount, currency, notes } = payment;

  if (notes?.pendingRegistrationId) {
    const subscription = await finalizePendingRegistration(notes.pendingRegistrationId, 'RAZORPAY');

    if (subscription) {
      await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          amount: amount / 100, // Convert from paise
          currency,
          status: 'SUCCEEDED',
          providerPaymentId: paymentId,
          succeededAt: new Date()
        }
      });

      await syncCompanyModulesFromSubscription(subscription.tenantId);
    }

    return;
  }

  if (!notes?.tenantId) return;

  // Find subscription by tenant
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: notes.tenantId }
  });

  if (subscription) {
    if (subscription.status !== 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' }
      });
    }

    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: notes.tenantId,
        amount: amount / 100, // Convert from paise
        currency,
        status: 'SUCCEEDED',
        providerPaymentId: paymentId,
        succeededAt: new Date()
      }
    });

    await syncCompanyModulesFromSubscription(subscription.tenantId);
  }
};

/**
 * Handle payment captured (successful payment)
 */
const handlePaymentCaptured = async (payment, billingEventId) => {
  if (!payment) return;
  const { id: paymentId, amount, currency, notes } = payment;

  console.log('[Razorpay] Payment captured:', paymentId, 'Amount:', amount / 100, currency);

  // Handle pending registration payment
  if (notes?.pendingRegistrationId) {
    console.log('[Razorpay] Processing pending registration:', notes.pendingRegistrationId);
    
    const subscription = await finalizePendingRegistration(notes.pendingRegistrationId, 'RAZORPAY');

    if (subscription) {
      await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          amount: amount / 100, // Convert from paise
          currency,
          status: 'SUCCEEDED',
          providerPaymentId: paymentId,
          succeededAt: new Date()
        }
      });

      await syncCompanyModulesFromSubscription(subscription.tenantId);
      console.log('[Razorpay] Pending registration completed successfully');
    }

    return;
  }

  if (!notes?.tenantId) {
    console.log('[Razorpay] No tenantId found in payment notes');
    return;
  }

  // Find subscription by tenant
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: notes.tenantId }
  });

  if (subscription) {
    if (subscription.status !== 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' }
      });
    }

    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: notes.tenantId,
        amount: amount / 100, // Convert from paise
        currency,
        status: 'SUCCEEDED',
        providerPaymentId: paymentId,
        succeededAt: new Date()
      }
    });

    await syncCompanyModulesFromSubscription(subscription.tenantId);
    console.log('[Razorpay] Subscription payment recorded successfully');
  }
};

/**
 * Handle payment failed
 */
const handlePaymentFailed = async (payment, billingEventId) => {
  if (!payment) return;
  const { id: paymentId, amount, currency, notes, error_description } = payment;

  if (!notes?.tenantId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: notes.tenantId }
  });

  if (subscription) {
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: notes.tenantId,
        amount: amount / 100,
        currency,
        status: 'FAILED',
        providerPaymentId: paymentId,
        failureMessage: error_description,
        failedAt: new Date()
      }
    });
  }
};

/**
 * Handle invoice paid event
 */
const handleInvoicePaid = async (invoice, billingEventId) => {
  if (!invoice) return;
  const { id: invoiceId, amount_paid, currency, notes, payment_id } = invoice;

  console.log('[Razorpay] Invoice paid:', invoiceId, 'Amount:', amount_paid / 100, currency);

  // Handle pending registration payment
  if (notes?.pendingRegistrationId) {
    console.log('[Razorpay] Processing pending registration from invoice:', notes.pendingRegistrationId);
    
    const subscription = await finalizePendingRegistration(notes.pendingRegistrationId, 'RAZORPAY');

    if (subscription) {
      await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          amount: amount_paid / 100, // Convert from paise
          currency,
          status: 'SUCCEEDED',
          providerPaymentId: payment_id || invoiceId,
          invoiceNumber: invoiceId,
          succeededAt: new Date()
        }
      });

      await syncCompanyModulesFromSubscription(subscription.tenantId);
      console.log('[Razorpay] Pending registration completed via invoice payment');
    }

    return;
  }

  if (!notes?.tenantId) {
    console.log('[Razorpay] No tenantId found in invoice notes');
    return;
  }

  // Find subscription by tenant
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: notes.tenantId }
  });

  if (subscription) {
    if (subscription.status !== 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' }
      });
    }

    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: notes.tenantId,
        amount: amount_paid / 100, // Convert from paise
        currency,
        status: 'SUCCEEDED',
        providerPaymentId: payment_id || invoiceId,
        invoiceNumber: invoiceId,
        succeededAt: new Date()
      }
    });

    await syncCompanyModulesFromSubscription(subscription.tenantId);
    console.log('[Razorpay] Invoice payment recorded successfully');
  }
};

/**
 * Handle subscription activated
 */
const handleSubscriptionActivated = async (subscription, billingEventId) => {
  if (!subscription) return;
  const { id: subscriptionId, notes, status, current_start, current_end } = subscription;

  if (!notes?.tenantId) return;

  await prisma.subscription.update({
    where: { providerSubscriptionId: subscriptionId },
    data: {
      status: mapRazorpayStatus(status),
      currentPeriodStart: new Date(current_start * 1000),
      currentPeriodEnd: new Date(current_end * 1000)
    }
  }).catch(() => {
    // Handle case where subscription doesn't exist
    console.log(`[Razorpay] Subscription not found: ${subscriptionId}`);
  });
};

/**
 * Handle subscription pending
 */
const handleSubscriptionPending = async (subscription, billingEventId) => {
  if (!subscription) return;
  const { id: subscriptionId, notes } = subscription;

  if (!notes?.tenantId) return;

  await prisma.subscription.update({
    where: { providerSubscriptionId: subscriptionId },
    data: { status: 'PAST_DUE' }
  }).catch(() => {});
};

/**
 * Handle subscription halted
 */
const handleSubscriptionHalted = async (subscription, billingEventId) => {
  if (!subscription) return;
  const { id: subscriptionId, notes } = subscription;

  if (!notes?.tenantId) return;

  await prisma.subscription.update({
    where: { providerSubscriptionId: subscriptionId },
    data: { status: 'PAST_DUE' }
  }).catch(() => {});
};

/**
 * Handle subscription cancelled
 */
const handleSubscriptionCancelled = async (subscription, billingEventId) => {
  if (!subscription) return;
  const { id: subscriptionId, notes, ended_at } = subscription;

  if (!notes?.tenantId) return;

  await prisma.subscription.update({
    where: { providerSubscriptionId: subscriptionId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(ended_at * 1000)
    }
  }).catch(() => {});
};

/**
 * Handle subscription completed
 */
const handleSubscriptionCompleted = async (subscription, billingEventId) => {
  if (!subscription) return;
  const { id: subscriptionId, notes, ended_at } = subscription;

  if (!notes?.tenantId) return;

  await prisma.subscription.update({
    where: { providerSubscriptionId: subscriptionId },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(ended_at * 1000)
    }
  }).catch(() => {});
};

/**
 * Map Razorpay subscription status to our internal status
 */
const mapRazorpayStatus = (razorpayStatus) => {
  const statusMap = {
    'active': 'ACTIVE',
    'authenticated': 'ACTIVE',
    'pending': 'TRIALING',
    'halted': 'PAST_DUE',
    'cancelled': 'CANCELED',
    'completed': 'CANCELED',
    'expire_by': 'ACTIVE'
  };

  return statusMap[razorpayStatus] || 'ACTIVE';
};
