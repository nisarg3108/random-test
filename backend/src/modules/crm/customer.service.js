import prisma from '../../config/db.js';

export const createCustomer = async (data, tenantId, userId) => {
  // Validation
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Customer name is required');
  }
  
  if (data.primaryEmail && !isValidEmail(data.primaryEmail)) {
    throw new Error('Invalid email format');
  }
  
  return prisma.customer.create({
    data: {
      tenantId,
      name: data.name.trim(),
      // Existing fields
      industry: data.industry || null,
      website: data.website || null,
      status: data.status || 'ACTIVE',
      notes: data.notes || null,
      // New Phase 2 fields - Basic Info
      type: data.type || 'BUSINESS',
      companySize: data.companySize || null,
      annualRevenue: data.annualRevenue || null,
      currencyCode: data.currencyCode || 'USD',
      // Contact Information
      primaryEmail: data.primaryEmail || null,
      primaryPhone: data.primaryPhone || null,
      billingAddress: data.billingAddress || null,
      shippingAddress: data.shippingAddress || null,
      // Relationship Management
      ownerId: data.ownerId || userId || null,
      accountManager: data.accountManager || null,
      category: data.category || 'CUSTOMER',
      source: data.source || null,
      // Engagement
      firstContactDate: data.firstContactDate ? new Date(data.firstContactDate) : new Date(),
      lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null,
      preferredChannel: data.preferredChannel || null,
      timezone: data.timezone || null,
      // Metadata
      tags: data.tags || [],
      customFields: data.customFields || null
    }
  });
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const listCustomers = async (tenantId, filters = {}) => {
  const where = {
    tenantId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.search ? {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { primaryEmail: { contains: filters.search, mode: 'insensitive' } },
        { primaryPhone: { contains: filters.search, mode: 'insensitive' } }
      ]
    } : {})
  };
  
  return prisma.customer.findMany({
    where,
    include: {
      contacts: { take: 5 },
      deals: { take: 5, orderBy: { createdAt: 'desc' } },
      owner: { select: { id: true, email: true } },
      _count: {
        select: {
          contacts: true,
          deals: true,
          activities: true,
          customerNotes: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const getCustomer = async (id, tenantId) => {
  return prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      contacts: { orderBy: { createdAt: 'desc' } },
      deals: { orderBy: { createdAt: 'desc' } },
      communications: { orderBy: { occurredAt: 'desc' }, take: 50 },
      activities: { 
        orderBy: { dueDate: 'asc' },
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        take: 20,
        include: {
          assignee: { select: { id: true, email: true } },
          creator: { select: { id: true, email: true } }
        }
      },
      customerNotes: { 
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          creator: { select: { id: true, email: true } }
        }
      },
      attachments: { orderBy: { createdAt: 'desc' } },
      owner: { select: { id: true, email: true } },
      salesQuotations: { orderBy: { createdAt: 'desc' }, take: 10 },
      salesOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
      salesInvoices: { orderBy: { createdAt: 'desc' }, take: 10 }
    }
  });
};

export const updateCustomer = async (id, data, tenantId) => {
  // Verify tenant ownership first
  const existing = await prisma.customer.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Customer not found or access denied');
  }
  
  // Validation
  if (data.name && data.name.trim().length === 0) {
    throw new Error('Customer name cannot be empty');
  }
  
  if (data.primaryEmail && !isValidEmail(data.primaryEmail)) {
    throw new Error('Invalid email format');
  }
  
  const updateData = {
    // Only update fields that are provided
    ...(data.name !== undefined && { name: data.name.trim() }),
    ...(data.industry !== undefined && { industry: data.industry }),
    ...(data.website !== undefined && { website: data.website }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.notes !== undefined && { notes: data.notes }),
    // New Phase 2 fields
    ...(data.type !== undefined && { type: data.type }),
    ...(data.companySize !== undefined && { companySize: data.companySize }),
    ...(data.annualRevenue !== undefined && { annualRevenue: data.annualRevenue }),
    ...(data.currencyCode !== undefined && { currencyCode: data.currencyCode }),
    ...(data.primaryEmail !== undefined && { primaryEmail: data.primaryEmail }),
    ...(data.primaryPhone !== undefined && { primaryPhone: data.primaryPhone }),
    ...(data.billingAddress !== undefined && { billingAddress: data.billingAddress }),
    ...(data.shippingAddress !== undefined && { shippingAddress: data.shippingAddress }),
    ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
    ...(data.accountManager !== undefined && { accountManager: data.accountManager }),
    ...(data.category !== undefined && { category: data.category }),
    ...(data.source !== undefined && { source: data.source }),
    ...(data.firstContactDate !== undefined && { firstContactDate: new Date(data.firstContactDate) }),
    ...(data.lastContactDate !== undefined && { lastContactDate: new Date(data.lastContactDate) }),
    ...(data.preferredChannel !== undefined && { preferredChannel: data.preferredChannel }),
    ...(data.timezone !== undefined && { timezone: data.timezone }),
    ...(data.tags !== undefined && { tags: data.tags }),
    ...(data.customFields !== undefined && { customFields: data.customFields })
  };
  
  return prisma.customer.update({
    where: { id },
    data: updateData
  });
};

export const deleteCustomer = async (id, tenantId) => {
  // Verify tenant ownership first
  const existing = await prisma.customer.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Customer not found or access denied');
  }
  
  return prisma.customer.delete({
    where: { id }
  });
};
