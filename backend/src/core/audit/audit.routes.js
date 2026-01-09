import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { requireRole } from '../auth/role.middleware.js';
import prisma from '../../config/db.js';
import { logAudit } from './audit.service.js';

const router = Router();

// Test route to create audit log
router.post('/test', requireAuth, async (req, res) => {
  try {
    console.log('Test audit route called with user:', req.user);
    const testLog = await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'TEST',
      entity: 'SYSTEM',
      entityId: 'test-123',
      meta: { test: true }
    });
    console.log('Test audit log created:', testLog);
    res.json({ success: true, log: testLog });
  } catch (error) {
    console.error('Test audit error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get(
  '/',
  requireAuth,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      console.log('Fetching audit logs for tenant:', req.user.tenantId);
      const { action, entity, startDate, endDate, userId } = req.query;
      
      // Build where clause for filtering
      const where = {
        tenantId: req.user.tenantId,
        ...(action && { action }),
        ...(entity && { entity }),
        ...(userId && { userId }),
        ...(startDate && endDate && {
          timestamp: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      };

      console.log('Audit logs where clause:', where);

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100, // Limit to last 100 logs
        select: {
          id: true,
          userId: true,
          action: true,
          entity: true,
          entityId: true,
          meta: true,
          timestamp: true
        }
      });

      console.log('Found audit logs:', logs.length);

      // Enhance logs with user information
      const enhancedLogs = await Promise.all(
        logs.map(async (log) => {
          let userInfo = null;
          if (log.userId) {
            try {
              const user = await prisma.user.findUnique({
                where: { id: log.userId },
                select: { email: true, role: true }
              });
              userInfo = user;
            } catch (error) {
              console.error('Error fetching user info for audit log:', error);
            }
          }

          return {
            ...log,
            userInfo,
            description: log.meta?.details?.description || `${log.action} ${log.entity}`,
            changes: log.meta?.changes || null,
            ipAddress: log.meta?.ipAddress || null
          };
        })
      );

      console.log('Returning enhanced logs:', enhancedLogs.length);
      res.json({ data: enhancedLogs, total: enhancedLogs.length });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

export default router;
