import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createProjectController,
  listProjectsController,
  getProjectByIdController,
  updateProjectController,
  deleteProjectController,
  createMilestoneController,
  listMilestonesController,
  updateMilestoneController,
  deleteMilestoneController,
  allocateResourceController,
  listResourcesController,
  updateResourceController,
  deleteResourceController,
  createBudgetController,
  listBudgetsController,
  updateBudgetController,
  deleteBudgetController,
  logTimeController,
  listTimeLogsController,
  updateTimeLogController,
  deleteTimeLogController,
  getProjectDashboardController,
} from './project.controller.js';

const router = Router();

// Dashboard
router.get('/dashboard', requireAuth, getProjectDashboardController);

// Project CRUD
router.post(
  '/',
  requireAuth,
  requirePermission('project.create'),
  createProjectController
);

router.get(
  '/',
  requireAuth,
  requirePermission('project.view'),
  listProjectsController
);

router.get(
  '/:id',
  requireAuth,
  requirePermission('project.view'),
  getProjectByIdController
);

router.put(
  '/:id',
  requireAuth,
  requirePermission('project.update'),
  updateProjectController
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('project.delete'),
  deleteProjectController
);

// Milestone Management
router.post(
  '/milestones',
  requireAuth,
  requirePermission('project.update'),
  createMilestoneController
);

router.get(
  '/:projectId/milestones',
  requireAuth,
  requirePermission('project.view'),
  listMilestonesController
);

router.put(
  '/milestones/:id',
  requireAuth,
  requirePermission('project.update'),
  updateMilestoneController
);

router.delete(
  '/milestones/:id',
  requireAuth,
  requirePermission('project.delete'),
  deleteMilestoneController
);

// Resource Allocation
router.post(
  '/resources',
  requireAuth,
  requirePermission('project.update'),
  allocateResourceController
);

router.get(
  '/:projectId/resources',
  requireAuth,
  requirePermission('project.view'),
  listResourcesController
);

router.put(
  '/resources/:id',
  requireAuth,
  requirePermission('project.update'),
  updateResourceController
);

router.delete(
  '/resources/:id',
  requireAuth,
  requirePermission('project.delete'),
  deleteResourceController
);

// Budget Management
router.post(
  '/budgets',
  requireAuth,
  requirePermission('project.update'),
  createBudgetController
);

router.get(
  '/:projectId/budgets',
  requireAuth,
  requirePermission('project.view'),
  listBudgetsController
);

router.put(
  '/budgets/:id',
  requireAuth,
  requirePermission('project.update'),
  updateBudgetController
);

router.delete(
  '/budgets/:id',
  requireAuth,
  requirePermission('project.delete'),
  deleteBudgetController
);

// Time Tracking
router.post(
  '/time-logs',
  requireAuth,
  requirePermission('project.timetracking'),
  logTimeController
);

router.get(
  '/:projectId/time-logs',
  requireAuth,
  requirePermission('project.view'),
  listTimeLogsController
);

router.put(
  '/time-logs/:id',
  requireAuth,
  requirePermission('project.timetracking'),
  updateTimeLogController
);

router.delete(
  '/time-logs/:id',
  requireAuth,
  requirePermission('project.timetracking'),
  deleteTimeLogController
);

export default router;
