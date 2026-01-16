import prisma from '../../config/db.js';

export const createLeaveType = (data, tenantId) => {
  return prisma.leaveType.create({
    data: { ...data, tenantId },
  });
};

export const listLeaveTypes = (tenantId) => {
  return prisma.leaveType.findMany({
    where: { tenantId },
  });
};
