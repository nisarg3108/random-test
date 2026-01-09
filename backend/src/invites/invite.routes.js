import { Router } from 'express';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requireRole } from '../core/auth/role.middleware.js';
import {
  inviteUserController,
  acceptInviteController,
} from './invite.controller.js';

const router = Router();

// ADMIN only
router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  inviteUserController
);

// Public (invite link)
router.post('/accept', acceptInviteController);

export default router;
