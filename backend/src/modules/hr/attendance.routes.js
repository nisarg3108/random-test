import express from 'express';
import attendanceController from './attendance.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../core/auth/role.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================
// CLOCK IN/OUT ROUTES
// ============================================

/**
 * POST /api/attendance/clock-in
 * Clock in with location tracking
 */
router.post('/clock-in', attendanceController.clockIn);

/**
 * POST /api/attendance/clock-out
 * Clock out with location tracking
 */
router.post('/clock-out', attendanceController.clockOut);

/**
 * GET /api/attendance/clock-status/:employeeId
 * Get current clock status for an employee
 */
router.get('/clock-status/:employeeId', attendanceController.getClockStatus);

// ============================================
// SHIFT MANAGEMENT ROUTES
// ============================================

/**
 * POST /api/attendance/shifts
 * Create a new shift (HR/Admin only)
 */
router.post('/shifts', requireRole(['ADMIN', 'HR']), attendanceController.createShift);

/**
 * GET /api/attendance/shifts
 * Get all shifts
 */
router.get('/shifts', attendanceController.getAllShifts);

/**
 * POST /api/attendance/shifts/assign
 * Assign shift to employee (HR/Admin only)
 */
router.post('/shifts/assign', requireRole(['ADMIN', 'HR']), attendanceController.assignShift);

/**
 * GET /api/attendance/shifts/employee/:employeeId
 * Get current shift for an employee
 */
router.get('/shifts/employee/:employeeId', attendanceController.getEmployeeShift);

/**
 * GET /api/attendance/shifts/history/:employeeId
 * Get shift assignment history for an employee
 */
router.get('/shifts/history/:employeeId', attendanceController.getShiftHistory);

// ============================================
// OVERTIME ROUTES
// ============================================

/**
 * POST /api/attendance/overtime-policies
 * Create overtime policy (HR/Admin only)
 */
router.post('/overtime-policies', requireRole(['ADMIN', 'HR']), attendanceController.createOvertimePolicy);

/**
 * GET /api/attendance/overtime-hours/:employeeId
 * Calculate overtime hours for a specific date
 * Query params: date (YYYY-MM-DD)
 */
router.get('/overtime-hours/:employeeId', attendanceController.calculateOvertimeHours);

/**
 * POST /api/attendance/overtime-records/:employeeId
 * Record overtime for an employee
 */
router.post('/overtime-records/:employeeId', attendanceController.recordOvertime);

/**
 * PUT /api/attendance/overtime-records/:overtimeRecordId/approve
 * Approve overtime request (HR/Manager/Admin only)
 */
router.put(
  '/overtime-records/:overtimeRecordId/approve',
  requireRole(['ADMIN', 'HR', 'MANAGER']),
  attendanceController.approveOvertime
);

// ============================================
// ATTENDANCE REPORT ROUTES
// ============================================

/**
 * POST /api/attendance/reports/:employeeId/generate
 * Generate monthly attendance report
 * Query params: month, year
 */
router.post('/reports/:employeeId/generate', attendanceController.generateAttendanceReport);

/**
 * GET /api/attendance/reports/:employeeId
 * Get monthly attendance report
 * Query params: month, year
 */
router.get('/reports/:employeeId', attendanceController.getAttendanceReport);

/**
 * GET /api/attendance/reports/department/:departmentId
 * Get department-wide attendance report (HR/Manager/Admin only)
 * Query params: month, year
 */
router.get(
  '/reports/department/:departmentId',
  requireRole(['ADMIN', 'HR', 'MANAGER']),
  attendanceController.getDepartmentReport
);

// ============================================
// LEAVE INTEGRATION ROUTE
// ============================================

/**
 * POST /api/attendance/leave-integration
 * Integrate approved leave with attendance
 * (Internal route, typically called from leave approval)
 */
router.post('/leave-integration', requireRole(['ADMIN', 'HR']), attendanceController.integrateLeaveWithAttendance);

export default router;
