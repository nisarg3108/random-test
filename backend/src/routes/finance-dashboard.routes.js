import express from 'express';
import prisma from '../config/db.js';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requirePermission } from '../core/rbac/permission.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', requirePermission('finance.dashboard'), async (req, res) => {
  try {
    const { tenantId } = req.user;

    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses
    ] = await Promise.all([
      prisma.expenseClaim.count({ where: { tenantId } }),
      prisma.expenseClaim.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.expenseClaim.count({ where: { tenantId, status: 'APPROVED' } })
    ]);

    res.json({
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Finance dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch finance dashboard' });
  }
});

export default router;