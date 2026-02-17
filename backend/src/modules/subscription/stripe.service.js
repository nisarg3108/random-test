import Stripe from 'stripe';
import prisma from '../../config/db.js';
import { syncCompanyModulesFromSubscription } from './subscription.utils.js';
import { finalizePendingRegistration } from '../../core/auth/auth.service.js';
import * as invoiceService from './invoice.service.js';

let stripeClient = null;

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
};

/**
 * Initialize Stripe customer for a tenant
 */
export const createStripeCustomer = async (tenantId, email, name) => {
  try {
    const customer = await getStripeClient().customers.create({
      email,
      name,
      metadata: {
        tenantId
      }
    });

    return customer.id;
  } catch (error) {
    console.error('[Stripe] Error creating customer:', error);
    throw new Error(`Failed to create Stripe customer: ${error.message}`);
  }
};

/**
 * Create a Stripe subscription for a tenant
 */
export const createStripeSubscription = async (
  tenantId,
  stripeCustomerId,
  stripePriceId,
  trialDays = 0
) => {
  try {
    const subscriptionData = {
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
      metadata: {
        tenantId
      },
      payment_behavior: 'error_if_incomplete',
      expand: ['latest_invoice.payment_intent']
    };

    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays;
    }

    const subscription = await getStripeClient().subscriptions.create(subscriptionData);

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      latestInvoice: subscription.latest_invoice
    };
  } catch (error) {
    console.error('[Stripe] Error creating subscription:', error);
    throw new Error(`Failed to create Stripe subscription: ${error.message}`);
  }
};

/**
 * Create a Stripe Checkout session for registration
 */
export const createCheckoutSession = async ({
  pendingRegistrationId,
  email,
  amount,
  currency = 'USD',
  successUrl,
  cancelUrl
}) => {
  if (!amount || amount <= 0) {
    throw new Error('Checkout amount must be greater than zero');
  }

  const session = await getStripeClient().checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      pendingRegistrationId
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: 'UEORMS Subscription'
          }
        }
      }
    ]
  });

  return { id: session.id, url: session.url };
};

/**
 * Create a checkout session for plan change
 */
export const createPlanChangeCheckoutSession = async ({
  tenantId,
  subscriptionId,
  currentPlanId,
  newPlanId,
  amount,
  currency = 'USD',
  email,
  successUrl,
  cancelUrl
}) => {
  if (!amount || amount <= 0) {
    throw new Error('Plan change amount must be greater than zero');
  }

  const session = await getStripeClient().checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: 'plan_change',
      tenantId,
      subscriptionId,
      currentPlanId,
      newPlanId
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: 'Plan Change - UEORMS Subscription'
          }
        }
      }
    ]
  });

  return { id: session.id, url: session.url };
};

/**
 * Update payment method for a subscription
 */
export const updatePaymentMethod = async (stripeCustomerId, paymentMethodId) => {
  try {
    await getStripeClient().customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    return true;
  } catch (error) {
    console.error('[Stripe] Error updating payment method:', error);
    throw new Error(`Failed to update payment method: ${error.message}`);
  }
};

/**
 * Cancel a Stripe subscription
 */
export const cancelStripeSubscription = async (
  subscriptionId,
  atPeriodEnd = true
) => {
  try {
    const subscription = await getStripeClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: atPeriodEnd
    });

    return {
      id: subscription.id,
      status: subscription.status,
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
    };
  } catch (error) {
    console.error('[Stripe] Error canceling subscription:', error);
    throw new Error(`Failed to cancel Stripe subscription: ${error.message}`);
  }
};

/**
 * Get subscription details from Stripe
 */
export const getStripeSubscription = async (subscriptionId) => {
  try {
    const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'default_payment_method']
    });

    return {
      id: subscription.id,
      status: subscription.status,
      customerId: subscription.customer.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      items: subscription.items.data.map(item => ({
        id: item.id,
        priceId: item.price.id,
        quantity: item.quantity
      })),
      defaultPaymentMethod: subscription.default_payment_method
    };
  } catch (error) {
    console.error('[Stripe] Error retrieving subscription:', error);
    throw new Error(`Failed to retrieve subscription: ${error.message}`);
  }
};

/**
 * Create a payment intent for manual payment
 */
