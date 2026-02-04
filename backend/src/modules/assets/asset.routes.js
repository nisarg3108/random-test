import express from 'express';
import {
  createAssetCategoryController,
  listAssetCategoriesController,
  getAssetCategoryController,
  updateAssetCategoryController,
  deleteAssetCategoryController,
  createAssetController,
  listAssetsController,
  getAssetController,
  updateAssetController,
  deleteAssetController,
  getAssetStatisticsController,
} from './asset.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';

const router = express.Router();

// Asset Category Routes
router.post('/categories', authenticate, createAssetCategoryController);
router.get('/categories', authenticate, listAssetCategoriesController);
router.get('/categories/:id', authenticate, getAssetCategoryController);
router.put('/categories/:id', authenticate, updateAssetCategoryController);
router.delete('/categories/:id', authenticate, deleteAssetCategoryController);

// Asset Routes
router.post('/', authenticate, createAssetController);
router.get('/', authenticate, listAssetsController);
router.get('/statistics', authenticate, getAssetStatisticsController);
router.get('/:id', authenticate, getAssetController);
router.put('/:id', authenticate, updateAssetController);
router.delete('/:id', authenticate, deleteAssetController);

export default router;
