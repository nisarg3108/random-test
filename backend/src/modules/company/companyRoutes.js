import express from 'express';
const router = express.Router();
import {
  getWorkflowTemplates,
  setupCompanyConfig,
  updateCompanyConfig,
  getCompanyConfig,
  createApprovalMatrix,
  addCustomField
} from './companyConfigController.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';

// Get workflow templates
router.get('/workflow-templates', getWorkflowTemplates);

// Company configuration routes
router.post('/setup', requireAuth, setupCompanyConfig);
router.put('/config', requireAuth, updateCompanyConfig);
router.get('/config', requireAuth, getCompanyConfig);

// Approval matrix
router.post('/approval-matrix', requireAuth, createApprovalMatrix);

// Custom fields
router.post('/custom-fields', requireAuth, addCustomField);

export default router;