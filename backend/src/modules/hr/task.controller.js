import {
  createTask,
  getTasksByManager,
  createSalaryStructure,
  getTeamTasks,
  createNotification
} from './task.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createTaskController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const task = await createTask(req.body, userId, tenantId);

    await logAudit({
      userId,
      tenantId,
      action: 'CREATE',
      entity: 'TASK',
      entityId: task.id
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const getManagerTasksController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const tasks = await getTasksByManager(userId, tenantId);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

export const createSalaryStructureController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const salaryStructure = await createSalaryStructure(req.body, tenantId);

    await logAudit({
      userId,
      tenantId,
      action: 'CREATE',
      entity: 'SALARY_STRUCTURE',
      entityId: salaryStructure.id
    });

    // Create notification for employee
    await createNotification({
      employeeId: req.body.employeeId,
      type: 'SALARY_UPDATE',
      title: 'Salary Structure Updated',
      message: 'Your salary structure has been updated. Please check your profile for details.'
    }, tenantId);

    res.status(201).json(salaryStructure);
  } catch (err) {
    next(err);
  }
};

export const getTeamTasksController = async (req, res, next) => {
  try {
    const { userId, tenantId } = req.user;
    
    const tasks = await getTeamTasks(userId, tenantId);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};