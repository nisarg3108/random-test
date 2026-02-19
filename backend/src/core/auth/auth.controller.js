import { createPendingRegistration, loginUser, registerUser } from './auth.service.js';
import prisma from '../../config/db.js';
import * as stripeService from '../../modules/subscription/stripe.service.js';
import * as razorpayService from '../../modules/subscription/razorpay.service.js';

/**
 * Register new user
 */
export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Register new user with payment checkout
 */
export const registerCheckout = async (req, res, next) => {
  try {
    const pending = await createPendingRegistration(req.body);
    const provider = String(pending.provider || '').toUpperCase();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (provider === 'STRIPE') {
      const session = await stripeService.createCheckoutSession({
        pendingRegistrationId: pending.id,
        email: pending.email,
        amount: pending.amount,
        currency: pending.currency,
        successUrl: `${frontendUrl}/login?payment=success`,
        cancelUrl: `${frontendUrl}/register?payment=cancel`
      });

      return res.status(201).json({
        message: 'Checkout session created',
        redirectUrl: session.url
      });
    }

    if (provider === 'RAZORPAY') {
      const customerId = await razorpayService.createRazorpayCustomer(
        pending.id,
        pending.email,
        pending.companyName
      );
      const paymentLink = await razorpayService.createPaymentLink(
        customerId,
        pending.amount,
        `Subscription for ${pending.companyName}`,
        { pendingRegistrationId: pending.id }
      );

      return res.status(201).json({
        message: 'Payment link created',
        redirectUrl: paymentLink.short_url
      });
    }

    return res.status(400).json({
      message: 'Unsupported billing provider',
      error: 'UNSUPPORTED_PROVIDER'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login existing user
 */
export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { employee: { select: { name: true } } },
    });
    res.status(200).json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        tenantId: req.user.tenantId,
        name: user?.employee?.name || req.user.email,
        avatar: null,
      },
    });
  } catch (error) {
    next(error);
  }
};
