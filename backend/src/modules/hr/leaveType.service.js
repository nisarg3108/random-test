import prisma from '../../config/db.js';

export const createLeaveType = (data, tenantId) => {
  const code = data.code || data.name.toUpperCase().replace(/\s+/g, '_');
  const paid = data.paid !== undefined ? data.paid : true;
  const requiresApproval = data.requiresApproval !== undefined ? data.requiresApproval : true;
  const carryForward = data.carryForward !== undefined ? data.carryForward : false;
  
  return prisma.leaveType.create({
    data: {
      name: data.name,
      code,
      description: data.description || null,
      maxDays: data.maxDays ? parseInt(data.maxDays) : null,
      carryForward,
      paid,
      requiresApproval,
      isDeleted: false,
      tenantId
    },
  });
};

export const updateLeaveType = (id, data, tenantId) => {
  const updateData = {};
  
  if (data.name !== undefined) {
    updateData.name = data.name;
    updateData.code = data.code || data.name.toUpperCase().replace(/\s+/g, '_');
  }
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.maxDays !== undefined) updateData.maxDays = data.maxDays ? parseInt(data.maxDays) : null;
  if (data.carryForward !== undefined) updateData.carryForward = data.carryForward;
  if (data.paid !== undefined) updateData.paid = data.paid;
  if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
  
  return prisma.leaveType.update({
    where: { id, tenantId },
    data: updateData,
  });
};

export const deleteLeaveType = (id, tenantId) => {
  // Soft delete by marking as deleted
  return prisma.leaveType.update({
    where: { id, tenantId },
    data: { isDeleted: true }
  });
};

export const getLeaveType = (id, tenantId) => {
  return prisma.leaveType.findUnique({
    where: { id, tenantId },
  });
};

export const listLeaveTypes = (tenantId) => {
  // Only return non-deleted leave types
  return prisma.leaveType.findMany({
    where: { 
      tenantId,
      isDeleted: false
    },
    orderBy: { createdAt: 'desc' }
  });
};
