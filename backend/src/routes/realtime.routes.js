import express from 'express';
import { requireAuth } from '../core/auth/auth.middleware.js';
import { realTimeServer } from '../core/realtime.js';

const router = express.Router();

// Apply authentication to all real-time routes
router.use(requireAuth);

// Test endpoint to broadcast dashboard stats update
router.post('/test/dashboard-stats', async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    const testStats = {
      totalUsers: Math.floor(Math.random() * 1000),
      activeSessions: Math.floor(Math.random() * 100),
      inventoryCount: Math.floor(Math.random() * 500),
      revenue: Math.floor(Math.random() * 100000),
      usersTrend: (Math.random() * 20 - 10).toFixed(1),
      sessionsTrend: (Math.random() * 20 - 10).toFixed(1),
      inventoryTrend: (Math.random() * 15 - 5).toFixed(1),
      revenueTrend: (Math.random() * 25 - 10).toFixed(1),
      lastUpdated: new Date().toISOString()
    };

    realTimeServer.broadcastDashboardStats(tenantId, testStats);
    
    res.json({ 
      message: 'Dashboard stats broadcasted successfully',
      stats: testStats 
    });
  } catch (error) {
    console.error('Real-time test error:', error);
    res.status(500).json({ message: 'Failed to broadcast test data' });
  }
});

// Test endpoint to broadcast activity update
router.post('/test/activity', async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    
    const testActivity = {
      id: Date.now().toString(),
      description: `Test activity from user ${userId}`,
      timestamp: new Date().toISOString(),
      action: 'TEST',
      resource: 'REALTIME',
      user: { firstName: 'Test', lastName: 'User' }
    };

    realTimeServer.broadcastActivity(tenantId, testActivity);
    
    res.json({ 
      message: 'Activity broadcasted successfully',
      activity: testActivity 
    });
  } catch (error) {
    console.error('Real-time activity test error:', error);
    res.status(500).json({ message: 'Failed to broadcast test activity' });
  }
});

export default router;