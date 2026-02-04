import {
  createDeal,
  listDeals,
  updateDeal,
  deleteDeal
} from './deal.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createDealController = async (req, res, next) => {
  try {
    const deal = await createDeal(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'DEAL',
      entityId: deal.id
    });

    res.status(201).json(deal);
  } catch (err) {
    next(err);
  }
};

export const listDealsController = async (req, res, next) => {
  try {
    const deals = await listDeals(req.user.tenantId);
    res.json(deals);
  } catch (err) {
    next(err);
  }
};

export const updateDealController = async (req, res, next) => {
  try {
    const deal = await updateDeal(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'DEAL',
      entityId: deal.id
    });

    res.json(deal);
  } catch (err) {
    next(err);
  }
};

export const deleteDealController = async (req, res, next) => {
  try {
    await deleteDeal(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'DEAL',
      entityId: req.params.id
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
