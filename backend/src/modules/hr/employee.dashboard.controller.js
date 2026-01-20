import {
  getEmployeeDashboard,
  getEmployeeTasks,
  updateTaskStatus,
  getEmployeeSalaryStructure,
  createWorkReport,
  getEmployeeWorkReports,
  markNotificationAsRead
} from './employee.dashboard.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const getEmployeeDashboardController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const dashboard = await getEmployeeDashboard(userId, tenantId);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeTasksController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const { status, priority } = req.query;
    const tasks = await getEmployeeTasks(userId, tenantId, { status, priority });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

export const updateTaskStatusController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { taskId } = req.params;
    const { status } = req.body;
    
    const task = await updateTaskStatus(taskId, status, userId, tenantId);

    await logAudit({
      userId,
      tenantId,
      action: 'UPDATE',
      entity: 'TASK',
      entityId: taskId,
      meta: { status }
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
};

export const getEmployeeSalaryController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const salaryStructure = await getEmployeeSalaryStructure(userId, tenantId);
    res.json(salaryStructure);
  } catch (err) {
    next(err);
  }
};

export const createWorkReportController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const report = await createWorkReport(req.body, userId, tenantId);

    await logAudit({
      userId,
      tenantId,
      action: 'CREATE',
      entity: 'WORK_REPORT',
      entityId: report.id
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

export const getWorkReportsController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const { startDate, endDate } = req.query;
    const reports = await getEmployeeWorkReports(userId, tenantId, { startDate, endDate });
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const markNotificationReadController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    const { notificationId } = req.params;
    
    const notification = await markNotificationAsRead(notificationId, userId, tenantId);
    res.json(notification);
  } catch (err) {
    next(err);
  }
};