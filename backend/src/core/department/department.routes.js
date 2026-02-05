import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission } from '../rbac/permission.middleware.js';
import {
  createDepartmentController,
  listDepartmentsController,
} from './department.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requirePermission('department.create'),
  createDepartmentController
);

router.get(
  '/',
  requireAuth,
  requirePermission('department.view'),
  listDepartmentsController
);

export default router;

