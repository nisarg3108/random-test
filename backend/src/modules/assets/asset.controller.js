import {
  createAssetCategory,
  listAssetCategories,
  getAssetCategoryById,
  updateAssetCategory,
  deleteAssetCategory,
  createAsset,
  listAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetStatistics,
} from './asset.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

// ========================================
// ASSET CATEGORY CONTROLLERS
// ========================================

export const createAssetCategoryController = async (req, res, next) => {
  try {
    const category = await createAssetCategory(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'ASSET_CATEGORY',
      entityId: category.id,
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

export const listAssetCategoriesController = async (req, res, next) => {
  try {
    const categories = await listAssetCategories(req.user.tenantId);
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const getAssetCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await getAssetCategoryById(id, req.user.tenantId);

    if (!category) {
      return res.status(404).json({ error: 'Asset category not found' });
    }

    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const updateAssetCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await updateAssetCategory(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'ASSET_CATEGORY',
      entityId: id,
    });

    res.json(category);
  } catch (err) {
    next(err);
  }
};

export const deleteAssetCategoryController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteAssetCategory(id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'ASSET_CATEGORY',
      entityId: id,
    });

    res.json({ message: 'Asset category deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ========================================
// ASSET CONTROLLERS
// ========================================

export const createAssetController = async (req, res, next) => {
  try {
    const asset = await createAsset(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'ASSET',
      entityId: asset.id,
      meta: { assetCode: asset.assetCode, name: asset.name },
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
};

export const listAssetsController = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      categoryId: req.query.categoryId,
      search: req.query.search,
    };

    const assets = await listAssets(req.user.tenantId, filters);
    res.json(assets);
  } catch (err) {
    next(err);
  }
};

export const getAssetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await getAssetById(id, req.user.tenantId);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (err) {
    next(err);
  }
};

export const updateAssetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await updateAsset(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'ASSET',
      entityId: id,
    });

    res.json(asset);
  } catch (err) {
    next(err);
  }
};

export const deleteAssetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteAsset(id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'ASSET',
      entityId: id,
    });

    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getAssetStatisticsController = async (req, res, next) => {
  try {
    const statistics = await getAssetStatistics(req.user.tenantId);
    res.json(statistics);
  } catch (err) {
    next(err);
  }
};
