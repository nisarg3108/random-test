import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission } from '../auth/role.middleware.js';
import {
  getPendingApprovalsController,
  approveController,
  rejectController,
} from './approval.controller.js';
import prisma from '../../config/db.js';
import { createItem } from '../../modules/inventory/inventory.service.js';

const router = Router();

/**
 * GET /api/approvals - Get pending approvals
 */
router.get('/', 
  requireAuth,
  requirePermission('inventory.approve'),
  getPendingApprovalsController
);

/**
 * POST /api/approvals/:approvalId/approve - Approve request
 */
router.post('/:approvalId/approve',
  requireAuth,
  requirePermission('inventory.approve'),
  approveController,
  async (req, res, next) => {
    try {
      const approval = await prisma.approval.findUnique({ where: { id: req.params.approvalId } });
      
      const pending = await prisma.approval.findMany({
        where: { workflowId: approval.workflowId, status: 'PENDING' },
      });

      if (pending.length === 0) {
        const request = await prisma.workflowRequest.findFirst({
          where: { workflowId: approval.workflowId, status: 'PENDING' },
        });

        if (request) {
          await createItem(request.payload, request.tenantId);
          await prisma.workflowRequest.update({
            where: { id: request.id },
            data: { status: 'COMPLETED' },
          });
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/approvals/:approvalId/reject - Reject request
 */
router.post('/:approvalId/reject',
  requireAuth,
  requirePermission('inventory.approve'),
  rejectController
);

export default router;