import prisma from '../../config/db.js';
import * as stripeService from './stripe.service.js';
import * as razorpayService from './razorpay.service.js';
import { syncCompanyModulesFromSubscription } from './subscription.utils.js';

/**
 * Get tenant's current subscription and details
 */
export const getSubscriptionController = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId },
      include: {
        plan: {
          include: {
            modules: true
          }
        },
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({
        message: 'No subscription found for this tenant',
        error: 'SUBSCRIPTION_NOT_FOUND'
      });
    }

    // Calculate subscription days remaining
    const now = new Date();
    const daysRemaining = Math.ceil(
      (subscription.currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
    );

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          description: subscription.plan.description,
          billingCycle: subscription.plan.billingCycle,
          currency: subscription.plan.currency,
          basePrice: subscription.plan.basePrice,
          seatPrice: subscription.plan.seatPrice
        },
        modules: subscription.items.map(item => ({
          moduleKey: item.moduleKey,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        billing: {
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          daysRemaining,
          provider: subscription.provider,
          autoRenew: !subscription.cancelAt
        },
        provider: {
          customerId: subscription.providerCustomerId,
          subscriptionId: subscription.providerSubscriptionId
        },
        cancellation: {
          cancelAt: subscription.cancelAt,
          canceledAt: subscription.canceledAt
        },
        recentPayments: subscription.payments.map(p => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          date: p.succeededAt || p.failedAt || p.createdAt,
          invoiceNumber: p.invoiceNumber
        }))
      }
    });
  } catch (error) {
    console.error('[Billing Controller] Error getting subscription:', error);
    res.status(500).json({
      message: 'Failed to retrieve subscription',
      error: error.message
    });
  }
};

/**
 * Get available active plans for plan switching
 */
export const getAvailablePlansController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const currentSubscription = await prisma.subscription.findFirst({
      where: { tenantId },
      select: { planId: true }
    });

    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: { modules: true },
      orderBy: [
        { basePrice: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        billingCycle: plan.billingCycle,
        currency: plan.currency,
        basePrice: plan.basePrice,
        seatPrice: plan.seatPrice,
        isCurrentPlan: currentSubscription?.planId === plan.id,
        moduleCount: plan.modules.length,
        modules: plan.modules
          .filter((module) => module.included)
          .map((module) => module.moduleKey)
      }))
    });
  } catch (error) {
    console.error('[Billing Controller] Error getting available plans:', error);
    res.status(500).json({
      message: 'Failed to retrieve available plans',
      error: error.message
    });
  }
};

/**
 * Get public active plans (no auth)
 */
export const getPublicPlansController = async (_req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: { modules: true },
      orderBy: [
        { basePrice: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        billingCycle: plan.billingCycle,
        currency: plan.currency,
        basePrice: plan.basePrice,
        seatPrice: plan.seatPrice,
        moduleCount: plan.modules.length,
        modules: plan.modules
          .filter((module) => module.included)
          .map((module) => module.moduleKey)
      }))
    });
  } catch (error) {
    console.error('[Billing Controller] Error getting public plans:', error);
    res.status(500).json({
      message: 'Failed to retrieve plans',
      error: error.message
    });
  }
};

/**
 * Change subscription plan
 */
