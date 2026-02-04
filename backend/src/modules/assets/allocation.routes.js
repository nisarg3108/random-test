import express from 'express';
import {
  allocateAssetController,
  listAllocationsController,
  getAllocationController,
  returnAssetController,
  updateAllocationController,
  getMyAllocationsController,
} from './allocation.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';

const router = express.Router();

router.post('/', authenticate, allocateAssetController);
router.get('/', authenticate, listAllocationsController);
router.get('/my-allocations', authenticate, getMyAllocationsController);
router.get('/:id', authenticate, getAllocationController);
router.put('/:id', authenticate, updateAllocationController);
router.post('/:id/return', authenticate, returnAssetController);

export default router;
