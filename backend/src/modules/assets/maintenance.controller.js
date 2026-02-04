import {
  createMaintenanceSchedule,
  listMaintenanceSchedules,
  getMaintenanceById,
  updateMaintenance,
  completeMaintenance,
  deleteMaintenance,
  getUpcomingMaintenance,
  getOverdueMaintenance,
} from './maintenance.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

// ========================================
// MAINTENANCE CONTROLLERS
// ========================================

export const createMaintenanceController = async (req, res, next) => {
  try {
    const schedule = await createMaintenanceSchedule(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'ASSET_MAINTENANCE',
      entityId: schedule.id,
      meta: { assetId: schedule.assetId },
    });

    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
};

export const listMaintenanceController = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      assetId: req.query.assetId,
      maintenanceType: req.query.maintenanceType,
    };

    const schedules = await listMaintenanceSchedules(req.user.tenantId, filters);
    res.json(schedules);
  } catch (err) {
    next(err);
  }
};

export const getMaintenanceController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await getMaintenanceById(id, req.user.tenantId);

    if (!schedule) {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }

    res.json(schedule);
  } catch (err) {
    next(err);
  }
};

export const updateMaintenanceController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await updateMaintenance(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'ASSET_MAINTENANCE',
      entityId: id,
    });

    res.json(schedule);
  } catch (err) {
    next(err);
  }
};

export const completeMaintenanceController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await completeMaintenance(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'COMPLETE',
      entity: 'ASSET_MAINTENANCE',
      entityId: id,
    });

    res.json(schedule);
  } catch (err) {
    next(err);
  }
};

export const deleteMaintenanceController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteMaintenance(id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'ASSET_MAINTENANCE',
      entityId: id,
    });

    res.json({ message: 'Maintenance schedule deleted successfully' });
  } catch (err) {
    next(err);
  }
};

export const getUpcomingMaintenanceController = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const schedules = await getUpcomingMaintenance(req.user.tenantId, days);
    res.json(schedules);
  } catch (err) {
    next(err);
  }
};

export const getOverdueMaintenanceController = async (req, res, next) => {
  try {
    const schedules = await getOverdueMaintenance(req.user.tenantId);
    res.json(schedules);
  } catch (err) {
    next(err);
  }
};
