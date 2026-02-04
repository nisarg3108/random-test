import {
  createCommunication,
  listCommunications
} from './communication.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createCommunicationController = async (req, res, next) => {
  try {
    const communication = await createCommunication(req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'COMMUNICATION',
      entityId: communication.id
    });

    res.status(201).json(communication);
  } catch (err) {
    next(err);
  }
};

export const listCommunicationsController = async (req, res, next) => {
  try {
    const communications = await listCommunications(req.user.tenantId, {
      customerId: req.query.customerId,
      contactId: req.query.contactId,
      leadId: req.query.leadId
    });
    res.json(communications);
  } catch (err) {
    next(err);
  }
};
