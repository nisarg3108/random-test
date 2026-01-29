import express from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import { financeDashboardController } from './finance.dashboard.controller.js';
import {
  createExpenseCategoryController,
  listExpenseCategoriesController,
} from './expenseCategory.controller.js';
import {
  createExpenseClaimController,
  listExpenseClaimsController,
} from './expenseClaim.controller.js';

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', requirePermission('finance.dashboard'), financeDashboardController);
router.get('/expense-categories', requirePermission('expenseCategory.view'), listExpenseCategoriesController);
router.post('/expense-categories', requirePermission('expenseCategory.create'), createExpenseCategoryController);
router.get('/expense-claims', requirePermission('expenseClaim.view'), listExpenseClaimsController);
router.post('/expense-claims', requirePermission('expenseClaim.create'), createExpenseClaimController);

export default router;