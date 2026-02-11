import {
  calculateAssetDepreciation,
  calculateAllAssetsDepreciation,
  getAssetDepreciationHistory,
  getDepreciationSummary,
  getDepreciationReport,
} from './depreciation.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

// ========================================
// DEPRECIATION CONTROLLERS
// ========================================

export const calculateAssetDepreciationController = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const { year, month, unitsProduced } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const depreciation = await calculateAssetDepreciation(
      assetId,
      parseInt(year),
      parseInt(month),
      req.user.tenantId,
      unitsProduced ? parseInt(unitsProduced) : 0
    );

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CALCULATE_DEPRECIATION',
      entity: 'ASSET',
      entityId: assetId,
      meta: { year, month, amount: depreciation.depreciationAmount },
    });

    res.json(depreciation);
  } catch (err) {
    next(err);
  }
};

export const calculateAllDepreciationController = async (req, res, next) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    const results = await calculateAllAssetsDepreciation(
      parseInt(year),
      parseInt(month),
      req.user.tenantId
    );

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CALCULATE_ALL_DEPRECIATION',
      entity: 'ASSET',
      entityId: 'BULK',
      meta: {
        year,
        month,
        successCount: results.success.length,
        failedCount: results.failed.length,
      },
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
};

export const getAssetDepreciationHistoryController = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const limit = parseInt(req.query.limit) || 12;

    const history = await getAssetDepreciationHistory(assetId, req.user.tenantId, limit);
    res.json(history);
  } catch (err) {
    next(err);
  }
};

export const getDepreciationSummaryController = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : null;
    const month = req.query.month ? parseInt(req.query.month) : null;

    const summary = await getDepreciationSummary(req.user.tenantId, year, month);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getDepreciationReportController = async (req, res, next) => {
  try {
    const { startYear, startMonth, endYear, endMonth } = req.query;

    if (!startYear || !startMonth || !endYear || !endMonth) {
      return res.status(400).json({
        error: 'Start year, start month, end year, and end month are required',
      });
    }

    const report = await getDepreciationReport(
      req.user.tenantId,
      parseInt(startYear),
      parseInt(startMonth),
      parseInt(endYear),
      parseInt(endMonth)
    );

    res.json(report);
  } catch (err) {
    next(err);
  }
};
