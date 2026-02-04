import express from 'express';
import stockMovementController from './stock-movement.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkPermission } from '../../middlewares/permissions.js';

const router = express.Router();

// Stock movement CRUD
router.post('/', 
  authenticate, 
  checkPermission('inventory.create'),
  stockMovementController.create
);

router.get('/', 
  authenticate, 
  checkPermission('inventory.read'),
  stockMovementController.getAll
);

router.get('/statistics', 
  authenticate, 
  checkPermission('inventory.read'),
  stockMovementController.getStatistics
);

router.get('/:id', 
  authenticate, 
  checkPermission('inventory.read'),
  stockMovementController.getById
);

router.put('/:id', 
  authenticate, 
  checkPermission('inventory.update'),
  stockMovementController.update
);

// Stock movement actions
router.post('/:id/approve', 
  authenticate, 
  checkPermission('inventory.approve'),
  stockMovementController.approve
);

router.post('/:id/cancel', 
  authenticate, 
  checkPermission('inventory.update'),
  stockMovementController.cancel
);

export default router;
