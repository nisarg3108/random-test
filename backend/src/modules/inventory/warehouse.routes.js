import express from 'express';
import warehouseController from './warehouse.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { checkPermission } from '../../middlewares/permissions.js';

const router = express.Router();

// Warehouse CRUD
router.post('/', 
  requireAuth, 
  checkPermission('inventory.create'),
  warehouseController.create
);

router.get('/', 
  requireAuth, 
  checkPermission('inventory.read'),
  warehouseController.getAll
);

router.get('/:id', 
  requireAuth, 
  checkPermission('inventory.read'),
  warehouseController.getById
);

router.put('/:id', 
  requireAuth, 
  checkPermission('inventory.update'),
  warehouseController.update
);

router.delete('/:id', 
  requireAuth, 
  checkPermission('inventory.delete'),
  warehouseController.delete
);

// Warehouse statistics
router.get('/:id/statistics', 
  requireAuth, 
  checkPermission('inventory.read'),
  warehouseController.getStatistics
);

// Warehouse stock management
router.get('/:id/stock', 
  requireAuth, 
  checkPermission('inventory.read'),
  warehouseController.getStock
);

router.put('/:warehouseId/stock/:itemId', 
  requireAuth, 
  checkPermission('inventory.update'),
  warehouseController.updateStock
);

// Stock transfers
router.post('/transfer', 
  requireAuth, 
  checkPermission('inventory.create'),
  warehouseController.transferStock
);

router.post('/transfer/:id/complete', 
  requireAuth, 
  checkPermission('inventory.approve'),
  warehouseController.completeTransfer
);

export default router;
