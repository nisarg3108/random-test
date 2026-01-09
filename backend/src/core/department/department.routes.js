import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../auth/role.middleware.js';
import {
  createDepartmentController,
  listDepartmentsController,
} from './department.controller.js';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  createDepartmentController
);

router.get(
  '/',
  requireAuth,
  listDepartmentsController
);

export default router;
