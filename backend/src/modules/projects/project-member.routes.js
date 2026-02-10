import express from 'express';
import {
  addProjectMemberController,
  listProjectMembersController,
  getProjectMemberController,
  updateProjectMemberController,
  removeProjectMemberController,
  checkMemberAvailabilityController,
  getEmployeeProjectsController,
  getProjectTeamCapacityController,
  bulkAddProjectMembersController,
} from './project-member.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// PROJECT MEMBER ROUTES
// ============================================

// POST /api/projects/:projectId/members - Add member to project
router.post(
  '/:projectId/members',
  requirePermission(['PROJECT_CREATE', 'PROJECT_MANAGE_TEAM']),
  addProjectMemberController
);

// POST /api/projects/:projectId/members/bulk - Bulk add members
router.post(
  '/:projectId/members/bulk',
  requirePermission(['PROJECT_CREATE', 'PROJECT_MANAGE_TEAM']),
  bulkAddProjectMembersController
);

// GET /api/projects/:projectId/members - List project members
router.get(
  '/:projectId/members',
  requirePermission(['PROJECT_VIEW', 'PROJECT_MANAGE_TEAM']),
  listProjectMembersController
);

// GET /api/projects/:projectId/members/capacity - Get team capacity
router.get(
  '/:projectId/members/capacity',
  requirePermission(['PROJECT_VIEW', 'PROJECT_MANAGE_TEAM']),
  getProjectTeamCapacityController
);

// GET /api/projects/members/:memberId - Get member details
router.get(
  '/members/:memberId',
  requirePermission(['PROJECT_VIEW', 'PROJECT_MANAGE_TEAM']),
  getProjectMemberController
);

// PUT /api/projects/members/:memberId - Update member
router.put(
  '/members/:memberId',
  requirePermission(['PROJECT_UPDATE', 'PROJECT_MANAGE_TEAM']),
  updateProjectMemberController
);

// DELETE /api/projects/members/:memberId - Remove member
router.delete(
  '/members/:memberId',
  requirePermission(['PROJECT_DELETE', 'PROJECT_MANAGE_TEAM']),
  removeProjectMemberController
);

// GET /api/projects/employees/:employeeId/availability - Check availability
router.get(
  '/employees/:employeeId/availability',
  requirePermission(['PROJECT_VIEW', 'PROJECT_MANAGE_TEAM']),
  checkMemberAvailabilityController
);

// GET /api/projects/employees/:employeeId/projects - Get employee's projects
router.get(
  '/employees/:employeeId/projects',
  requirePermission(['PROJECT_VIEW']),
  getEmployeeProjectsController
);

export default router;
