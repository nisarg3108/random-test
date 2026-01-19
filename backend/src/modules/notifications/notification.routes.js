import express from 'express';
import notificationController from './notification.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);

export default router;