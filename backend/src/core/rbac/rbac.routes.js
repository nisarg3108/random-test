import express from 'express';
import { RBACController } from './rbac.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission, requireRole } from './permission.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get all roles (available to all authenticated users)
router.get('/roles', RBACController.getRoles);

// Get all permissions (admin only)
router.get('/permissions', requireRole(['ADMIN', 'HR_MANAGER']), RBACController.getPermissions);

// Get user permissions
router.get('/users/:userId/permissions', RBACController.getUserPermissions);
router.get('/my-permissions', RBACController.getUserPermissions);

// Get all users with their roles (admin/HR only)
router.get('/users', requireRole(['ADMIN', 'HR_MANAGER']), RBACController.getUsersWithRoles);

// Assign role to user (admin only)
router.post('/assign-role', requireRole('ADMIN'), RBACController.assignRole);

// Remove role from user (admin only)
router.post('/remove-role', requireRole('ADMIN'), RBACController.removeRole);

// Initialize roles for tenant (admin only)
router.post('/initialize', requireRole('ADMIN'), RBACController.initializeRoles);

export default router;
