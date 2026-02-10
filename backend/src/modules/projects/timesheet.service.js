import prisma from '../../config/db.js';
import { startOfWeek, endOfWeek, addDays, isSameWeek } from 'date-fns';

// ============================================
// TIMESHEET MANAGEMENT
// ============================================

/**
 * Get or create timesheet for a specific week
 */
export const getOrCreateTimesheet = async (employeeId, weekStartDate, tenantId) => {
  const start = startOfWeek(new Date(weekStartDate), { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(start, { weekStartsOn: 1 }); // Sunday

  let timesheet = await prisma.projectTimesheet.findFirst({
    where: {
      tenantId,
      employeeId,
      weekStartDate: start,
    },
    include: {
      timeLogs: {
        orderBy: { logDate: 'asc' },
      },
    },
  });

  if (!timesheet) {
    timesheet = await prisma.projectTimesheet.create({
      data: {
        tenantId,
        employeeId,
        weekStartDate: start,
        weekEndDate: end,
        status: 'DRAFT',
      },
      include: {
        timeLogs: true,
      },
    });
  }

  return timesheet;
};

/**
 * Create a new timesheet
 */
export const createTimesheet = async (employeeId, weekStartDate, tenantId) => {
  const start = startOfWeek(new Date(weekStartDate), { weekStartsOn: 1 });
  const end = endOfWeek(start, { weekStartsOn: 1 });

  // Check if timesheet already exists
  const existing = await prisma.projectTimesheet.findFirst({
    where: {
      tenantId,
      employeeId,
      weekStartDate: start,
    },
  });

  if (existing) {
    throw new Error('Timesheet already exists for this week');
  }

  const timesheet = await prisma.projectTimesheet.create({
    data: {
      tenantId,
      employeeId,
      weekStartDate: start,
      weekEndDate: end,
      status: 'DRAFT',
    },
  });

  return timesheet;
};

/**
 * Get timesheet by ID
 */
export const getTimesheetById = async (timesheetId, tenantId) => {
  const timesheet = await prisma.projectTimesheet.findFirst({
    where: { id: timesheetId, tenantId },
    include: {
      timeLogs: {
        include: {
          project: {
            select: {
              projectName: true,
              projectCode: true,
            },
          },
        },
        orderBy: { logDate: 'asc' },
      },
    },
  });

  if (!timesheet) {
    throw new Error('Timesheet not found');
  }

  return timesheet;
};

/**
 * List timesheets with filters
 */
export const listTimesheets = async (tenantId, filters = {}) => {
  const where = { tenantId };

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.startDate && filters.endDate) {
    where.weekStartDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  return prisma.projectTimesheet.findMany({
    where,
    include: {
      _count: {
        select: { timeLogs: true },
      },
    },
    orderBy: { weekStartDate: 'desc' },
  });
};

/**
 * Update timesheet
 */
export const updateTimesheet = async (timesheetId, data, tenantId) => {
  const timesheet = await prisma.projectTimesheet.findFirst({
    where: { id: timesheetId, tenantId },
  });

  if (!timesheet) {
    throw new Error('Timesheet not found');
  }

  // Check if timesheet is locked
  if (['APPROVED', 'BILLED'].includes(timesheet.status)) {
    throw new Error('Cannot update an approved or billed timesheet');
  }

  const updateData = {};
  
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;

  // Handle time log entries
  if (data.entries && Array.isArray(data.entries)) {
    // Delete existing time logs
    await prisma.projectTimeLog.deleteMany({
      where: { timesheetId, tenantId },
    });

    // Create new time logs
    if (data.entries.length > 0) {
      await prisma.projectTimeLog.createMany({
        data: data.entries.map(entry => ({
          tenantId,
          timesheetId,
          employeeId: timesheet.employeeId,
          projectId: entry.projectId,
          milestoneId: entry.milestoneId || null,
          logDate: new Date(entry.date),
          hoursWorked: entry.hours,
          taskDescription: entry.taskDescription,
          billable: entry.billable !== undefined ? entry.billable : true,
          status: 'LOGGED',
        })),
      });
    }
  }

  return prisma.projectTimesheet.update({
    where: { id: timesheetId },
    data: updateData,
    include: {
      timeLogs: true,
    },
  });
};

/**
 * Submit timesheet for approval
 */
export const submitTimesheet = async (timesheetId, userId, tenantId) => {
  const timesheet = await prisma.projectTimesheet.findFirst({
    where: { id: timesheetId, tenantId },
    include: {
      timeLogs: true,
    },
  });

  if (!timesheet) {
    throw new Error('Timesheet not found');
  }

  if (timesheet.status !== 'DRAFT') {
    throw new Error('Only draft timesheets can be submitted');
  }

  if (timesheet.timeLogs.length === 0) {
    throw new Error('Cannot submit an empty timesheet');
  }

  // Calculate totals
  const totals = await calculateTimesheetTotals(timesheetId);

  const updated = await prisma.projectTimesheet.update({
    where: { id: timesheetId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      submittedBy: userId,
      totalHours: totals.totalHours,
      billableHours: totals.billableHours,
    },
    include: {
      timeLogs: true,
    },
  });

  // TODO: Send notification to manager

  return updated;
};

/**
 * Approve timesheet
 */
export const approveTimesheet = async (timesheetId, approverId, tenantId) => {
  const timesheet = await prisma.projectTimesheet.findFirst({
    where: { id: timesheetId, tenantId },
    include: {
      timeLogs: true,
    },
  });

  if (!timesheet) {
    throw new Error('Timesheet not found');
  }

  if (timesheet.status !== 'SUBMITTED') {
    throw new Error('Only submitted timesheets can be approved');
  }

  // Update timesheet status
  const updated = await prisma.projectTimesheet.update({
    where: { id: timesheetId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: approverId,
    },
    include: {
      timeLogs: {
        include: {
          project: true,
        },
      },
    },
  });

  // Update all time logs to APPROVED status
  await prisma.projectTimeLog.updateMany({
    where: {
      timesheetId,
      tenantId,
    },
    data: {
      status: 'APPROVED',
    },
  });

  // Update project actual costs and hours
  for (const timeLog of updated.timeLogs) {
    await updateProjectActuals(timeLog.projectId, tenantId);
  }

  // TODO: Send notification to employee

  return updated;
};

/**
 * Reject timesheet
 */
export const rejectTimesheet = async (timesheetId, approverId, reason, tenantId) => {
  const timesheet = await prisma.projectTimesheet.findFirst({
    where: { id: timesheetId, tenantId },
  });

  if (!timesheet) {
    throw new Error('Timesheet not found');
  }

  if (timesheet.status !== 'SUBMITTED') {
    throw new Error('Only submitted timesheets can be rejected');
  }

  const updated = await prisma.projectTimesheet.update({
    where: { id: timesheetId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: approverId,
      rejectionReason: reason,
    },
  });

  // Update all time logs back to LOGGED status
  await prisma.projectTimeLog.updateMany({
    where: {
      timesheetId,
      tenantId,
    },
    data: {
      status: 'LOGGED',
    },
  });

  // TODO: Send notification to employee with rejection reason

  return updated;
};

/**
 * Calculate totals for a timesheet
 */
export const calculateTimesheetTotals = async (timesheetId) => {
  const timeLogs = await prisma.projectTimeLog.findMany({
    where: { timesheetId },
  });

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hoursWorked, 0);
  const billableHours = timeLogs
    .filter(log => log.billable)
    .reduce((sum, log) => sum + log.hoursWorked, 0);

  return {
    totalHours,
    billableHours,
    nonBillableHours: totalHours - billableHours,
    timeLogCount: timeLogs.length,
  };
};

/**
 * Get my timesheets (for employee)
 */
export const getMyTimesheets = async (employeeId, tenantId, filters = {}) => {
  const where = {
    tenantId,
    employeeId,
  };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.startDate && filters.endDate) {
    where.weekStartDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  const timesheets = await prisma.projectTimesheet.findMany({
    where,
    include: {
      timeLogs: {
        select: {
          id: true,
          project: {
            select: {
              projectName: true,
              projectCode: true,
            },
          },
          hoursWorked: true,
          billable: true,
        },
      },
      _count: {
        select: { timeLogs: true },
      },
    },
    orderBy: { weekStartDate: 'desc' },
  });

  return timesheets;
};

/**
 * Get pending approvals (for managers)
 */
export const getPendingApprovals = async (managerId, tenantId) => {
  // Get all projects where user is project manager
  const projects = await prisma.project.findMany({
    where: {
      tenantId,
      projectManager: managerId,
    },
    select: {
      members: {
        select: {
          employeeId: true,
        },
      },
    },
  });

  // Get unique employee IDs
  const employeeIds = [...new Set(projects.flatMap(p => p.members.map(m => m.employeeId)))];

  if (employeeIds.length === 0) {
    return [];
  }

  // Get pending timesheets for these employees
  const timesheets = await prisma.projectTimesheet.findMany({
    where: {
      tenantId,
      employeeId: { in: employeeIds },
      status: 'SUBMITTED',
    },
    include: {
      timeLogs: {
        include: {
          project: {
            select: {
              projectName: true,
              projectCode: true,
            },
          },
        },
      },
      _count: {
        select: { timeLogs: true },
      },
    },
    orderBy: { submittedAt: 'asc' },
  });

  return timesheets;
};

/**
 * Delete timesheet (only if DRAFT)
 */
export const deleteTimesheet = async (timesheetId, tenantId) => {
  const timesheet = await prisma.projectTimesheet.findFirst({
    where: { id: timesheetId, tenantId },
  });

  if (!timesheet) {
    throw new Error('Timesheet not found');
  }

  if (timesheet.status !== 'DRAFT') {
    throw new Error('Only draft timesheets can be deleted');
  }

  // Delete associated time logs first
  await prisma.projectTimeLog.deleteMany({
    where: { timesheetId },
  });

  await prisma.projectTimesheet.delete({
    where: { id: timesheetId },
  });

  return { message: 'Timesheet deleted successfully' };
};

/**
 * Update project actual hours and costs
 */
const updateProjectActuals = async (projectId, tenantId) => {
  // Get all approved time logs for this project
  const timeLogs = await prisma.projectTimeLog.findMany({
    where: {
      projectId,
      tenantId,
      status: 'APPROVED',
    },
  });

  const totalActualHours = timeLogs.reduce((sum, log) => sum + log.hoursWorked, 0);
  const timeLogCost = timeLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);

  // Get resource costs
  const resources = await prisma.projectResource.findMany({
    where: { projectId, tenantId },
  });
  const resourceCost = resources.reduce((sum, r) => sum + r.totalCost, 0);

  // Get budget actuals
  const budgets = await prisma.projectBudget.findMany({
    where: { projectId, tenantId },
  });
  const budgetActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0);

  // Update project
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
  });

  const totalActualCost = timeLogCost + resourceCost + budgetActual;
  const budgetVariance = project.estimatedBudget - totalActualCost;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      totalActualHours,
      actualCost: totalActualCost,
      totalResourceCost: resourceCost,
      budgetVariance,
    },
  });
};

/**
 * Get timesheet summary for a date range
 */
export const getTimesheetSummary = async (tenantId, filters = {}) => {
  const where = { tenantId };

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.startDate && filters.endDate) {
    where.weekStartDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }

  const timesheets = await prisma.projectTimesheet.findMany({
    where,
    include: {
      timeLogs: true,
    },
  });

  const summary = {
    totalTimesheets: timesheets.length,
    totalHours: timesheets.reduce((sum, ts) => sum + ts.totalHours, 0),
    totalBillableHours: timesheets.reduce((sum, ts) => sum + ts.billableHours, 0),
    byStatus: {
      DRAFT: timesheets.filter(ts => ts.status === 'DRAFT').length,
      SUBMITTED: timesheets.filter(ts => ts.status === 'SUBMITTED').length,
      APPROVED: timesheets.filter(ts => ts.status === 'APPROVED').length,
      REJECTED: timesheets.filter(ts => ts.status === 'REJECTED').length,
    },
  };

  return summary;
};
