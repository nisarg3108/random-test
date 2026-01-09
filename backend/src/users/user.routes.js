import { Router } from 'express';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requireRole } from '../core/auth/role.middleware.js';
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

// ADMIN only
router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  createUserController
);

router.get(
  '/',
  requireAuth,
  requireRole(['ADMIN', 'MANAGER']),
  listUsersController
);

router.put(
  '/:id',
  requireAuth,
  requireRole(['ADMIN']),
  updateUserController
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(['ADMIN']),
  deleteUserController
);

// Invite user
router.post(
  '/invite',
  requireAuth,
  requireRole(['ADMIN']),
  inviteUserController
);

export default router;
