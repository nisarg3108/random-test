import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createExpenseClaimController,
  listExpenseClaimsController,
} from './expenseClaim.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('expense.claim'),
  createExpenseClaimController
);

router.get(
  '/',
  requireAuth,
  requirePermission('expense.view'),
  listExpenseClaimsController
);

export default router;
