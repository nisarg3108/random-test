import express from 'express';
import { getEmployeeHubController } from './employeeHub.controller.js';

const router = express.Router();

// GET /api/employee-hub/  -> aggregated data for current user
router.get('/', getEmployeeHubController);

// Additional endpoints (detailed payslip / leave actions) already exist
// under /api/payroll and /api/leave-requests — the frontend should
// reuse those for actions. This route provides a single aggregated
// payload for the Employee Hub UI.

export default router;
