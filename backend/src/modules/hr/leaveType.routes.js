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
  requirePermission('leaveType.create'),
  createLeaveTypeController
);

router.get(
  '/',
  requireAuth,
  requirePermission('leaveType.view'),
  listLeaveTypesController
);

router.get(
  '/:id',
  requireAuth,
  requirePermission('leaveType.view'),
  getLeaveTypeController
);

router.put(
  '/:id',
  requireAuth,
  requirePermission('leaveType.update'),
  updateLeaveTypeController
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('leaveType.delete'),
  deleteLeaveTypeController
);

export default router;
