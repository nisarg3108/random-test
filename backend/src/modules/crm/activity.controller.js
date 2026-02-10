import {
  createActivity,
  listActivities,
  getActivity,
  updateActivity,
  deleteActivity,
  completeActivity,
  getMyActivities,
  getOverdueActivities,
  getUpcomingActivities
} from './activity.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createActivityController = async (req, res, next) => {
  try {
    const activity = await createActivity(req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'ACTIVITY',
      entityId: activity.id
    });

    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
};

export const listActivitiesController = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      type: req.query.type,
      assignedTo: req.query.assignedTo,
      customerId: req.query.customerId,
      contactId: req.query.contactId,
      leadId: req.query.leadId,
      dealId: req.query.dealId,
      overdue: req.query.overdue === 'true',
      dueToday: req.query.dueToday === 'true'
    };
    const activities = await listActivities(req.user.tenantId, filters);
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

export const getActivityController = async (req, res, next) => {
  try {
    const activity = await getActivity(req.params.id, req.user.tenantId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

export const updateActivityController = async (req, res, next) => {
  try {
    const activity = await updateActivity(req.params.id, req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'ACTIVITY',
      entityId: activity.id
    });

    res.json(activity);
  } catch (err) {
    next(err);
  }
};

export const deleteActivityController = async (req, res, next) => {
  try {
    await deleteActivity(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'ACTIVITY',
      entityId: req.params.id
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const completeActivityController = async (req, res, next) => {
  try {
    const { outcome, notes } = req.body;
    const activity = await completeActivity(req.params.id, outcome, notes, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'ACTIVITY',
      entityId: activity.id,
      details: 'Marked as completed'
    });

    res.json(activity);
  } catch (err) {
    next(err);
  }
};

export const getMyActivitiesController = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      type: req.query.type
    };
    const activities = await getMyActivities(req.user.tenantId, req.user.userId, filters);
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

export const getOverdueActivitiesController = async (req, res, next) => {
  try {
    const userId = req.query.myOnly === 'true' ? req.user.userId : null;
    const activities = await getOverdueActivities(req.user.tenantId, userId);
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

export const getUpcomingActivitiesController = async (req, res, next) => {
  try {
    const userId = req.query.myOnly === 'true' ? req.user.userId : null;
    const days = parseInt(req.query.days) || 7;
    const activities = await getUpcomingActivities(req.user.tenantId, userId, days);
    res.json(activities);
  } catch (err) {
    next(err);
  }
};
