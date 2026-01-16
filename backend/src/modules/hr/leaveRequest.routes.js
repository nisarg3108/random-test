import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createLeaveRequestController,
  listLeaveRequestsController,
} from './leaveRequest.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('leave.request'),
  createLeaveRequestController
);

router.get(
  '/',
  requireAuth,
  requirePermission('leave.view'),
  listLeaveRequestsController
);

export default router;
