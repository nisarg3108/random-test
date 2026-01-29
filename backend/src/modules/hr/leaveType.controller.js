import { createLeaveType, listLeaveTypes, updateLeaveType, deleteLeaveType, getLeaveType } from './leaveType.service.js';
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

export const updateLeaveTypeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leaveType = await updateLeaveType(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'LEAVE_TYPE',
      entityId: leaveType.id,
    });

    res.json(leaveType);
  } catch (err) {
    next(err);
  }
};

export const getLeaveTypeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const leaveType = await getLeaveType(id, req.user.tenantId);
    
    if (!leaveType) {
      return res.status(404).json({ error: 'Leave type not found' });
    }
    
    res.json(leaveType);
  } catch (err) {
    next(err);
  }
};

export const deleteLeaveTypeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteLeaveType(id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'LEAVE_TYPE',
      entityId: id,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

