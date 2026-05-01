import express from 'express';
import {
  getMySalaryInfoController,
  getMyPayslipsController,
  downloadPayslipController,
  getMyLeaveBalanceController,
  getMyAttendanceSummaryController
} from './selfService.controller.js';

const router = express.Router();

// All routes are accessible to any authenticated user
router.get('/salary', getMySalaryInfoController);
router.get('/payslips', getMyPayslipsController);
router.get('/payslips/:id', downloadPayslipController);
router.get('/leave-balance', getMyLeaveBalanceController);
router.get('/attendance-summary', getMyAttendanceSummaryController);

export default router;