export const createPaymentIntent = async (tenantId, amount, currency = 'usd') => {
  try {
    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        tenantId
      }
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    };
  } catch (error) {
    console.error('[Stripe] Error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

/**
 * Retrieve customer details
 */
export const getStripeCustomer = async (customerId) => {
  try {
    const customer = await getStripeClient().customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('[Stripe] Error retrieving customer:', error);
    throw new Error(`Failed to retrieve customer: ${error.message}`);
  }
};

/**
 * Build product and price IDs based on plan
 * Returns stripePriceId to use for subscription
 */
export const getStripePriceId = (planName) => {
  // Map plan names to Stripe price IDs
  // These should be set as environment variables
  const priceMap = {
    'Starter Monthly': process.env.STRIPE_PRICE_STARTER_MONTHLY,
    'Starter Yearly': process.env.STRIPE_PRICE_STARTER_YEARLY,
    'Growth Monthly': process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    'Growth Yearly': process.env.STRIPE_PRICE_GROWTH_YEARLY,
    'Enterprise Monthly': process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    'Enterprise Yearly': process.env.STRIPE_PRICE_ENTERPRISE_YEARLY
  };

  const priceId = priceMap[planName];
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${planName}`);
  }

  return priceId;
};

/**
 * Handle Stripe webhook event
 */
export const handleStripeWebhookEvent = async (event) => {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          STRIPE WEBHOOK RECEIVED                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('[Stripe] Event Type:', event.type);
    console.log('[Stripe] Event ID:', event.id);
    console.log('[Stripe] Timestamp:', new Date().toISOString());
    
    if (event.data?.object?.amount_paid) {
      console.log('[Stripe] Amount:', event.data.object.amount_paid / 100, event.data.object.currency);
    }
    
    // Store the event in database
    const billingEvent = await prisma.billingEvent.upsert({
      where: { providerEventId: event.id },
      create: {
        providerEventId: event.id,
        eventType: event.type,
        provider: 'STRIPE',
        payload: event.data,
        tenantId: event.data?.object?.metadata?.tenantId || null
      },
      update: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, billingEvent.id);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object, billingEvent.id);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object, billingEvent.id);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, billingEvent.id);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, billingEvent.id);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object, billingEvent.id);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, billingEvent.id);
        break;

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return billingEvent;
  } catch (error) {
    console.error('[Stripe] Error handling webhook event:', error);
    throw error;
  }
};

/**
 * Handle checkout session completed
 */
const handleCheckoutSessionCompleted = async (session, billingEventId) => {
  const { metadata } = session;
  
  console.log('[Stripe] Checkout session completed:', session.id);
  
  // Check if this is a plan change payment
  if (metadata?.type === 'plan_change') {
    await handlePlanChangePayment(session, billingEventId);
    return;
  }

  // Otherwise, handle as regular registration payment
  const pendingRegistrationId = metadata?.pendingRegistrationId;
  
  if (!pendingRegistrationId) {
    console.log('[Stripe] No pendingRegistrationId found in session metadata');
    return;
  }

  console.log('[Stripe] Processing pending registration:', pendingRegistrationId);
  
  const subscription = await finalizePendingRegistration(pendingRegistrationId, 'STRIPE');

  if (!subscription) {
    console.log('[Stripe] Failed to finalize pending registration');
    return;
  }

  console.log('[Stripe] Pending registration finalized successfully');

  if (session.customer) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { providerCustomerId: String(session.customer) }
    });
  }

  if (session.amount_total && session.currency) {
    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        status: 'SUCCEEDED',
        providerPaymentId: session.payment_intent || null,
        invoiceNumber: `INV-${Date.now()}-${subscription.tenantId.slice(0, 6).toUpperCase()}`,
        succeededAt: new Date()
      }
    });

    console.log('[Stripe] Payment recorded:', payment.id);
    await syncCompanyModulesFromSubscription(subscription.tenantId);
    console.log('[Stripe] Modules synced');

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
          console.log(`[Stripe] ✅ Invoice email sent to ${adminEmail}`);
        }
      } catch (error) {
        console.error('[Stripe] Error sending invoice:', error.message);
      }
    }
  }
};

/**
 * Handle plan change payment completion
 */
const handlePlanChangePayment = async (session, billingEventId) => {
  const { metadata } = session;
  const { tenantId, subscriptionId, newPlanId } = metadata;

  console.log('[Stripe] Processing plan change payment:', { tenantId, subscriptionId, newPlanId });

  if (!tenantId || !subscriptionId || !newPlanId) {
    console.error('[Stripe] Missing required metadata for plan change');
    return;
  }

  try {
    // Get the new plan details
    const newPlan = await prisma.plan.findUnique({
      where: { id: newPlanId },
      include: { modules: true }
    });

    if (!newPlan) {
      console.error('[Stripe] New plan not found:', newPlanId);
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
    if (session.amount_total && session.currency) {
      const payment = await prisma.subscriptionPayment.create({
        data: {
          subscriptionId,
          tenantId,
          amount: session.amount_total / 100,
          currency: session.currency.toUpperCase(),
          status: 'SUCCEEDED',
          providerPaymentId: session.payment_intent || null,
          description: 'Plan Change Payment',
          invoiceNumber: `INV-${Date.now()}-${tenantId.slice(0, 6).toUpperCase()}`,
          succeededAt: new Date()
        }
      });

      console.log('[Stripe] Plan change payment recorded:', payment.id);

      // Generate invoice and send email
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
            console.log(`[Stripe] ✅ Invoice email sent to ${adminEmail} for plan change`);
          } else {
            console.log('[Stripe] No admin email found for plan change invoice');
          }
        } catch (error) {
          console.error('[Stripe] Error sending invoice for plan change:', error.message);
        }
      }
    }

    // Sync company modules
    await syncCompanyModulesFromSubscription(tenantId);

    console.log('[Stripe] Plan change completed successfully');
  } catch (error) {
    console.error('[Stripe] Error processing plan change payment:', error);
    throw error;
  }
};

/**
 * Handle successful charge
 */
const handleChargeSucceeded = async (charge, billingEventId) => {
  const { metadata, id: chargeId, amount, currency } = charge;

  console.log('[Stripe] Charge succeeded:', chargeId, 'Amount:', amount / 100, currency);

  if (!metadata?.tenantId) {
    console.log('[Stripe] No tenantId found in charge metadata');
    return;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: metadata.tenantId }
  });

  if (subscription) {
    console.log('\n========================================');
    console.log('[Stripe] Processing Charge');
    console.log('========================================');
    console.log('[Stripe] Charge ID:', chargeId);
    console.log('[Stripe] Amount:', amount / 100, currency);
    console.log('[Stripe] Tenant ID:', metadata.tenantId);
    
    if (subscription.status !== 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'ACTIVE' }
      });
      console.log('[Stripe] ✅ Subscription activated');
    }

    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: metadata.tenantId,
        amount: amount / 100, // Convert from cents
        currency,
        status: 'SUCCEEDED',
        providerPaymentId: chargeId,
        description: 'Subscription Payment',
        invoiceNumber: `INV-${Date.now()}-${metadata.tenantId.slice(0, 6).toUpperCase()}`,
        succeededAt: new Date()
      }
    });

    console.log('[Stripe] ✅ Payment recorded:', payment.id);
    await syncCompanyModulesFromSubscription(subscription.tenantId);
    console.log('[Stripe] ✅ Modules synced');

    // Generate invoice and send email
    console.log('\n[Stripe] Checking email configuration...');
    console.log('[Stripe] SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured');
    console.log('[Stripe] SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Not configured');
    
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
        console.log('[Stripe] Admin email:', adminEmail || '❌ Not found');
        
        if (adminEmail) {
          console.log('[Stripe] 📧 Starting automatic invoice email send...');
          
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

          console.log('[Stripe] Generating PDF...');
          const pdfBuffer = await invoiceService.generateInvoicePDF(paymentWithEmail);
          console.log('[Stripe] ✅ PDF generated, size:', pdfBuffer.length, 'bytes');
          
          console.log('[Stripe] Sending email to:', adminEmail);
          await invoiceService.sendInvoiceEmail(paymentWithEmail, pdfBuffer);
          console.log(`[Stripe] ✅✅✅ Invoice email sent successfully to ${adminEmail}`);
          console.log('[Stripe] Payment ID:', payment.id);
        } else {
          console.log('[Stripe] ⚠️  No admin email found, skipping invoice');
        }
      } catch (error) {
        console.error('[Stripe] ❌ Error sending invoice:', error.message);
        console.error('[Stripe] Stack:', error.stack);
      }
    }
    
    console.log('========================================\n');
  }
};

/**
 * Handle failed charge
 */
const handleChargeFailed = async (charge, billingEventId) => {
  const { metadata, id: chargeId, amount, currency, failure_message } = charge;

  if (!metadata?.tenantId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: metadata.tenantId }
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
        tenantId: metadata.tenantId,
        amount: amount / 100,
        currency,
        status: 'FAILED',
        providerPaymentId: chargeId,
        failureMessage: failure_message,
        failedAt: new Date()
      }
    });
  }
};

/**
 * Handle subscription updated
 */
const handleSubscriptionUpdated = async (stripeSubscription, billingEventId) => {
  const { id: subscriptionId, metadata, status, current_period_end } = stripeSubscription;

  if (!metadata?.tenantId) return;

  await prisma.subscription.update({
    where: {
      providerSubscriptionId: subscriptionId
    },
    data: {
      status: mapStripeStatus(status),
      currentPeriodEnd: new Date(current_period_end * 1000)
    }
  });
};

/**
 * Handle subscription deleted
 */
const handleSubscriptionDeleted = async (stripeSubscription, billingEventId) => {
  const { id: subscriptionId } = stripeSubscription;

  await prisma.subscription.update({
    where: {
      providerSubscriptionId: subscriptionId
    },
    data: {
      status: 'CANCELED',
      canceledAt: new Date()
    }
  });
};

/**
 * Handle invoice payment succeeded
 */
const handleInvoicePaymentSucceeded = async (invoice, billingEventId) => {
  console.log('\n========================================');
  console.log('[Stripe Webhook] Invoice Payment Succeeded');
  console.log('========================================');
  
  const {
    subscription: stripeSubscriptionId,
    subscription_id,
    amount_paid,
    currency,
    id: invoiceId,
  } = invoice;

  console.log('[Stripe] Invoice ID:', invoiceId);
  console.log('[Stripe] Amount:', amount_paid / 100, currency);

  const providerSubscriptionId = stripeSubscriptionId || subscription_id;
  if (!providerSubscriptionId) {
    console.log('[Stripe] ❌ No subscription ID found in invoice');
    return;
  }

  console.log('[Stripe] Looking up subscription:', providerSubscriptionId);

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId },
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

  if (!subscription) {
    console.log('[Stripe] ❌ Subscription not found in database');
    return;
  }

  console.log('[Stripe] ✅ Subscription found:', subscription.id);
  console.log('[Stripe] Tenant ID:', subscription.tenantId);
  console.log('[Stripe] Admin users found:', subscription.tenant?.users?.length || 0);

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      amount: amount_paid / 100,
      currency,
      status: 'SUCCEEDED',
      description: 'Subscription Payment',
      invoiceNumber: `INV-${Date.now()}-${subscription.tenantId.slice(0, 6).toUpperCase()}`,
      succeededAt: new Date()
    }
  });

  console.log('[Stripe] ✅ Payment record created:', payment.id);

  await syncCompanyModulesFromSubscription(subscription.tenantId);
  console.log('[Stripe] ✅ Company modules synced');

  // Generate invoice PDF and send email if email is configured
  console.log('\n[Stripe] Checking email configuration...');
  console.log('[Stripe] SMTP_USER:', process.env.SMTP_USER ? '✅ Configured' : '❌ Not configured');
  console.log('[Stripe] SMTP_PASS:', process.env.SMTP_PASS ? '✅ Configured' : '❌ Not configured');
  
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      // Get admin user email
      const adminEmail = subscription.tenant?.users?.[0]?.email;
      console.log('[Stripe] Admin email:', adminEmail || '❌ Not found');
      
      if (adminEmail) {
        console.log('[Stripe] 📧 Starting automatic invoice email send...');
        
        // Fetch payment with full details for PDF generation
        const paymentWithDetails = await prisma.subscriptionPayment.findFirst({
          where: { id: payment.id },
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

        console.log('[Stripe] Generating PDF...');
        const pdfBuffer = await invoiceService.generateInvoicePDF(paymentWithEmail);
        console.log('[Stripe] ✅ PDF generated, size:', pdfBuffer.length, 'bytes');
        
        console.log('[Stripe] Sending email to:', adminEmail);
        await invoiceService.sendInvoiceEmail(paymentWithEmail, pdfBuffer);
        console.log(`[Stripe] ✅✅✅ Invoice email sent successfully to ${adminEmail}`);
        console.log('[Stripe] Payment ID:', payment.id);
      } else {
        console.log('[Stripe] ⚠️  No admin email found for tenant, skipping invoice email');
        console.log('[Stripe] Tenant ID:', subscription.tenantId);
      }
    } catch (error) {
      console.error('[Stripe] ❌ Error generating/sending invoice:', error.message);
      console.error('[Stripe] Stack:', error.stack);
      // Don't fail the webhook if email fails
    }
  } else {
    console.log('[Stripe] ⚠️  Email not configured, skipping invoice email');
  }
  
  console.log('========================================\n');
};

/**
 * Handle invoice payment failed
 */
const handleInvoicePaymentFailed = async (invoice, billingEventId) => {
  const {
    subscription: stripeSubscriptionId,
    subscription_id,
    amount_due,
    currency,
    id: invoiceId,
  } = invoice;

  const providerSubscriptionId = stripeSubscriptionId || subscription_id;
  if (!providerSubscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { providerSubscriptionId }
  });

  if (subscription) {
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: subscription.tenantId,
        amount: amount_due / 100,
        currency,
        status: 'FAILED',
        invoiceNumber: invoiceId,
        failedAt: new Date()
      }
    });

    // Update subscription status to past due
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' }
    });
  }
};

/**
 * Map Stripe subscription status to our internal status
 */
const mapStripeStatus = (stripeStatus) => {
  const statusMap = {
    'active': 'ACTIVE',
    'trialing': 'TRIALING',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'PAST_DUE'
  };

  return statusMap[stripeStatus] || 'ACTIVE';
};
