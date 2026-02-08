import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createLeaveTypeController,
  listLeaveTypesController,
  updateLeaveTypeController,
  deleteLeaveTypeController,
  getLeaveTypeController,
} from './leaveType.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('leave.types.manage'),
  createLeaveTypeController
);

router.get(
  '/',
  requireAuth,
  listLeaveTypesController
);

router.get(
  '/:id',
  requireAuth,
  getLeaveTypeController
);

router.put(
  '/:id',
  requireAuth,
  requirePermission('leave.types.manage'),
  updateLeaveTypeController
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('leave.types.manage'),
  deleteLeaveTypeController
);

export default router;
