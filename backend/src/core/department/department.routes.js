import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission } from '../rbac/permission.middleware.js';
import {
  createDepartmentController,
  listDepartmentsController,
  updateDepartmentController,
  deleteDepartmentController,
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

router.put(
  '/:id',
  requireAuth,
  requirePermission('department.update'),
  updateDepartmentController
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission('department.delete'),
  deleteDepartmentController
);

export default router;

