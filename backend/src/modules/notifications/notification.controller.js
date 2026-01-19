import notificationService from './notification.service.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class NotificationController {
  async getNotifications(req, res) {
    try {
      const { tenantId } = req.user;
      
      // Get employee record for the user
      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee record not found' });
      }

      const notifications = await notificationService.getUserNotifications(employee.id, tenantId);
      const unreadCount = await notificationService.getUnreadCount(employee.id, tenantId);

      res.json({
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          createdAt: n.createdAt,
          time: this.formatTime(n.createdAt)
        })),
        unreadCount
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const { tenantId } = req.user;

      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee record not found' });
      }

      await notificationService.markAsRead(id, employee.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const { tenantId } = req.user;

      const employee = await prisma.employee.findUnique({
        where: { userId: req.user.id }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee record not found' });
      }

      await notificationService.markAllAsRead(employee.id, tenantId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }

  formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

export default new NotificationController();