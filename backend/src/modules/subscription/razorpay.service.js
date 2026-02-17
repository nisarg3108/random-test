import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import { syncCompanyModulesFromSubscription } from './subscription.utils.js';
import { finalizePendingRegistration } from '../../core/auth/auth.service.js';
import * as invoiceService from './invoice.service.js';

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
 * Create a payment link for plan change
 */
export const createPlanChangePaymentLink = async ({
  tenantId,
  subscriptionId,
  currentPlanId,
  newPlanId,
  amount,
  description,
  customerId
}) => {
  try {
    const link = await getRazorpayClient().invoices.create({
      customer_id: customerId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      description: description || 'Plan Change - UEORMS Subscription',
      notes: {
        type: 'plan_change',
        tenantId,
        subscriptionId,
        currentPlanId,
        newPlanId
      }
    });

    return {
      id: link.id,
      short_url: link.short_url,
      amount: link.amount / 100,
      status: link.status
    };
  } catch (error) {
    console.error('[Razorpay] Error creating plan change payment link:', error);
    throw new Error(`Failed to create plan change payment link: ${error.message}`);
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
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         RAZORPAY WEBHOOK RECEIVED                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('[Razorpay] Event Type:', eventType);
    console.log('[Razorpay] Event ID:', id);
    console.log('[Razorpay] Timestamp:', new Date().toISOString());
    
    const payloadRoot = payload?.payload || {};
    const paymentEntity = payloadRoot.payment?.entity || null;
    const subscriptionEntity = payloadRoot.subscription?.entity || null;
    const invoiceEntity = payloadRoot.invoice?.entity || null;
    
    if (paymentEntity) {
      console.log('[Razorpay] Payment ID:', paymentEntity.id);
      console.log('[Razorpay] Amount:', paymentEntity.amount / 100, paymentEntity.currency);
    }
    
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
    console.log('\n========================================');
    console.log('[Razorpay Webhook] Pending Registration Payment');
    console.log('========================================');
    console.log('[Razorpay] Registration ID:', notes.pendingRegistrationId);
    console.log('[Razorpay] Payment ID:', paymentId);
    console.log('[Razorpay] Amount:', amount / 100, currency);
    
    const subscription = await finalizePendingRegistration(notes.pendingRegistrationId, 'RAZORPAY');

    if (subscription) {
      console.log('[Razorpay] ✅ Registration completed');
      console.log('[Razorpay] Subscription ID:', subscription.id);
      console.log('[Razorpay] Tenant ID:', subscription.tenantId);
      
      const paymentRecord = await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          amount: amount / 100, // Convert from paise
          currency,
          status: 'SUCCEEDED',
          providerPaymentId: paymentId,
          invoiceNumber: `INV-${Date.now()}-${subscription.tenantId.slice(0, 6).toUpperCase()}`,
          succeededAt: new Date()
        }
      });

      console.log('[Razorpay] ✅ Payment record created:', paymentRecord.id);

      await syncCompanyModulesFromSubscription(subscription.tenantId);
      console.log('[Razorpay] ✅ Company modules synced');

      // Send invoice email
      console.log('\n[Razorpay] Checking email configuration...');
      console.log('[Razorpay] SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured');
      console.log('[Razorpay] SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Not configured');
      
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const paymentWithDetails = await prisma.subscriptionPayment.findFirst({
            where: { id: paymentRecord.id },
            include: {
              subscription: {
                include: {
                  plan: true,
                  tenant: {
                    include: {
                      users: {
                        where: { role: 'ADMIN' },
                        take: 1
                      }
                    }
                  }
                }
              }
            }
          });

          // Get admin user email
          const adminEmail = paymentWithDetails?.subscription?.tenant?.users?.[0]?.email;
          console.log('[Razorpay] Admin email:', adminEmail || '❌ Not found');
          
          if (adminEmail) {
            console.log('[Razorpay] 📧 Starting automatic invoice email send...');
            
            // Add email to tenant data
            const paymentWithEmail = {
              ...paymentWithDetails,
              subscription: {
                ...paymentWithDetails.subscription,
                tenant: {
                  ...paymentWithDetails.subscription.tenant,
                  email: adminEmail
                }
              }
            };

            console.log('[Razorpay] Generating PDF...');
            const pdfBuffer = await invoiceService.generateInvoicePDF(paymentWithEmail);
            console.log('[Razorpay] ✅ PDF generated, size:', pdfBuffer.length, 'bytes');
            
            console.log('[Razorpay] Sending email to:', adminEmail);
            await invoiceService.sendInvoiceEmail(paymentWithEmail, pdfBuffer);
            console.log(`[Razorpay] ✅✅✅ Invoice email sent successfully to ${adminEmail}`);
            console.log('[Razorpay] Payment ID:', paymentRecord.id);
          } else {
            console.log('[Razorpay] ⚠️  No admin email found, skipping invoice email');
          }
        } catch (error) {
          console.error('[Razorpay] ❌ Error generating/sending invoice:', error.message);
          console.error('[Razorpay] Stack:', error.stack);
        }
      }
      
      console.log('========================================\n');
    } else {
      console.log('[Razorpay] ❌ Failed to finalize registration');
      console.log('========================================\n');
    }

    return;
  }

  if (!notes?.tenantId) return;

  // Find subscription by tenant
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: notes.tenantId },
    include: {
      plan: true,
      tenant: {
        include: {
          users: {
            where: { role: 'ADMIN' },
            take: 1
          }
        }
      }
    }
  });

  if (subscription) {
    console.log('\n========================================');
    console.log('[Razorpay Webhook] Processing Payment');
    console.log('========================================');
    console.log('[Razorpay] Payment ID:', paymentId);
    console.log('[Razorpay] Amount:', amount / 100, currency);
    console.log('[Razorpay] Subscription ID:', subscription.id);
    console.log('[Razorpay] Tenant ID:', notes.tenantId);
    
    if (subscription.status !== 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' }
      });
      console.log('[Razorpay] ✅ Subscription activated');
    }

    const paymentRecord = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: notes.tenantId,
        amount: amount / 100, // Convert from paise
        currency,
        status: 'SUCCEEDED',
        providerPaymentId: paymentId,
        invoiceNumber: `INV-${Date.now()}-${notes.tenantId.slice(0, 6).toUpperCase()}`,
        succeededAt: new Date()
      }
    });

    console.log('[Razorpay] ✅ Payment record created:', paymentRecord.id);

    await syncCompanyModulesFromSubscription(subscription.tenantId);
    console.log('[Razorpay] ✅ Company modules synced');

    // Send invoice email
    console.log('\n[Razorpay] Checking email configuration...');
    console.log('[Razorpay] SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured');
    console.log('[Razorpay] SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Not configured');
    console.log('[Razorpay] Admin users found:', subscription.tenant?.users?.length || 0);
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Get admin user email
        const adminEmail = subscription.tenant?.users?.[0]?.email;
        console.log('[Razorpay] Admin email:', adminEmail || '❌ Not found');
        
        if (adminEmail) {
          console.log('[Razorpay] 📧 Starting automatic invoice email send...');
          
          const paymentWithDetails = await prisma.subscriptionPayment.findFirst({
            where: { id: paymentRecord.id },
            include: {
              subscription: {
                include: {
                  plan: true,
                  tenant: true
                }
              }
            }
          });

          // Add email to tenant data
          const paymentWithEmail = {
            ...paymentWithDetails,
            subscription: {
              ...paymentWithDetails.subscription,
              tenant: {
                ...paymentWithDetails.subscription.tenant,
                email: adminEmail
              }
            }
          };

          console.log('[Razorpay] Generating PDF...');
          const pdfBuffer = await invoiceService.generateInvoicePDF(paymentWithEmail);
          console.log('[Razorpay] ✅ PDF generated, size:', pdfBuffer.length, 'bytes');
          
          console.log('[Razorpay] Sending email to:', adminEmail);
          await invoiceService.sendInvoiceEmail(paymentWithEmail, pdfBuffer);
          console.log(`[Razorpay] ✅✅✅ Invoice email sent successfully to ${adminEmail}`);
          console.log('[Razorpay] Payment ID:', paymentRecord.id);
        } else {
          console.log('[Razorpay] ⚠️  No admin email found for tenant, skipping invoice email');
          console.log('[Razorpay] Tenant ID:', subscription.tenantId);
        }
      } catch (error) {
        console.error('[Razorpay] ❌ Error generating/sending invoice:', error.message);
        console.error('[Razorpay] Stack:', error.stack);
      }
    }
    
    console.log('========================================\n');
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
      const payment = await prisma.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
          amount: amount / 100, // Convert from paise
          currency,
          status: 'SUCCEEDED',
          providerPaymentId: paymentId,
          invoiceNumber: `INV-${Date.now()}-${subscription.tenantId.slice(0, 6).toUpperCase()}`,
          succeededAt: new Date()
        }
      });

      console.log('[Razorpay] Payment recorded:', payment.id);
      await syncCompanyModulesFromSubscription(subscription.tenantId);
      console.log('[Razorpay] Pending registration completed successfully');

      // Send invoice email
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const paymentWithDetails = await prisma.subscriptionPayment.findFirst({
            where: { id: payment.id },
            include: {
              subscription: {
                include: {
                  plan: true,
                  tenant: {
                    include: {
                      users: {
                        where: { role: 'ADMIN' },
                        take: 1
                      }
                    }
                  }
                }
              }
            }
          });

          const adminEmail = paymentWithDetails?.subscription?.tenant?.users?.[0]?.email;
          if (adminEmail) {
            const paymentWithEmail = {
              ...paymentWithDetails,
              subscription: {
                ...paymentWithDetails.subscription,
                tenant: {
                  ...paymentWithDetails.subscription.tenant,
                  email: adminEmail
                }
              }
            };

            const pdfBuffer = await invoiceService.generateInvoicePDF(paymentWithEmail);
            await invoiceService.sendInvoiceEmail(paymentWithEmail, pdfBuffer);
            console.log(`[Razorpay] ✅ Invoice email sent to ${adminEmail}`);
          }
        } catch (error) {
          console.error('[Razorpay] Error sending invoice:', error.message);
        }
      }
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

  // Handle plan change payment
  if (notes?.type === 'plan_change') {
    await handlePlanChangePayment(invoice, billingEventId);
    return;
  }

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
 * Handle plan change payment completion (Razorpay)
 */
