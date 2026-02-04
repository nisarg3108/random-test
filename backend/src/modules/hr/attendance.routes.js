import express from 'express';
import * as attendanceController from './attendance.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';
import { requireRole } from '../../core/auth/role.middleware.js';

const router = express.Router();

// All attendance routes require authentication
router.use(authenticate);

// ==========================================
// CLOCK IN/OUT ROUTES
// ==========================================

// Clock in
router.post('/clock-in', attendanceController.clockIn);

// Clock out
router.post('/clock-out', attendanceController.clockOut);

// Get clock status for an employee
router.get('/clock-status/:employeeId', attendanceController.getClockStatus);

// ==========================================
// SHIFT MANAGEMENT ROUTES
// ==========================================

// Create a new shift
router.post('/shifts', requireRole(['ADMIN', 'HR']), attendanceController.createShift);

// Get all shifts
router.get('/shifts', attendanceController.getShifts);

// Assign shift to employee
router.post('/shifts/assign', requireRole(['ADMIN', 'HR']), attendanceController.assignShift);

// Get employee's current shift
router.get('/shifts/employee/:employeeId', attendanceController.getEmployeeShift);

// ==========================================
// OVERTIME MANAGEMENT ROUTES
// ==========================================

// Create overtime policy
router.post('/overtime-policies', requireRole(['ADMIN', 'HR']), attendanceController.createOvertimePolicy);

// Get overtime hours for an employee on a specific date
router.get('/overtime-hours/:employeeId', attendanceController.getOvertimeHours);

// Record overtime manually
router.post('/overtime-records/:employeeId', attendanceController.recordOvertimeManual);

// Approve overtime record
router.put('/overtime-records/:overtimeRecordId/approve', requireRole(['ADMIN', 'HR']), attendanceController.approveOvertimeRecord);

// ==========================================
// ATTENDANCE REPORTING ROUTES
// ==========================================

// Generate monthly attendance report
router.post('/reports/:employeeId/generate', requireRole(['ADMIN', 'HR']), attendanceController.generateMonthlyReport);

// Get monthly attendance report
router.get('/reports/:employeeId', attendanceController.getMonthlyReport);

// Get team attendance report
router.get('/reports/department/:departmentId', requireRole(['ADMIN', 'HR']), attendanceController.getTeamReport);

// ==========================================
// LEAVE INTEGRATION ROUTES
// ==========================================

// Integrate leave with attendance
router.post('/leave-integration', requireRole(['ADMIN', 'HR']), attendanceController.integrateLeave);

export default router;
