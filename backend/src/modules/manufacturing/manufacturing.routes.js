import express from 'express';
import manufacturingController from './manufacturing.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkPermission } from '../../middlewares/permissions.js';

const router = express.Router();

// ============ BOM Routes ============

// BOM CRUD
router.post('/bom', 
  authenticate, 
  checkPermission('manufacturing.create'),
  manufacturingController.createBOM
);

router.get('/bom', 
  authenticate, 
  checkPermission('manufacturing.read'),
  manufacturingController.getAllBOMs
);

router.get('/bom/:id', 
  authenticate, 
  checkPermission('manufacturing.read'),
  manufacturingController.getBOMById
);

router.get('/bom/product/:productId', 
  authenticate, 
  checkPermission('manufacturing.read'),
  manufacturingController.getDefaultBOM
);

router.put('/bom/:id', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.updateBOM
);

// BOM Actions
router.post('/bom/:id/set-default', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.setAsDefault
);

router.post('/bom/:id/activate', 
  authenticate, 
  checkPermission('manufacturing.approve'),
  manufacturingController.activateBOM
);

router.post('/bom/:id/archive', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.archiveBOM
);

router.post('/bom/:id/clone', 
  authenticate, 
  checkPermission('manufacturing.create'),
  manufacturingController.cloneBOM
);

router.delete('/bom/:id', 
  authenticate, 
  checkPermission('manufacturing.delete'),
  manufacturingController.deleteBOM
);

// ============ Work Order Routes ============

// Work Order CRUD
router.post('/work-orders', 
  authenticate, 
  checkPermission('manufacturing.create'),
  manufacturingController.createWorkOrder
);

router.get('/work-orders', 
  authenticate, 
  checkPermission('manufacturing.read'),
  manufacturingController.getAllWorkOrders
);

router.get('/work-orders/dashboard', 
  authenticate, 
  checkPermission('manufacturing.read'),
  manufacturingController.getWorkOrderDashboard
);

router.get('/work-orders/statistics', 
  authenticate, 
  checkPermission('manufacturing.read'),
  manufacturingController.getWorkOrderStatistics
);

router.get('/work-orders/:id', 
  authenticate, 
  checkPermission('manufacturing.read'),
  manufacturingController.getWorkOrderById
);

router.put('/work-orders/:id', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.updateWorkOrder
);

// Work Order Status Changes
router.post('/work-orders/:id/plan', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.planWorkOrder
);

router.post('/work-orders/:id/start', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.startWorkOrder
);

router.post('/work-orders/:id/complete', 
  authenticate, 
  checkPermission('manufacturing.approve'),
  manufacturingController.completeWorkOrder
);

router.post('/work-orders/:id/cancel', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.cancelWorkOrder
);

// ============ Operations Routes ============

router.post('/work-orders/:workOrderId/operations', 
  authenticate, 
  checkPermission('manufacturing.create'),
  manufacturingController.addOperation
);

router.put('/operations/:operationId', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.updateOperation
);

router.post('/operations/:operationId/start', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.startOperation
);

router.post('/operations/:operationId/complete', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.completeOperation
);

// ============ Materials Routes ============

router.post('/work-orders/:workOrderId/materials', 
  authenticate, 
  checkPermission('manufacturing.create'),
  manufacturingController.addMaterialRequirement
);

router.post('/materials/:materialId/issue', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.issueMaterial
);

router.post('/materials/:materialId/consume', 
  authenticate, 
  checkPermission('manufacturing.update'),
  manufacturingController.consumeMaterial
);

export default router;
