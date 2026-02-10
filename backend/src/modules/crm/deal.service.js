import prisma from '../../config/db.js';

export const createDeal = async (data, tenantId, userId) => {
  // Validation
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Deal name is required');
  }
  
  if (!data.customerId) {
    throw new Error('Customer ID is required');
  }
  
  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, tenantId }
  });
  
  if (!customer) {
    throw new Error('Customer not found');
  }
  
  // Get default pipeline if not specified
  const pipelineId = data.pipelineId || 'default';
  
  // Calculate total if not provided
  const amount = typeof data.amount === 'number' ? data.amount : (typeof data.value === 'number' ? data.value : 0);
  const discount = data.discount || 0;
  const tax = data.tax || 0;
  const total = data.total || (amount - discount + tax);
  
  return prisma.deal.create({
    data: {
      tenantId,
      customerId: data.customerId,
      // Existing fields
      name: data.name.trim(),
      stage: data.stage || 'PROSPECTING',
      value: amount, // Keep for backward compatibility
      expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      status: data.status || 'OPEN',
      notes: data.notes || null,
      // New Phase 2 fields
      pipelineId: pipelineId,
      stageOrder: data.stageOrder || 1,
      probability: data.probability || 10,
      amount: amount,
      currencyCode: data.currencyCode || 'USD',
      discount: discount,
      tax: tax,
      total: total,
      products: data.products || null,
      ownerId: data.ownerId || userId || null,
      teamMembers: data.teamMembers || [],
      createdDate: new Date(),
      firstContactDate: data.firstContactDate ? new Date(data.firstContactDate) : null,
      lastActivityDate: data.lastActivityDate ? new Date(data.lastActivityDate) : null,
      competitors: data.competitors || [],
      leadId: data.leadId || null,
      source: data.source || null,
      tags: data.tags || [],
      customFields: data.customFields || null
    }
  });
};

export const listDeals = async (tenantId, filters = {}) => {
  const where = {
    tenantId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters.pipelineId ? { pipelineId: filters.pipelineId } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.search ? {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } }
      ]
    } : {})
  };
  
  return prisma.deal.findMany({
    where,
    include: {
      customer: true,
      owner: { select: { id: true, email: true } },
      pipeline: { include: { stages: true } },
      _count: {
        select: {
          activities: true,
          communications: true,
          attachments: true
        }
      }
    },
    orderBy: filters.sortBy === 'value' ? { amount: 'desc' } : { createdAt: 'desc' }
  });
};

export const getDeal = async (id, tenantId) => {
  return prisma.deal.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      owner: { select: { id: true, email: true } },
      pipeline: { include: { stages: true } },
      _count: {
        select: {
          activities: true,
          communications: true,
          attachments: true
        }
      }
    }
  });
};

export const updateDeal = async (id, data, tenantId) => {
  // Verify tenant ownership first
  const existing = await prisma.deal.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Deal not found or access denied');
  }
  
  // Calculate total if financial fields changed
  const updateData = {};
  if (data.amount !== undefined || data.discount !== undefined || data.tax !== undefined) {
    const amount = data.amount !== undefined ? data.amount : existing.amount;
    const discount = data.discount !== undefined ? data.discount : existing.discount;
    const tax = data.tax !== undefined ? data.tax : existing.tax;
    updateData.total = amount - discount + tax;
  }
  
  return prisma.deal.update({
    where: { id },
    data: {
      ...(data.customerId !== undefined && { customerId: data.customerId }),
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.stage !== undefined && { stage: data.stage }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.expectedCloseDate !== undefined && { expectedCloseDate: new Date(data.expectedCloseDate) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
      // New Phase 2 fields
      ...(data.pipelineId !== undefined && { pipelineId: data.pipelineId }),
      ...(data.stageOrder !== undefined && { stageOrder: data.stageOrder }),
      ...(data.probability !== undefined && { probability: data.probability }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.currencyCode !== undefined && { currencyCode: data.currencyCode }),
      ...(data.discount !== undefined && { discount: data.discount }),
      ...(data.tax !== undefined && { tax: data.tax }),
      ...(data.products !== undefined && { products: data.products }),
      ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      ...(data.teamMembers !== undefined && { teamMembers: data.teamMembers }),
      ...(data.closedDate !== undefined && { closedDate: data.closedDate ? new Date(data.closedDate) : null }),
      ...(data.lastActivityDate !== undefined && { lastActivityDate: new Date(data.lastActivityDate) }),
      ...(data.competitors !== undefined && { competitors: data.competitors }),
      ...(data.wonReason !== undefined && { wonReason: data.wonReason }),
      ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
      ...(data.lostToCompetitor !== undefined && { lostToCompetitor: data.lostToCompetitor }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.customFields !== undefined && { customFields: data.customFields }),
      ...updateData
    }
  });
};

export const deleteDeal = async (id, tenantId) => {
  // Verify tenant ownership first
  const existing = await prisma.deal.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Deal not found or access denied');
  }
  
  return prisma.deal.delete({
    where: { id }
  });
};
