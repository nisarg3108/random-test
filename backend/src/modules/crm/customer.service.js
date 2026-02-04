import prisma from '../../config/db.js';

export const createCustomer = async (data, tenantId) => {
  return prisma.customer.create({
    data: {
      tenantId,
      name: data.name,
      industry: data.industry || null,
      website: data.website || null,
      status: data.status || 'ACTIVE',
      notes: data.notes || null
    }
  });
};

export const listCustomers = async (tenantId) => {
  return prisma.customer.findMany({
    where: { tenantId },
    include: {
      contacts: true,
      deals: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getCustomer = async (id, tenantId) => {
  return prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      contacts: true,
      deals: true,
      communications: true
    }
  });
};

export const updateCustomer = async (id, data, tenantId) => {
  return prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      industry: data.industry || null,
      website: data.website || null,
      status: data.status || 'ACTIVE',
      notes: data.notes || null
    }
  });
};

export const deleteCustomer = async (id, tenantId) => {
  return prisma.customer.delete({
    where: { id }
  });
};
