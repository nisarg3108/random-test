import express from 'express';
import { RBACController } from './rbac.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission, requireRole } from './permission.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/roles', RBACController.getRoles);
router.post('/roles', requireRole('ADMIN'), RBACController.createRole);
router.put('/roles/:id', requireRole('ADMIN'), RBACController.updateRole);
router.delete('/roles/:id', requireRole('ADMIN'), RBACController.deleteRole);

router.get('/permissions', requireRole(['ADMIN', 'HR_MANAGER']), RBACController.getPermissions);

router.get('/users/:userId/permissions', RBACController.getUserPermissions);
router.get('/my-permissions', RBACController.getUserPermissions);

router.get('/users', requireRole(['ADMIN', 'HR_MANAGER']), RBACController.getUsersWithRoles);

router.post('/assign-role', requireRole('ADMIN'), RBACController.assignRole);
router.post('/remove-role', requireRole('ADMIN'), RBACController.removeRole);

router.post('/initialize', requireRole('ADMIN'), RBACController.initializeRoles);

export default router;
