import express from 'express';
import {
  getOrCreateTimesheetController,
  createTimesheetController,
  getTimesheetByIdController,
  listTimesheetsController,
  updateTimesheetController,
  submitTimesheetController,
  approveTimesheetController,
  rejectTimesheetController,
  getMyTimesheetsController,
  getPendingApprovalsController,
  deleteTimesheetController,
  getTimesheetSummaryController,
  getCurrentUserTimesheetsController,
  getCurrentUserTimesheetSummaryController,
} from './timesheet.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// TIMESHEET ROUTES
// ============================================

// GET /api/timesheets/get-or-create - Get or create timesheet for week
router.get(
  '/get-or-create',
  requirePermission(['TIMESHEET_VIEW', 'TIMESHEET_CREATE']),
  getOrCreateTimesheetController
);

// POST /api/timesheets - Create new timesheet
router.post(
  '/',
  requirePermission(['TIMESHEET_CREATE']),
  createTimesheetController
);

// GET /api/timesheets - List timesheets with filters
router.get(
  '/',
  requirePermission(['TIMESHEET_VIEW', 'TIMESHEET_APPROVE']),
  listTimesheetsController
);

// GET /api/timesheets/summary - Get timesheet summary
router.get(
  '/summary',
  requirePermission(['TIMESHEET_VIEW', 'TIMESHEET_APPROVE']),
  getTimesheetSummaryController
);

// GET /api/timesheets/pending-approvals - Get pending approvals
router.get(
  '/pending-approvals',
  requirePermission(['TIMESHEET_APPROVE']),
  getPendingApprovalsController
);

// GET /api/timesheets/my/summary - Get current user's timesheet summary
router.get(
  '/my/summary',
  requirePermission(['TIMESHEET_VIEW']),
  getCurrentUserTimesheetSummaryController
);

// GET /api/timesheets/my - Get current user's timesheets
router.get(
  '/my',
  requirePermission(['TIMESHEET_VIEW']),
  getCurrentUserTimesheetsController
);

// GET /api/timesheets/employees/:employeeId - Get employee's timesheets
router.get(
  '/employees/:employeeId',
  requirePermission(['TIMESHEET_VIEW']),
  getMyTimesheetsController
);

// GET /api/timesheets/:id - Get timesheet by ID
router.get(
  '/:id',
  requirePermission(['TIMESHEET_VIEW']),
  getTimesheetByIdController
);

// PUT /api/timesheets/:id - Update timesheet
router.put(
  '/:id',
  requirePermission(['TIMESHEET_UPDATE']),
  updateTimesheetController
);

// POST /api/timesheets/:id/submit - Submit timesheet for approval
router.post(
  '/:id/submit',
  requirePermission(['TIMESHEET_SUBMIT']),
  submitTimesheetController
);

// POST /api/timesheets/:id/approve - Approve timesheet
router.post(
  '/:id/approve',
  requirePermission(['TIMESHEET_APPROVE']),
  approveTimesheetController
);

// POST /api/timesheets/:id/reject - Reject timesheet
router.post(
  '/:id/reject',
  requirePermission(['TIMESHEET_APPROVE']),
  rejectTimesheetController
);

// DELETE /api/timesheets/:id - Delete timesheet (only DRAFT)
router.delete(
  '/:id',
  requirePermission(['TIMESHEET_DELETE']),
  deleteTimesheetController
);

export default router;
