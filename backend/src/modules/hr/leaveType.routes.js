import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createLeaveTypeController,
  listLeaveTypesController,
} from './leaveType.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('leaveType.create'),
  createLeaveTypeController
);

router.get(
  '/',
  requireAuth,
  requirePermission('leaveType.view'),
  listLeaveTypesController
);

export default router;
