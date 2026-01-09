import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requireRole } from '../../core/auth/role.middleware.js';
import {
  createItemController,
  listItemsController,
  updateItemController,
  deleteItemController,
} from './inventory.controller.js';

const router = Router();

// ADMIN creates items
router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  createItemController
);

// All users can view items
router.get('/', requireAuth, listItemsController);

// ADMIN/MANAGER can update items
router.put(
  '/:id',
  requireAuth,
  requireRole(['ADMIN', 'MANAGER']),
  updateItemController
);

// ADMIN can delete items
router.delete(
  '/:id',
  requireAuth,
  requireRole(['ADMIN']),
  deleteItemController
);

export default router;