const handlePlanChangePayment = async (invoice, billingEventId) => {
  if (!invoice) return;
  
  const { id: invoiceId, amount_paid, currency, notes, payment_id } = invoice;
  const { tenantId, subscriptionId, newPlanId } = notes;

  console.log('[Razorpay] Processing plan change payment:', { tenantId, subscriptionId, newPlanId });

  if (!tenantId || !subscriptionId || !newPlanId) {
    console.error('[Razorpay] Missing required notes for plan change');
    return;
  }

  try {
    // Get the new plan details
    const newPlan = await prisma.plan.findUnique({
      where: { id: newPlanId },
      include: { modules: true }
    });

    if (!newPlan) {
      console.error('[Razorpay] New plan not found:', newPlanId);
      return;
    }

    // Update subscription plan
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { planId: newPlan.id }
    });

    // Update subscription items
    await prisma.subscriptionItem.deleteMany({
      where: { subscriptionId }
    });

    await prisma.subscriptionItem.createMany({
      data: newPlan.modules.map(module => ({
        subscriptionId,
        moduleKey: module.moduleKey,
        quantity: 1,
        unitPrice: module.price
      }))
    });

    // Record payment
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId,
        tenantId,
        amount: amount_paid / 100, // Convert from paise
        currency,
        status: 'SUCCEEDED',
        providerPaymentId: payment_id || invoiceId,
        invoiceNumber: invoiceId,
        succeededAt: new Date()
      }
    });

    // Sync company modules
    await syncCompanyModulesFromSubscription(tenantId);

    console.log('[Razorpay] Plan change completed successfully');
  } catch (error) {
    console.error('[Razorpay] Error processing plan change payment:', error);
    throw error;
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
