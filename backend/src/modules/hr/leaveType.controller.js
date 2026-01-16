import { createLeaveType, listLeaveTypes } from './leaveType.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createLeaveTypeController = async (req, res, next) => {
  try {
    const leaveType = await createLeaveType(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'LEAVE_TYPE',
      entityId: leaveType.id,
    });

    res.status(201).json(leaveType);
  } catch (err) {
    next(err);
  }
};

export const listLeaveTypesController = async (req, res, next) => {
  try {
    const leaveTypes = await listLeaveTypes(req.user.tenantId);
    res.json(leaveTypes);
  } catch (err) {
    next(err);
  }
};

