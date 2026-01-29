import prisma from '../../config/db.js';

export const createLeaveType = (data, tenantId) => {
  const code = data.code || data.name.toUpperCase().replace(/\s+/g, '_');
  const paid = data.paid !== undefined ? data.paid : true;
  const { name, maxDays } = data;
  
  return prisma.leaveType.create({
    data: { name, code, maxDays, paid, tenantId },
  });
};

export const updateLeaveType = (id, data, tenantId) => {
  const updateData = {};
  
  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.code = data.code || data.name.toUpperCase().replace(/\s+/g, '_');
  }
  if (data.maxDays !== undefined) updateData.maxDays = data.maxDays;
  if (data.paid !== undefined) updateData.paid = data.paid;
  
  return prisma.leaveType.update({
    where: { id, tenantId },
    data: updateData,
  });
};

export const deleteLeaveType = (id, tenantId) => {
  return prisma.leaveType.delete({
    where: { id, tenantId },
  });
};

export const getLeaveType = (id, tenantId) => {
  return prisma.leaveType.findUnique({
    where: { id, tenantId },
  });
};

export const listLeaveTypes = (tenantId) => {
  return prisma.leaveType.findMany({
    where: { tenantId },
  });
};
