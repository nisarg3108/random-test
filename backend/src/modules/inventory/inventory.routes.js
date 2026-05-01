import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requireRole } from '../../core/auth/role.middleware.js';
import {
  createItemController,
  listItemsController,
  getItemController,
  updateItemController,
  deleteItemController,
} from './inventory.controller.js';
import { getWorkflowForAction } from '../../core/workflow/workflow.engine.js';

const router = Router();

// Debug endpoint to check workflow status
router.get('/debug/workflow', requireAuth, async (req, res) => {
  try {
    const workflows = await Promise.all([
      getWorkflowForAction(req.user.tenantId, 'INVENTORY', 'CREATE'),
      getWorkflowForAction(req.user.tenantId, 'INVENTORY', 'UPDATE'),
      getWorkflowForAction(req.user.tenantId, 'INVENTORY', 'DELETE')
    ]);
    
    res.json({
      tenantId: req.user.tenantId,
      workflows: {
        CREATE: workflows[0] ? { id: workflows[0].id, steps: workflows[0].steps?.length || 0 } : null,
        UPDATE: workflows[1] ? { id: workflows[1].id, steps: workflows[1].steps?.length || 0 } : null,
        DELETE: workflows[2] ? { id: workflows[2].id, steps: workflows[2].steps?.length || 0 } : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All authenticated users can submit create requests; controller handles workflow vs direct creation
router.post('/', requireAuth, createItemController);

// All users can view items
router.get('/', requireAuth, listItemsController);

// All users can view single item
router.get('/:id', requireAuth, getItemController);

// All authenticated users can submit update requests; controller handles workflow vs direct update
router.put('/:id', requireAuth, updateItemController);

// All authenticated users can submit delete requests; controller handles workflow vs direct delete
router.delete('/:id', requireAuth, deleteItemController);

export default router;
