import { Router } from 'express';
import { register, login, registerCheckout, getMe } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';

const router = Router();

/**
 * POST /api/auth/register
 */
router.post('/register', register);

/**
 * POST /api/auth/register/checkout
 */
router.post('/register/checkout', registerCheckout);

/**
 * POST /api/auth/login
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, getMe);

export default router;
