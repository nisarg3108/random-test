import prisma from '../../config/db.js';

export const createCommunication = async (data, tenantId, userId) => {
  return prisma.communication.create({
    data: {
      tenantId,
      type: data.type,
      subject: data.subject || null,
      notes: data.notes,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      createdBy: userId || null,
      customerId: data.customerId || null,
      contactId: data.contactId || null,
      leadId: data.leadId || null
    }
  });
};

export const listCommunications = async (tenantId, filters = {}) => {
  const where = {
    tenantId,
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.contactId ? { contactId: filters.contactId } : {}),
    ...(filters.leadId ? { leadId: filters.leadId } : {})
  };

  return prisma.communication.findMany({
    where,
    include: {
      customer: true,
      contact: true,
      lead: true
    },
    orderBy: { occurredAt: 'desc' }
  });
};
