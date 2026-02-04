import prisma from '../../config/db.js';

export const createDeal = async (data, tenantId) => {
  return prisma.deal.create({
    data: {
      tenantId,
      customerId: data.customerId,
      name: data.name,
      stage: data.stage || 'PROSPECTING',
      value: typeof data.value === 'number' ? data.value : 0,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      status: data.status || 'OPEN',
      notes: data.notes || null
    }
  });
};

export const listDeals = async (tenantId) => {
  return prisma.deal.findMany({
    where: { tenantId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateDeal = async (id, data, tenantId) => {
  return prisma.deal.update({
    where: { id },
    data: {
      customerId: data.customerId,
      name: data.name,
      stage: data.stage || 'PROSPECTING',
      value: typeof data.value === 'number' ? data.value : 0,
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      status: data.status || 'OPEN',
      notes: data.notes || null
    }
  });
};

export const deleteDeal = async (id, tenantId) => {
  return prisma.deal.delete({
    where: { id }
  });
};
