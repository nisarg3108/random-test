import {
  getOrCreateTimesheet,
  createTimesheet,
  getTimesheetById,
  listTimesheets,
  updateTimesheet,
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  getMyTimesheets,
  getPendingApprovals,
  deleteTimesheet,
  getTimesheetSummary,
} from './timesheet.service.js';
import { logAudit } from '../../core/audit/audit.service.js';
import prisma from '../../config/db.js';

// ============================================
// TIMESHEET CONTROLLERS
// ============================================

export const getOrCreateTimesheetController = async (req, res, next) => {
  try {
    let { employeeId, weekStartDate } = req.query;

    if (!weekStartDate) {
      return res.status(400).json({ error: 'weekStartDate is required' });
    }

    // If employeeId not provided, use current user's employee record
    if (!employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.userId },
        select: { id: true },
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee record not found for current user' });
      }

      employeeId = employee.id;
    }

    const timesheet = await getOrCreateTimesheet(employeeId, weekStartDate, req.user.tenantId);
    res.json(timesheet);
  } catch (err) {
    next(err);
  }
};

export const createTimesheetController = async (req, res, next) => {
  try {
    const { employeeId, weekStartDate } = req.body;

    if (!employeeId || !weekStartDate) {
      return res.status(400).json({ error: 'employeeId and weekStartDate are required' });
    }

    const timesheet = await createTimesheet(employeeId, weekStartDate, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PROJECT_TIMESHEET',
      entityId: timesheet.id,
    });

    res.status(201).json(timesheet);
  } catch (err) {
    next(err);
  }
};

export const getTimesheetByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timesheet = await getTimesheetById(id, req.user.tenantId);
    res.json(timesheet);
  } catch (err) {
    next(err);
  }
};

export const listTimesheetsController = async (req, res, next) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const timesheets = await listTimesheets(req.user.tenantId, filters);
    res.json(timesheets);
  } catch (err) {
    next(err);
  }
};

export const updateTimesheetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timesheet = await updateTimesheet(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PROJECT_TIMESHEET',
      entityId: timesheet.id,
    });

    res.json(timesheet);
  } catch (err) {
    next(err);
  }
};

export const submitTimesheetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timesheet = await submitTimesheet(id, req.user.userId, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'SUBMIT',
      entity: 'PROJECT_TIMESHEET',
      entityId: timesheet.id,
    });

    res.json(timesheet);
  } catch (err) {
    // Handle validation errors with 400 status
    if (err.message === 'Cannot submit an empty timesheet' || 
        err.message === 'Only draft timesheets can be submitted' ||
        err.message === 'Timesheet not found') {
      return res.status(err.message === 'Timesheet not found' ? 404 : 400).json({ 
        error: err.message 
      });
    }
    next(err);
  }
};

export const approveTimesheetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const timesheet = await approveTimesheet(id, req.user.userId, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'APPROVE',
      entity: 'PROJECT_TIMESHEET',
      entityId: timesheet.id,
    });

    res.json(timesheet);
  } catch (err) {
    // Handle validation errors with 400 status
    if (err.message === 'Only submitted timesheets can be approved' ||
        err.message === 'Timesheet not found') {
      return res.status(err.message === 'Timesheet not found' ? 404 : 400).json({ 
        error: err.message 
      });
    }
    next(err);
  }
};

export const rejectTimesheetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const timesheet = await rejectTimesheet(id, req.user.userId, reason, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'REJECT',
      entity: 'PROJECT_TIMESHEET',
      entityId: timesheet.id,
      details: { reason },
    });

    res.json(timesheet);
  } catch (err) {
    // Handle validation errors with 400 status
    if (err.message === 'Only submitted timesheets can be rejected' ||
        err.message === 'Timesheet not found') {
      return res.status(err.message === 'Timesheet not found' ? 404 : 400).json({ 
        error: err.message 
      });
    }
    next(err);
  }
};

export const getMyTimesheetsController = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const timesheets = await getMyTimesheets(employeeId, req.user.tenantId, filters);
    res.json(timesheets);
  } catch (err) {
    next(err);
  }
};

export const getPendingApprovalsController = async (req, res, next) => {
  try {
    const timesheets = await getPendingApprovals(req.user.userId, req.user.tenantId);
    res.json(timesheets);
  } catch (err) {
    next(err);
  }
};

export const deleteTimesheetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await deleteTimesheet(id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PROJECT_TIMESHEET',
      entityId: id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getTimesheetSummaryController = async (req, res, next) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const summary = await getTimesheetSummary(req.user.tenantId, filters);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user's timesheets
 */
export const getCurrentUserTimesheetsController = async (req, res, next) => {
  try {
    // Get employee record for current user
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found for current user' });
    }

    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const timesheets = await getMyTimesheets(employee.id, req.user.tenantId, filters);
    res.json(timesheets);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user's timesheet summary
 */
export const getCurrentUserTimesheetSummaryController = async (req, res, next) => {
  try {
    // Get employee record for current user
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found for current user' });
    }

    const filters = {
      employeeId: employee.id,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const summary = await getTimesheetSummary(req.user.tenantId, filters);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};
