import prisma from '../../config/db.js';

export const createLeaveRequest = async (data, tenantId) => {
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, tenantId }
  });
  if (!employee) throw new Error('Employee not found');

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: data.leaveTypeId, tenantId }
  });
  if (!leaveType) throw new Error('Leave type not found');

  return prisma.leaveRequest.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      tenantId,
      status: 'PENDING',
    },
  });
};

export const listLeaveRequests = async (tenantId) => {
  return prisma.leaveRequest.findMany({
    where: { tenantId },
    include: {
      employee: true,
      leaveType: true,
    },
  });
};
