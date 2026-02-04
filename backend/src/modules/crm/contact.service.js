import prisma from '../../config/db.js';

export const createContact = async (data, tenantId) => {
  return prisma.contact.create({
    data: {
      tenantId,
      customerId: data.customerId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      status: data.status || 'ACTIVE'
    }
  });
};

export const listContacts = async (tenantId) => {
  return prisma.contact.findMany({
    where: { tenantId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const getContact = async (id, tenantId) => {
  return prisma.contact.findFirst({
    where: { id, tenantId },
    include: { customer: true, communications: true }
  });
};

export const updateContact = async (id, data, tenantId) => {
  return prisma.contact.update({
    where: { id },
    data: {
      customerId: data.customerId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      status: data.status || 'ACTIVE'
    }
  });
};

export const deleteContact = async (id, tenantId) => {
  return prisma.contact.delete({
    where: { id }
  });
};
