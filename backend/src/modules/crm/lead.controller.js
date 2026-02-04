import {
  createLead,
  listLeads,
  updateLead,
  convertLead
} from './lead.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createLeadController = async (req, res, next) => {
  try {
    const lead = await createLead(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'LEAD',
      entityId: lead.id
    });

    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
};

export const listLeadsController = async (req, res, next) => {
  try {
    const leads = await listLeads(req.user.tenantId);
    res.json(leads);
  } catch (err) {
    next(err);
  }
};

export const updateLeadController = async (req, res, next) => {
  try {
    const lead = await updateLead(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'LEAD',
      entityId: lead.id
    });

    res.json(lead);
  } catch (err) {
    next(err);
  }
};

export const convertLeadController = async (req, res, next) => {
  try {
    const result = await convertLead(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CONVERT',
      entity: 'LEAD',
      entityId: result.lead.id
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};
