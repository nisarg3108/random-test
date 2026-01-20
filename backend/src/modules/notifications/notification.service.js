import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class NotificationService {
  async createNotification(data) {
    return await prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false
      }
    });
  }

  async getUserNotifications(employeeId, tenantId) {
    return await prisma.notification.findMany({
      where: {
        employeeId,
        tenantId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
  }

  async markAsRead(notificationId, employeeId) {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        employeeId
      },
      data: {
        isRead: true
      }
    });
  }

  async markAllAsRead(employeeId, tenantId) {
    return await prisma.notification.updateMany({
      where: {
        employeeId,
        tenantId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  async getUnreadCount(employeeId, tenantId) {
    return await prisma.notification.count({
      where: {
        employeeId,
        tenantId,
        isRead: false
      }
    });
  }

  // Helper methods for creating specific notification types
  async createTaskNotification(tenantId, employeeId, taskTitle, type = 'TASK_ASSIGNED') {
    const titles = {
      'TASK_ASSIGNED': 'New Task Assigned',
      'TASK_OVERDUE': 'Task Overdue',
      'DEADLINE_REMINDER': 'Task Deadline Reminder'
    };

    const messages = {
      'TASK_ASSIGNED': `You have been assigned a new task: ${taskTitle}`,
      'TASK_OVERDUE': `Task "${taskTitle}" is overdue`,
      'DEADLINE_REMINDER': `Task "${taskTitle}" deadline is approaching`
    };

    return this.createNotification({
      tenantId,
      employeeId,
      type,
      title: titles[type],
      message: messages[type]
    });
  }

  async createSystemNotification(tenantId, employeeId, title, message, type = 'SYSTEM') {
    return this.createNotification({
      tenantId,
      employeeId,
      type,
      title,
      message
    });
  }
}

export default new NotificationService();