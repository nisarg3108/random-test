import { Router } from 'express';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requireRole, requirePermission } from '../core/rbac/permission.middleware.js';
import {
  createUserController,
  listUsersController,
  updateUserController,
  deleteUserController,
} from './user.controller.js';
import {
  inviteUserController,
} from '../invites/invite.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create user - Admin or HR Manager
router.post(
  '/',
  requirePermission('user.create'),
  createUserController
);

// List users - Admin, HR, or Managers
router.get(
  '/',
  requirePermission(['user.view', 'employee.view.all']),
  listUsersController
);

// Update user - Admin only
router.put(
  '/:id',
  requirePermission('user.update'),
  updateUserController
);

// Delete user - Admin only
router.delete(
  '/:id',
  requirePermission('user.delete'),
  deleteUserController
);

// Invite user - Admin or HR Manager
router.post(
  '/invite',
  requirePermission('user.invite'),
  inviteUserController
);

export default router;

