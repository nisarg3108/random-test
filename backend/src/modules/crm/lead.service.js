import prisma from '../../config/db.js';

export const createLead = async (data, tenantId) => {
  return prisma.lead.create({
    data: {
      tenantId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      source: data.source || null,
      status: data.status || 'NEW',
      notes: data.notes || null
    }
  });
};

export const listLeads = async (tenantId) => {
  return prisma.lead.findMany({
    where: { tenantId },
    include: { customer: true, contact: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const updateLead = async (id, data, tenantId) => {
  return prisma.lead.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      source: data.source || null,
      status: data.status || 'NEW',
      notes: data.notes || null
    }
  });
};

export const convertLead = async (id, tenantId) => {
  const lead = await prisma.lead.findFirst({
    where: { id, tenantId }
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      name: lead.company || lead.name,
      industry: null,
      website: null,
      status: 'ACTIVE',
      notes: lead.notes || null
    }
  });

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      customerId: customer.id,
      name: lead.name,
      email: lead.email || null,
      phone: lead.phone || null,
      title: null,
      status: 'ACTIVE'
    }
  });

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      status: 'CONVERTED',
      customerId: customer.id,
      contactId: contact.id
    }
  });

  return { lead: updatedLead, customer, contact };
};
