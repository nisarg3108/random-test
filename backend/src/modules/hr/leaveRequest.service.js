import prisma from '../../config/db.js';
import notificationService from '../notifications/notification.service.js';
import attendanceService from './attendance.service.js';

export const createLeaveRequest = async (data, tenantId, userId = null) => {
  let employeeId = data.employeeId;
  
  // If no employeeId provided, try to find employee by userId
  if (!employeeId && userId) {
    const employee = await prisma.employee.findFirst({
      where: { userId, tenantId }
    });
    if (employee) {
      employeeId = employee.id;
    }
  }
  
  if (!employeeId) throw new Error('Employee ID is required');
  
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId }
  });
  if (!employee) throw new Error('Employee not found');

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: data.leaveTypeId, tenantId }
  });
  if (!leaveType) throw new Error('Leave type not found');

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason,
      tenantId,
      status: 'PENDING',
    },
    include: {
      employee: {
        include: {
          user: true,
          department: true
        }
      },
      leaveType: true,
    }
  });

  // Notify managers/admins about new leave request
  try {
    const managers = await prisma.employee.findMany({
      where: {
        tenantId,
        user: { role: { in: ['MANAGER', 'ADMIN'] } }
      }
    });

    for (const manager of managers) {
      await notificationService.createNotification({
        tenantId,
        employeeId: manager.id,
        type: 'LEAVE_REQUEST',
        title: 'New Leave Request',
        message: `${employee.name} has requested ${leaveType.name} leave`
      });
    }
  } catch (error) {
    console.error('Failed to create leave request notifications:', error);
  }

  return leaveRequest;
};

export const listLeaveRequests = async (tenantId, userId = null) => {
  const where = { tenantId };
  
  // If userId provided, filter to employee's own requests
  if (userId) {
    const employee = await prisma.employee.findFirst({
      where: { userId, tenantId }
    });
    if (employee) {
      where.employeeId = employee.id;
    }
  }
  
  return prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true,
          department: true
        }
      },
      leaveType: true,
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateLeaveRequestStatus = async (requestId, status, tenantId, comment = null) => {
  const leaveRequest = await prisma.leaveRequest.update({
    where: { id: requestId, tenantId },
    data: { 
      status,
      ...(comment && { comment })
    },
    include: {
      employee: {
        include: {
          user: true,
          department: true
        }
      },
      leaveType: true,
    }
  });

  // Notify employee about status change
  try {
    await notificationService.createNotification({
      tenantId,
      employeeId: leaveRequest.employeeId,
      type: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      title: `Leave Request ${status}`,
      message: `Your ${leaveRequest.leaveType.name} leave request has been ${status.toLowerCase()}${comment ? `: ${comment}` : ''}`
    });

  } catch (error) {
    console.error('Failed to create leave status notification:', error);
  }

  // Integrate with attendance system when leave is approved
  if (status === 'APPROVED') {
    try {
      await attendanceService.integrateLeaveWithAttendance(requestId, tenantId);
    } catch (error) {
      console.error('Failed to integrate leave with attendance:', error);
      // Don't throw error - leave was already approved
    }
  }

  return leaveRequest;
};
