import express from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { 
  createTaskController,
  getManagerTasksController,
  getTeamTasksController,
  createSalaryStructureController
} from './task.controller.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Task routes
router.post('/', createTaskController);
router.get('/', getTeamTasksController); // Get all tasks
router.get('/manager', getManagerTasksController);
router.get('/team', getTeamTasksController);

// Salary structure routes (part of task management)
router.post('/salary-structure', createSalaryStructureController);

export default router;
