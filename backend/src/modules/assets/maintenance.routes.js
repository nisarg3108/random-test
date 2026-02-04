import express from 'express';
import {
  createMaintenanceController,
  listMaintenanceController,
  getMaintenanceController,
  updateMaintenanceController,
  completeMaintenanceController,
  deleteMaintenanceController,
  getUpcomingMaintenanceController,
  getOverdueMaintenanceController,
} from './maintenance.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, createMaintenanceController);
router.get('/', authenticate, listMaintenanceController);
router.get('/upcoming', authenticate, getUpcomingMaintenanceController);
router.get('/overdue', authenticate, getOverdueMaintenanceController);
router.get('/:id', authenticate, getMaintenanceController);
router.put('/:id', authenticate, updateMaintenanceController);
router.post('/:id/complete', authenticate, completeMaintenanceController);
router.delete('/:id', authenticate, deleteMaintenanceController);

export default router;
