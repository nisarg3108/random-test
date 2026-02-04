import {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
  createMilestone,
  listMilestones,
  updateMilestone,
  deleteMilestone,
  allocateResource,
  listResources,
  updateResource,
  deleteResource,
  createBudgetEntry,
  listBudgets,
  updateBudgetEntry,
  deleteBudgetEntry,
  logTime,
  listTimeLogs,
  updateTimeLog,
  deleteTimeLog,
  getProjectDashboard,
} from './project.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

// ============================================
// PROJECT CONTROLLERS
// ============================================

export const createProjectController = async (req, res, next) => {
  try {
    const project = await createProject(req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PROJECT',
      entityId: project.id,
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const listProjectsController = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      projectManager: req.query.projectManager,
      departmentId: req.query.departmentId,
    };

    const projects = await listProjects(req.user.tenantId, filters);
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

export const getProjectByIdController = async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.id, req.user.tenantId);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const updateProjectController = async (req, res, next) => {
  try {
    const project = await updateProject(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PROJECT',
      entityId: project.id,
    });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const deleteProjectController = async (req, res, next) => {
  try {
    const result = await deleteProject(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PROJECT',
      entityId: req.params.id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================================
// MILESTONE CONTROLLERS
// ============================================

export const createMilestoneController = async (req, res, next) => {
  try {
    const milestone = await createMilestone(req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PROJECT_MILESTONE',
      entityId: milestone.id,
    });

    res.status(201).json(milestone);
  } catch (err) {
    next(err);
  }
};

export const listMilestonesController = async (req, res, next) => {
  try {
    const milestones = await listMilestones(req.params.projectId, req.user.tenantId);
    res.json(milestones);
  } catch (err) {
    next(err);
  }
};

export const updateMilestoneController = async (req, res, next) => {
  try {
    const milestone = await updateMilestone(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PROJECT_MILESTONE',
      entityId: milestone.id,
    });

    res.json(milestone);
  } catch (err) {
    next(err);
  }
};

export const deleteMilestoneController = async (req, res, next) => {
  try {
    const result = await deleteMilestone(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PROJECT_MILESTONE',
      entityId: req.params.id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================================
// RESOURCE ALLOCATION CONTROLLERS
// ============================================

export const allocateResourceController = async (req, res, next) => {
  try {
    const resource = await allocateResource(req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PROJECT_RESOURCE',
      entityId: resource.id,
    });

    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
};

export const listResourcesController = async (req, res, next) => {
  try {
    const resources = await listResources(req.params.projectId, req.user.tenantId);
    res.json(resources);
  } catch (err) {
    next(err);
  }
};

export const updateResourceController = async (req, res, next) => {
  try {
    const resource = await updateResource(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PROJECT_RESOURCE',
      entityId: resource.id,
    });

    res.json(resource);
  } catch (err) {
    next(err);
  }
};

export const deleteResourceController = async (req, res, next) => {
  try {
    const result = await deleteResource(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PROJECT_RESOURCE',
      entityId: req.params.id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================================
// BUDGET CONTROLLERS
// ============================================

export const createBudgetController = async (req, res, next) => {
  try {
    const budget = await createBudgetEntry(req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PROJECT_BUDGET',
      entityId: budget.id,
    });

    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
};

export const listBudgetsController = async (req, res, next) => {
  try {
    const budgets = await listBudgets(req.params.projectId, req.user.tenantId);
    res.json(budgets);
  } catch (err) {
    next(err);
  }
};

export const updateBudgetController = async (req, res, next) => {
  try {
    const budget = await updateBudgetEntry(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PROJECT_BUDGET',
      entityId: budget.id,
    });

    res.json(budget);
  } catch (err) {
    next(err);
  }
};

export const deleteBudgetController = async (req, res, next) => {
  try {
    const result = await deleteBudgetEntry(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PROJECT_BUDGET',
      entityId: req.params.id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================================
// TIME TRACKING CONTROLLERS
// ============================================

export const logTimeController = async (req, res, next) => {
  try {
    const timeLog = await logTime(req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'PROJECT_TIME_LOG',
      entityId: timeLog.id,
    });

    res.status(201).json(timeLog);
  } catch (err) {
    next(err);
  }
};

export const listTimeLogsController = async (req, res, next) => {
  try {
    const filters = {
      employeeId: req.query.employeeId,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const timeLogs = await listTimeLogs(req.params.projectId, req.user.tenantId, filters);
    res.json(timeLogs);
  } catch (err) {
    next(err);
  }
};

export const updateTimeLogController = async (req, res, next) => {
  try {
    const timeLog = await updateTimeLog(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'PROJECT_TIME_LOG',
      entityId: timeLog.id,
    });

    res.json(timeLog);
  } catch (err) {
    next(err);
  }
};

export const deleteTimeLogController = async (req, res, next) => {
  try {
    const result = await deleteTimeLog(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'PROJECT_TIME_LOG',
      entityId: req.params.id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================================
// DASHBOARD CONTROLLER
// ============================================

export const getProjectDashboardController = async (req, res, next) => {
  try {
    const dashboard = await getProjectDashboard(req.user.tenantId, req.user.userId);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
};
