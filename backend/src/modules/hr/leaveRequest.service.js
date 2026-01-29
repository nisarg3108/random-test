import prisma from '../../config/db.js';

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

  return prisma.leaveRequest.create({
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
      employee: true,
      leaveType: true,
    }
  });
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
      employee: true,
      leaveType: true,
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateLeaveRequestStatus = async (requestId, status, tenantId, comment = null) => {
  return prisma.leaveRequest.update({
    where: { id: requestId, tenantId },
    data: { 
      status,
      ...(comment && { comment })
    },
    include: {
      employee: true,
      leaveType: true,
    }
  });
};
