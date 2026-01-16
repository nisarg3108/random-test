import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createEmployeeController,
  listEmployeesController,
  assignManagerController,
} from './employee.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('employee.create'),
  createEmployeeController
);
router.post(
  '/assign-manager',
  requireAuth,
  requirePermission('employee.manage'),
  assignManagerController
);
    

router.get(
  '/',
  requireAuth,
  requirePermission('employee.view'),
  listEmployeesController
);

export default router;