export const changePlanController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { planId, provider = 'STRIPE' } = req.body;

    // Validate plan exists
    const newPlan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { modules: true }
    });

    if (!newPlan) {
      return res.status(404).json({
        message: 'Plan not found',
        error: 'PLAN_NOT_FOUND'
      });
    }

    // Get current subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: { tenantId },
      include: { plan: true }
    });

    if (!currentSubscription) {
      return res.status(404).json({
        message: 'No active subscription found',
        error: 'SUBSCRIPTION_NOT_FOUND'
      });
    }

    // Update subscription in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: { planId: newPlan.id },
      include: {
        plan: { include: { modules: true } },
        items: true
      }
    });

    // Update subscription items to match new plan modules
    await prisma.subscriptionItem.deleteMany({
      where: { subscriptionId: updatedSubscription.id }
    });

    await prisma.subscriptionItem.createMany({
      data: newPlan.modules.map(module => ({
        subscriptionId: updatedSubscription.id,
        moduleKey: module.moduleKey,
        quantity: 1,
        unitPrice: module.price
      }))
    });

    await syncCompanyModulesFromSubscription(tenantId);

    // Handle provider-specific plan changes if needed
    if (currentSubscription.provider === 'STRIPE' && currentSubscription.providerSubscriptionId) {
      // Stripe plan change would be handled here
      console.log(`[Billing] Stripe plan change for subscription: ${currentSubscription.providerSubscriptionId}`);
    } else if (currentSubscription.provider === 'RAZORPAY' && currentSubscription.providerSubscriptionId) {
      // Razorpay plan change would be handled here
      console.log(`[Billing] Razorpay plan change for subscription: ${currentSubscription.providerSubscriptionId}`);
    }

    res.json({
      message: 'Plan changed successfully',
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('[Billing Controller] Error changing plan:', error);
    res.status(500).json({
      message: 'Failed to change plan',
      error: error.message
    });
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscriptionController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { atPeriodEnd = true } = req.body;

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId }
    });

    if (!subscription) {
      return res.status(404).json({
        message: 'No subscription found',
        error: 'SUBSCRIPTION_NOT_FOUND'
      });
    }

    // Cancel with provider if applicable
    if (subscription.provider === 'STRIPE' && subscription.providerSubscriptionId) {
      await stripeService.cancelStripeSubscription(
        subscription.providerSubscriptionId,
        atPeriodEnd
      );
    } else if (subscription.provider === 'RAZORPAY' && subscription.providerSubscriptionId) {
      await razorpayService.cancelRazorpaySubscription(
        subscription.providerSubscriptionId,
        atPeriodEnd
      );
    }

    // Update database
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAt: atPeriodEnd ? subscription.currentPeriodEnd : new Date(),
        status: atPeriodEnd ? subscription.status : 'CANCELED',
        canceledAt: !atPeriodEnd ? new Date() : null
      }
    });

    res.json({
      message: `Subscription canceled successfully (at period end: ${atPeriodEnd})`,
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('[Billing Controller] Error canceling subscription:', error);
    res.status(500).json({
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

/**
 * Get payment history
 */
export const getPaymentHistoryController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { limit = 50, offset = 0, status } = req.query;

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId }
    });

    if (!subscription) {
      return res.status(404).json({
        message: 'No subscription found',
        error: 'SUBSCRIPTION_NOT_FOUND'
      });
    }

    const where = { subscriptionId: subscription.id };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.subscriptionPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.subscriptionPayment.count({ where })
    ]);

    res.json({
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        invoiceNumber: p.invoiceNumber,
        description: p.description,
        failureCode: p.failureCode,
        failureMessage: p.failureMessage,
        dates: {
          scheduled: p.scheduledFor,
          attempted: p.attemptedAt,
          succeeded: p.succeededAt,
          failed: p.failedAt,
          refunded: p.refundedAt
        },
        created: p.createdAt,
        updated: p.updatedAt
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Billing Controller] Error getting payment history:', error);
    res.status(500).json({
      message: 'Failed to retrieve payment history',
      error: error.message
    });
  }
};

/**
 * Get available billing events (for debugging)
 */
export const getBillingEventsController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { limit = 50, offset = 0, provider, status } = req.query;

    const where = { tenantId };
    if (provider) where.provider = provider.toUpperCase();
    if (status) where.status = status.toUpperCase();

    const [events, total] = await Promise.all([
      prisma.billingEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.billingEvent.count({ where })
    ]);

    res.json({
      events: events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        provider: e.provider,
        status: e.status,
        providerEventId: e.providerEventId,
        processedAt: e.processedAt,
        error: e.errorMessage,
        created: e.createdAt
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Billing Controller] Error getting billing events:', error);
    res.status(500).json({
      message: 'Failed to retrieve billing events',
      error: error.message
    });
  }
};

/**
 * Get billing usage and metrics
 */
export const getBillingMetricsController = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId },
      include: {
        plan: true,
        payments: true
      }
    });

    if (!subscription) {
      return res.status(404).json({
        message: 'No subscription found',
        error: 'SUBSCRIPTION_NOT_FOUND'
      });
    }

    // Calculate metrics
    const totalPaid = subscription.payments
      .filter(p => p.status === 'SUCCEEDED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const failedPayments = subscription.payments.filter(p => p.status === 'FAILED').length;
    const pendingPayments = subscription.payments.filter(p => p.status === 'PENDING').length;

    const now = new Date();
    const daysRemaining = Math.ceil(
      (subscription.currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
    );

    const daysSinceStart = Math.ceil(
      (now - subscription.currentPeriodStart) / (1000 * 60 * 60 * 24)
    );

    res.json({
      metrics: {
        subscription: {
          status: subscription.status,
          plan: subscription.plan.name,
          startDate: subscription.currentPeriodStart,
          endDate: subscription.currentPeriodEnd,
          daysSinceStart,
          daysRemaining,
          isAutoRenewing: !subscription.cancelAt
        },
        payment: {
          totalPaid,
          currency: subscription.plan.currency,
          nextBillingAmount: subscription.plan.basePrice,
          failedPayments,
          pendingPayments,
          successRate: subscription.payments.length > 0
            ? (subscription.payments.filter(p => p.status === 'SUCCEEDED').length / subscription.payments.length) * 100
            : 100
        }
      }
    });
  } catch (error) {
    console.error('[Billing Controller] Error getting metrics:', error);
    res.status(500).json({
      message: 'Failed to retrieve billing metrics',
      error: error.message
    });
  }
};
