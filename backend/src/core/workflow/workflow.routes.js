import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requirePermission } from '../rbac/permission.middleware.js';
import prisma from '../../config/db.js';

const router = Router();

/**
 * APPROVE WORKFLOW STEP
 */
router.post(
  '/approve',
  requireAuth,
  requirePermission('inventory.approve'),
  async (req, res, next) => {
    try {
      const { approvalId } = req.body;

      if (!approvalId) {
        return res.status(400).json({ message: 'approvalId required' });
      }

      // 1️⃣ Find approval
      const approval = await prisma.approval.findUnique({
        where: { id: approvalId },
      });

      if (!approval) {
        return res.status(404).json({ message: 'Approval not found' });
      }

      if (approval.status !== 'PENDING') {
        return res.status(400).json({ message: 'Already processed' });
      }

      // 2️⃣ Approve it
      const updated = await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: 'APPROVED',
          approvedBy: req.user.userId,
        },
      });

      return res.json({
        message: 'Approved successfully',
        approval: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
