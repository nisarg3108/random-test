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
import { seedInventoryWorkflows } from './workflow.seed.js';

const router = Router();

/**
 * GET /api/approvals/debug - Debug approval system status
 */
router.get('/debug',
  requireAuth,
  async (req, res, next) => {
    try {
      const { tenantId, userId } = req.user;
      
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, role: true }
      });
      
      // Get workflows
      const workflows = await prisma.workflow.findMany({
        where: { tenantId },
        include: { steps: true }
      });
      
      // Get pending approvals
      const pendingApprovals = await prisma.approval.findMany({
        where: {
          tenantId,
          status: 'PENDING'
        },
        include: {
          workflow: true,
          workflowStep: true
        }
      });
      
      // Get workflow requests
      const workflowRequests = await prisma.workflowRequest.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      res.json({
        user: {
          id: userId,
          email: user?.email,
          role: user?.role,
          canApprove: ['ADMIN', 'MANAGER'].includes(user?.role)
        },
        workflows: workflows.map(w => ({
          id: w.id,
          module: w.module,
          action: w.action,
          status: w.status,
          stepsCount: w.steps?.length || 0
        })),
        pendingApprovals: pendingApprovals.length,
        recentRequests: workflowRequests.length
      });
    } catch (error) {
      console.error('Error in debug endpoint:', error);
      next(error);
    }
  }
);

/**
 * POST /api/approvals/seed-workflows - Seed workflows for tenant
 */
router.post('/seed-workflows',
  requireAuth,
  async (req, res, next) => {
    try {
      const { tenantId } = req.user;
      
      // Check if workflows already exist
      const existingWorkflows = await prisma.workflow.findMany({
        where: {
          tenantId,
          module: 'INVENTORY'
        }
      });
      
      if (existingWorkflows.length > 0) {
        return res.json({ 
          message: 'Workflows already exist',
          workflows: existingWorkflows.map(w => ({ id: w.id, action: w.action }))
        });
      }
      
      // Create workflows
      const workflows = await seedInventoryWorkflows(tenantId);
      
      res.json({ 
        message: 'Workflows seeded successfully',
        workflows: workflows.map(w => ({ id: w.id, action: w.action }))
      });
    } catch (error) {
      console.error('Error seeding workflows:', error);
      next(error);
    }
  }
);

/**
 * POST /api/approvals/create-test-workflow - Create test workflow and approval
 */
router.post('/create-test-workflow',
  requireAuth,
  async (req, res, next) => {
    try {
      const { tenantId, userId } = req.user;
      
      // First ensure workflows exist
      let workflow = await prisma.workflow.findFirst({
        where: {
          tenantId,
          module: 'INVENTORY',
          action: 'CREATE'
        },
        include: { steps: true }
      });
      
      if (!workflow) {
        // Create workflow if it doesn't exist
        workflow = await prisma.workflow.create({
          data: {
            tenantId,
            module: 'INVENTORY',
            action: 'CREATE',
            status: 'ACTIVE',
            steps: {
              create: [
                {
                  stepOrder: 1,
                  permission: 'inventory.approve'
                }
              ]
            }
          },
          include: { steps: true }
        });
      }

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
            sku: `TEST-APPROVAL-${Date.now()}`,
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
          workflowStepId: workflow.steps[0].id,
          stepOrder: 1,
          permission: 'inventory.approve',
          tenantId,
          status: 'PENDING',
          data: {
            action: 'CREATE',
            data: request.payload
          }
        }
      });

      res.json({ 
        message: 'Test workflow created successfully',
        workflow: { id: workflow.id },
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