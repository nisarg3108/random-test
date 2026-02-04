import express from 'express';
import branchController from './branch.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { checkPermission } from '../../middlewares/permissions.js';

const router = express.Router();

// Branch CRUD
router.post('/', 
  authenticate, 
  checkPermission('company.create'),
  branchController.create
);

router.get('/', 
  authenticate, 
  checkPermission('company.read'),
  branchController.getAll
);

router.get('/main', 
  authenticate, 
  checkPermission('company.read'),
  branchController.getMain
);

router.get('/:id', 
  authenticate, 
  checkPermission('company.read'),
  branchController.getById
);

router.get('/code/:code', 
  authenticate, 
  checkPermission('company.read'),
  branchController.getByCode
);

router.put('/:id', 
  authenticate, 
  checkPermission('company.update'),
  branchController.update
);

router.delete('/:id', 
  authenticate, 
  checkPermission('company.delete'),
  branchController.delete
);

// Branch actions
router.post('/:id/set-main', 
  authenticate, 
  checkPermission('company.update'),
  branchController.setAsMain
);

router.get('/:id/statistics', 
  authenticate, 
  checkPermission('company.read'),
  branchController.getStatistics
);

// Inter-branch transfer
router.post('/transfer', 
  authenticate, 
  checkPermission('inventory.create'),
  branchController.transferBetweenBranches
);

export default router;
