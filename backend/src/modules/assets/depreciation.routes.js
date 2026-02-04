import express from 'express';
import {
  calculateAssetDepreciationController,
  calculateAllDepreciationController,
  getAssetDepreciationHistoryController,
  getDepreciationSummaryController,
  getDepreciationReportController,
} from './depreciation.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';

const router = express.Router();

router.post('/calculate/:assetId', authenticate, calculateAssetDepreciationController);
router.post('/calculate-all', authenticate, calculateAllDepreciationController);
router.get('/history/:assetId', authenticate, getAssetDepreciationHistoryController);
router.get('/summary', authenticate, getDepreciationSummaryController);
router.get('/report', authenticate, getDepreciationReportController);

export default router;
