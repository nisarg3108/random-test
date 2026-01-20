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
      meta: { 
        test: true,
        details: {
          description: 'Test audit log created via API'
        },
        changes: {
          before: null,
          after: { testField: 'testValue' }
        }
      }
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
      const { action, entity, startDate, endDate, userId, page = 1, limit = 100 } = req.query;
      
      // Build where clause for filtering
      const where = {
        tenantId: req.user.tenantId
      };

      // Add filters only if they have values
      if (action && action.trim()) {
        where.action = action.trim();
      }
      
      if (entity && entity.trim()) {
        where.entity = entity.trim();
      }
      
      if (userId && userId.trim()) {
        where.userId = userId.trim();
      }
      
      // Date range filtering
      if (startDate || endDate) {
        where.timestamp = {};
        
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0); // Start of day
          where.timestamp.gte = start;
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // End of day
          where.timestamp.lte = end;
        }
      }

      console.log('Audit logs where clause:', JSON.stringify(where, null, 2));

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Get total count for pagination
      const total = await prisma.auditLog.count({ where });

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
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

      console.log(`Found ${logs.length} audit logs out of ${total} total`);

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
      res.json({ 
        data: enhancedLogs, 
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

// Get individual audit log
router.get(
  '/:id',
  requireAuth,
  requireRole(['ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const log = await prisma.auditLog.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId
        },
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

      if (!log) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      // Enhance log with user information
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

      const enhancedLog = {
        ...log,
        userInfo,
        description: log.meta?.details?.description || `${log.action} ${log.entity}`,
        changes: log.meta?.changes || null,
        ipAddress: log.meta?.ipAddress || null
      };

      res.json({ data: enhancedLog });
    } catch (error) {
      console.error('Error fetching audit log:', error);
      res.status(500).json({ error: 'Failed to fetch audit log' });
    }
  }
);

export default router;
