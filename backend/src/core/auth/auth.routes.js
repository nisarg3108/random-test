import { Router } from 'express';
import { register, login, registerCheckout } from './auth.controller.js';

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

export default router;
