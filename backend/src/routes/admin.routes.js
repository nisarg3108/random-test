import { Router } from 'express';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requireRole } from '../core/auth/role.middleware.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  (req, res) => {
    res.json({ message: 'Welcome Admin' });
  }
);

export default router;
