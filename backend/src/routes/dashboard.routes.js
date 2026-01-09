import express from 'express';
import prisma from '../config/db.js';
import { realTimeServer } from '../core/realtime.js';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { requireRole } from '../core/auth/role.middleware.js';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(requireAuth);

// Get real-time dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    // Get current stats from database
    const [
      totalUsers,
      activeSessions,
      inventoryCount,
      recentActivities
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ 
        where: { 
          tenantId,
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.inventoryItem.count({ where: { tenantId } }),
      prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate trends (compare with previous period)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [
      yesterdayUsers,
      yesterdayActivities
    ] = await Promise.all([
      prisma.user.count({
        where: {
          tenantId,
          createdAt: { gte: twoDaysAgo, lt: yesterday }
        }
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: twoDaysAgo, lt: yesterday }
        }
      })
    ]);

    const stats = {
      totalUsers,
      activeSessions,
      inventoryCount,
      revenue: Math.floor(Math.random() * 100000), // Mock revenue data
      usersTrend: yesterdayUsers > 0 ? ((totalUsers - yesterdayUsers) / yesterdayUsers * 100).toFixed(1) : 0,
      sessionsTrend: Math.floor(Math.random() * 20) - 10, // Mock trend
      inventoryTrend: Math.floor(Math.random() * 15) - 5, // Mock trend
      revenueTrend: Math.floor(Math.random() * 25) - 10, // Mock trend
      lastUpdated: new Date().toISOString()
    };

    // Broadcast to WebSocket clients
    realTimeServer.broadcastDashboardStats(tenantId, stats);

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
});

// Get real-time activities
router.get('/activities', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const limit = parseInt(req.query.limit) || 20;

    const activities = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      description: `${activity.user?.firstName || 'System'} ${activity.action} ${activity.resource}`,
      timestamp: activity.createdAt,
      action: activity.action,
      resource: activity.resource,
      user: activity.user
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
});

// Get user-specific dashboard
router.get('/user', async (req, res) => {
  try {
    const { userId, tenantId } = req.user;

    const [
      userStats,
      recentTasks,
      notifications
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: { select: { name: true } },
          lastLoginAt: true,
          createdAt: true
        }
      }),
      prisma.auditLog.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      [] // Mock notifications
    ]);

    const dashboardData = {
      user: userStats,
      recentTasks,
      notifications,
      quickStats: {
        tasksCompleted: await prisma.auditLog.count({
          where: {
            userId,
            tenantId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      },
      lastUpdated: new Date().toISOString()
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('User dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch user dashboard' });
  }
});

// Get manager dashboard
router.get('/manager', async (req, res) => {
  try {
    const { tenantId } = req.user;

    const [
      departmentStats,
      teamMembers,
      pendingApprovals
    ] = await Promise.all([
      prisma.department.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.auditLog.count({
        where: {
          tenantId,
          action: 'PENDING_APPROVAL',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const dashboardData = {
      departmentStats,
      teamMembers,
      pendingApprovals,
      performance: {
        efficiency: Math.floor(Math.random() * 30) + 70, // Mock data
        productivity: Math.floor(Math.random() * 25) + 75
      },
      lastUpdated: new Date().toISOString()
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch manager dashboard' });
  }
});

// Get admin dashboard
router.get('/admin', async (req, res) => {
  try {
    const { tenantId } = req.user;

    const [
      systemHealth,
      totalUsers,
      totalDepartments,
      systemLogs
    ] = await Promise.all([
      { status: 'healthy', uptime: process.uptime() }, // Mock system health
      prisma.user.count({ where: { tenantId } }),
      prisma.department.count({ where: { tenantId } }),
      prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const dashboardData = {
      systemHealth,
      totalUsers,
      totalDepartments,
      systemLogs,
      resources: {
        memoryUsage: Math.floor(Math.random() * 40) + 30, // Mock data
        cpuUsage: Math.floor(Math.random() * 50) + 20,
        diskUsage: Math.floor(Math.random() * 60) + 20
      },
      lastUpdated: new Date().toISOString()
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch admin dashboard' });
  }
});

export default router;