import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../auth/role.middleware.js';
import prisma from '../../config/db.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { timestamp: 'desc' },
      select: {
        action: true,
        entity: true,
        meta: true,
        timestamp: true
      }
    });
    res.json(logs);
  }
);

export default router;
