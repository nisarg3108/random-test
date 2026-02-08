import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createEmployeeController,
  listEmployeesController,
  assignManagerController,
  getMyProfileController,
  updateEmployeeController,
  deleteEmployeeController,
} from './employee.controller.js';
import {
  getEmployeeDashboardController,
  getEmployeeTasksController,
  updateTaskStatusController,
  getEmployeeSalaryController,
  createWorkReportController,
  getWorkReportsController,
  markNotificationReadController
} from './employee.dashboard.controller.js';
import {
  createTaskController,
  getManagerTasksController,
  createSalaryStructureController,
  getTeamTasksController
} from './task.controller.js';

const router = Router();

// Employee Management (HR/Admin)
router.post(
  '/',
  requireAuth,
  requirePermission('employee.create'),
  createEmployeeController
);
router.put(
  '/:id',
  requireAuth,
  requirePermission('employee.manage'),
  updateEmployeeController
);
router.delete(
  '/:id',
  requireAuth,
  requirePermission('employee.manage'),
  deleteEmployeeController
);
router.post(
  '/assign-manager',
  requireAuth,
  requirePermission('employee.manage'),
  assignManagerController
);
router.get(
  '/',
  requireAuth,
  requirePermission('employee.view'),
  listEmployeesController
);

// Employee Dashboard & Profile
router.get(
  '/my-profile',
  requireAuth,
  getMyProfileController
);
router.get('/dashboard', requireAuth, getEmployeeDashboardController);

// Task Management for Employees
router.get('/tasks', requireAuth, getEmployeeTasksController);
router.put('/tasks/:taskId/status', requireAuth, updateTaskStatusController);

// Salary Information (Employee View)
router.get('/salary', requireAuth, getEmployeeSalaryController);

// Work Reports
router.post('/work-reports', requireAuth, createWorkReportController);
router.get('/work-reports', requireAuth, getWorkReportsController);

// Notifications
router.put('/notifications/:notificationId/read', requireAuth, markNotificationReadController);

// Manager/HR Task Management
router.post('/tasks', requireAuth, requirePermission('employee.manage'), createTaskController);
router.get('/manager/tasks', requireAuth, getManagerTasksController);
router.get('/team/tasks', requireAuth, getTeamTasksController);

// Salary Structure Management (HR/Admin)
router.post('/salary-structure', requireAuth, requirePermission('employee.manage'), createSalaryStructureController);

export default router;