import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { getEmployeeDashboardController } from './employee.dashboard.controller.js';

const router = Router();

router.get(
  '/dashboard',
  requireAuth,
  getEmployeeDashboardController
);

export default router;