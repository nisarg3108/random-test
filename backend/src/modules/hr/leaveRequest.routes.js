import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createLeaveRequestController,
  listLeaveRequestsController,
  updateLeaveRequestController,
} from './leaveRequest.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  createLeaveRequestController
);

router.get(
  '/',
  requireAuth,
  listLeaveRequestsController
);

router.put(
  '/:id',
  requireAuth,
  requirePermission('leave.approve'),
  updateLeaveRequestController
);

export default router;
