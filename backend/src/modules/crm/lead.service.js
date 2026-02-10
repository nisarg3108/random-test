import prisma from '../../config/db.js';

export const createLead = async (data, tenantId, userId) => {
  // Validation
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Lead name is required');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  
  return prisma.lead.create({
    data: {
      tenantId,
      // Existing fields
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      source: data.source || null,
      status: data.status || 'NEW',
      notes: data.notes || null,
      // New Phase 2 fields
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      jobTitle: data.jobTitle || null,
      leadScore: data.leadScore || 0,
      rating: data.rating || null,
      priority: data.priority || 'MEDIUM',
      campaign: data.campaign || null,
      medium: data.medium || null,
      referrer: data.referrer || null,
      budget: data.budget || null,
      timeline: data.timeline || null,
      authority: data.authority || null,
      need: data.need || null,
      ownerId: data.ownerId || userId || null,
      assignedAt: data.ownerId || userId ? new Date() : null,
      firstContactDate: data.firstContactDate ? new Date(data.firstContactDate) : new Date(),
      lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null,
      lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate) : null,
      tags: data.tags || [],
      customFields: data.customFields || null
    }
  });
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const listLeads = async (tenantId, filters = {}) => {
  const where = {
    tenantId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.rating ? { rating: filters.rating } : {}),
    ...(filters.minScore !== undefined ? { leadScore: { gte: filters.minScore } } : {}),
    ...(filters.search ? {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } }
      ]
    } : {})
  };
  
  return prisma.lead.findMany({
    where,
    include: {
      customer: true,
      contact: true,
      owner: { select: { id: true, email: true } },
      _count: {
        select: {
          activities: true,
          communications: true
        }
      }
    },
    orderBy: filters.sortBy === 'score' ? { leadScore: 'desc' } : { createdAt: 'desc' }
  });
};

export const getLead = async (id, tenantId) => {
  return prisma.lead.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      contact: true,
      owner: { select: { id: true, email: true } },
      _count: {
        select: {
          activities: true,
          communications: true
        }
      }
    }
  });
};

export const updateLead = async (id, data, tenantId) => {
  // Verify tenant ownership first
  const existing = await prisma.lead.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Lead not found or access denied');
  }
  
  const updateData = {
    ...(data.name !== undefined && { name: data.name.trim() }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.company !== undefined && { company: data.company }),
    ...(data.source !== undefined && { source: data.source }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.notes !== undefined && { notes: data.notes }),
    // New Phase 2 fields
    ...(data.firstName !== undefined && { firstName: data.firstName }),
    ...(data.lastName !== undefined && { lastName: data.lastName }),
    ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
    ...(data.leadScore !== undefined && { leadScore: data.leadScore }),
    ...(data.rating !== undefined && { rating: data.rating }),
    ...(data.priority !== undefined && { priority: data.priority }),
    ...(data.campaign !== undefined && { campaign: data.campaign }),
    ...(data.medium !== undefined && { medium: data.medium }),
    ...(data.referrer !== undefined && { referrer: data.referrer }),
    ...(data.budget !== undefined && { budget: data.budget }),
    ...(data.timeline !== undefined && { timeline: data.timeline }),
    ...(data.authority !== undefined && { authority: data.authority }),
    ...(data.need !== undefined && { need: data.need }),
    ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
    ...(data.lastContactDate !== undefined && { lastContactDate: new Date(data.lastContactDate) }),
    ...(data.lastActivityDate !== undefined && { lastActivityDate: new Date(data.lastActivityDate) }),
    ...(data.tags !== undefined && { tags: data.tags }),
    ...(data.customFields !== undefined && { customFields: data.customFields })
  };
  
  return prisma.lead.update({
    where: { id },
    data: updateData
  });
};

export const convertLead = async (id, tenantId, options = {}) => {
  const lead = await prisma.lead.findFirst({
    where: { id, tenantId }
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  // Create customer from lead
  const customer = await prisma.customer.create({
    data: {
      tenantId,
      name: lead.company || lead.name,
      status: 'ACTIVE',
      notes: lead.notes || null,
      primaryEmail: lead.email || null,
      primaryPhone: lead.phone || null,
      ownerId: lead.ownerId || null,
      source: lead.source || null,
      category: 'CUSTOMER',
      firstContactDate: lead.firstContactDate || new Date(),
      lastContactDate: lead.lastContactDate || null,
      tags: lead.tags || []
    }
  });

  // Create contact from lead
  const contact = await prisma.contact.create({
    data: {
      tenantId,
      customerId: customer.id,
      name: lead.name,
      firstName: lead.firstName || null,
      lastName: lead.lastName || null,
      email: lead.email || null,
      phone: lead.phone || null,
      jobTitle: lead.jobTitle || null,
      status: 'ACTIVE',
      isPrimary: true,
      ownerId: lead.ownerId || null,
      lastContactDate: lead.lastContactDate || null,
      tags: lead.tags || []
    }
  });

  // Optionally create deal
  let deal = null;
  if (options.createDeal) {
    deal = await prisma.deal.create({
      data: {
        tenantId,
        customerId: customer.id,
        name: options.dealName || `Deal - ${customer.name}`,
        stage: 'PROSPECTING',
        value: lead.budget || 0,
        amount: lead.budget || 0,
        status: 'OPEN',
        ownerId: lead.ownerId || null,
        source: 'INBOUND',
        leadId: lead.id,
        pipelineId: options.pipelineId || 'default',
        tags: lead.tags || []
      }
    });
  }

  // Update lead with conversion info
  const updatedLead = await prisma.lead.update({
    where: { id },
    data: {
      status: 'CONVERTED',
      customerId: customer.id,
      contactId: contact.id,
      dealId: deal?.id || null,
      convertedAt: new Date(),
      conversionSource: 'MANUAL'
    }
  });

  return { lead: updatedLead, customer, contact, deal };
};
