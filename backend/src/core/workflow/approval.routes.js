import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission } from '../auth/role.middleware.js';
import {
  getPendingApprovalsController,
  getMyRequestsController,
  approveController,
  rejectController,
} from './approval.controller.js';
import prisma from '../../config/db.js';
import { createItem } from '../../modules/inventory/inventory.service.js';
import { seedTestApprovalData } from './test-data.js';

const router = Router();

/**
 * POST /api/approvals/create-test-workflow - Create test workflow and approval
 */
router.post('/create-test-workflow',
  requireAuth,
  async (req, res, next) => {
    try {
      const { tenantId, userId } = req.user;
      
      // Create a test workflow
      const workflow = await prisma.workflow.create({
        data: {
          tenantId,
          module: 'INVENTORY',
          action: 'CREATE',
          status: 'ACTIVE'
        }
      });

      // Create workflow step
      const step = await prisma.workflowStep.create({
        data: {
          workflowId: workflow.id,
          stepOrder: 1,
          permission: 'inventory.approve'
        }
      });

      // Create workflow request
      const request = await prisma.workflowRequest.create({
        data: {
          tenantId,
          workflowId: workflow.id,
          module: 'INVENTORY',
          action: 'CREATE',
          status: 'PENDING',
          createdBy: userId,
          payload: {
            name: 'Test Item from Approval',
            sku: 'TEST-APPROVAL-001',
            price: 99.99,
            quantity: 10,
            description: 'Test item created through approval workflow'
          }
        }
      });

      // Create approval
      const approval = await prisma.approval.create({
        data: {
          workflowId: workflow.id,
          workflowStepId: step.id,
          stepOrder: 1,
          permission: 'inventory.approve',
          tenantId,
          status: 'PENDING',
          data: {
            action: 'CREATE',
            itemData: request.payload
          }
        }
      });

      res.json({ 
        message: 'Test workflow created successfully',
        workflow: { id: workflow.id },
        step: { id: step.id },
        request: { id: request.id },
        approval: { id: approval.id }
      });
    } catch (error) {
      console.error('Error creating test workflow:', error);
      next(error);
    }
  }
);

/**
 * GET /api/approvals - Get pending approvals
 */
router.get('/', 
  requireAuth,
  // requirePermission('inventory.approve'), // Temporarily disabled
  getPendingApprovalsController
);

/**
 * GET /api/approvals/my-requests - Get user's own requests
 */
router.get('/my-requests',
  requireAuth,
  getMyRequestsController
);

/**
 * POST /api/approvals/:approvalId/approve - Approve request
 */
router.post('/:approvalId/approve',
  requireAuth,
  // requirePermission('inventory.approve'), // Temporarily disabled
  approveController
);

/**
 * POST /api/approvals/:approvalId/reject - Reject request
 */
router.post('/:approvalId/reject',
  requireAuth,
  // requirePermission('inventory.approve'), // Temporarily disabled
  rejectController
);

export default router;