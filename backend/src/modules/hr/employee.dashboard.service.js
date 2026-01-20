import prisma from '../../config/db.js';

export const getEmployeeDashboard = async (userId, tenantId) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    include: {
      department: true,
      manager: {
        select: {
          id: true,
          name: true,
          designation: true,
          email: true
        }
      },
      user: {
        select: {
          email: true,
          status: true,
          role: true
        }
      },
      salaryStructure: true,
      tasks: {
        include: {
          assigner: {
            select: {
              name: true,
              designation: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      notifications: {
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Get task statistics
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: { employeeId: employee.id, tenantId },
    _count: { status: true }
  });

  const stats = {
    pending: taskStats.find(s => s.status === 'PENDING')?._count?.status || 0,
    inProgress: taskStats.find(s => s.status === 'IN_PROGRESS')?._count?.status || 0,
    completed: taskStats.find(s => s.status === 'COMPLETED')?._count?.status || 0
  };

  // Get upcoming deadlines
  const upcomingDeadlines = await prisma.task.findMany({
    where: {
      employeeId: employee.id,
      tenantId,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    },
    orderBy: { dueDate: 'asc' },
    take: 5
  });

  return {
    employee,
    taskStats: stats,
    upcomingDeadlines
  };
};

export const getEmployeeTasks = async (userId, tenantId, filters = {}) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    select: { id: true }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const where = {
    employeeId: employee.id,
    tenantId
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  return prisma.task.findMany({
    where,
    include: {
      assigner: {
        select: {
          name: true,
          designation: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateTaskStatus = async (taskId, status, userId, tenantId) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    select: { id: true }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, employeeId: employee.id, tenantId }
  });

  if (!task) {
    throw new Error('Task not found or access denied');
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { status }
  });
};

export const getEmployeeSalaryStructure = async (userId, tenantId) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    include: {
      salaryStructure: true
    }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  return employee.salaryStructure;
};

export const createWorkReport = async (data, userId, tenantId) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    select: { id: true }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  return prisma.workReport.create({
    data: {
      ...data,
      employeeId: employee.id,
      tenantId,
      workDate: new Date(data.workDate)
    }
  });
};

export const getEmployeeWorkReports = async (userId, tenantId, filters = {}) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    select: { id: true }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const where = {
    employeeId: employee.id,
    tenantId
  };

  if (filters.startDate && filters.endDate) {
    where.workDate = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate)
    };
  }

  return prisma.workReport.findMany({
    where,
    include: {
      task: {
        select: {
          title: true,
          status: true
        }
      }
    },
    orderBy: { workDate: 'desc' }
  });
};

export const markNotificationAsRead = async (notificationId, userId, tenantId) => {
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    select: { id: true }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  return prisma.notification.update({
    where: {
      id: notificationId,
      employeeId: employee.id
    },
    data: { isRead: true }
  });
};