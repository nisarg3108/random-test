import express from 'express';
import {
  createDocumentController,
  listDocumentsController,
  getDocumentController,
  updateDocumentController,
  deleteDocumentController,
  restoreDocumentController,
  getDocumentStatisticsController,
  uploadDocumentController,
  uploadMiddleware,
  downloadDocumentController,
  createDocumentVersionController,
  getDocumentVersionsController,
  revertToVersionController,
  downloadVersionController,
  createFolderController,
  listFoldersController,
  getFolderController,
  updateFolderController,
  deleteFolderController,
  createDocumentShareController,
  listDocumentSharesController,
  revokeDocumentShareController,
  setDocumentPermissionsController,
  setFolderPermissionsController,
  createDocumentTemplateController,
  listDocumentTemplatesController,
  generateFromTemplateController,
  getDocumentActivitiesController
} from './document.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';

const router = express.Router();

// ==================== SPECIFIC ROUTES (MUST BE BEFORE PARAMETERIZED ROUTES) ====================

// Statistics
router.get('/statistics', authenticate, getDocumentStatisticsController);

// File Upload
router.post('/upload', authenticate, uploadMiddleware, uploadDocumentController);

// ==================== FOLDER ROUTES ====================

router.post('/folders', authenticate, createFolderController);
router.get('/folders', authenticate, listFoldersController);
router.get('/folders/:id', authenticate, getFolderController);
router.put('/folders/:id', authenticate, updateFolderController);
router.delete('/folders/:id', authenticate, deleteFolderController);
router.post('/folders/:id/permissions', authenticate, setFolderPermissionsController);

// ==================== TEMPLATE ROUTES ====================

router.post('/templates', authenticate, uploadMiddleware, createDocumentTemplateController);
router.get('/templates', authenticate, listDocumentTemplatesController);
router.post('/templates/:id/generate', authenticate, generateFromTemplateController);

// ==================== SHARING ROUTES ====================

router.delete('/shares/:shareId', authenticate, revokeDocumentShareController);

// ==================== DOCUMENT ROUTES ====================

// Document CRUD
router.post('/', authenticate, createDocumentController);
router.get('/', authenticate, listDocumentsController);
router.get('/:id', authenticate, getDocumentController);
router.put('/:id', authenticate, updateDocumentController);
router.delete('/:id', authenticate, deleteDocumentController);
router.post('/:id/restore', authenticate, restoreDocumentController);

// File Download
router.get('/:id/download', authenticate, downloadDocumentController);

// Version Control
router.post('/:id/versions', authenticate, uploadMiddleware, createDocumentVersionController);
router.get('/:id/versions', authenticate, getDocumentVersionsController);
router.post('/:id/versions/:versionNumber/revert', authenticate, revertToVersionController);
router.get('/:id/versions/:versionNumber/download', authenticate, downloadVersionController);

// Activity Log
router.get('/:id/activities', authenticate, getDocumentActivitiesController);

// Sharing
router.post('/:id/shares', authenticate, createDocumentShareController);
router.get('/:id/shares', authenticate, listDocumentSharesController);

// Permissions
router.post('/:id/permissions', authenticate, setDocumentPermissionsController);

export default router;
