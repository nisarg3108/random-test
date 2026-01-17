import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createExpenseCategoryController,
  listExpenseCategoriesController,
} from './expenseCategory.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('expenseCategory.create'),
  createExpenseCategoryController
);

router.get(
  '/',
  requireAuth,
  requirePermission('expenseCategory.view'),
  listExpenseCategoriesController
);

export default router;
