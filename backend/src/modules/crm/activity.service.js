import prisma from '../../config/db.js';

/**
 * Activity Service - Manages tasks, calls, emails, meetings, and to-dos
 */

export const createActivity = async (data, tenantId, userId) => {
  // Validation
  if (!data.subject || data.subject.trim().length === 0) {
    throw new Error('Activity subject is required');
  }
  
  if (!data.type) {
    throw new Error('Activity type is required');
  }
  
  const validTypes = ['TASK', 'CALL', 'EMAIL', 'MEETING', 'TODO'];
  if (!validTypes.includes(data.type)) {
    throw new Error(`Invalid activity type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  return prisma.activity.create({
    data: {
      tenantId,
      type: data.type,
      subject: data.subject.trim(),
      description: data.description || null,
      status: data.status || 'PENDING',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      dueTime: data.dueTime || null,
      reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      assignedTo: data.assignedTo || null,
      createdBy: userId,
      customerId: data.customerId || null,
      contactId: data.contactId || null,
      leadId: data.leadId || null,
      dealId: data.dealId || null,
      outcome: data.outcome || null,
      notes: data.notes || null
    },
    include: {
      assignee: { select: { id: true, email: true } },
      creator: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true, stage: true } }
    }
  });
};

export const listActivities = async (tenantId, filters = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const where = {
    tenantId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.assignedTo ? { assignedTo: filters.assignedTo } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.contactId ? { contactId: filters.contactId } : {}),
    ...(filters.leadId ? { leadId: filters.leadId } : {}),
    ...(filters.dealId ? { dealId: filters.dealId } : {}),
    ...(filters.overdue ? {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { lt: today }
    } : {}),
    ...(filters.dueToday ? {
      dueDate: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    } : {})
  };
  
  return prisma.activity.findMany({
    where,
    include: {
      assignee: { select: { id: true, email: true } },
      creator: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true, status: true } },
      deal: { select: { id: true, name: true, stage: true, value: true } }
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'asc' },
      { dueDate: 'asc' }
    ]
  });
};

export const getActivity = async (id, tenantId) => {
  return prisma.activity.findFirst({
    where: { id, tenantId },
    include: {
      assignee: { select: { id: true, email: true } },
      creator: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true, primaryEmail: true, primaryPhone: true } },
      contact: { select: { id: true, name: true, email: true, phone: true } },
      lead: { select: { id: true, name: true, email: true, status: true } },
      deal: { select: { id: true, name: true, stage: true, value: true, status: true } },
      communications: { orderBy: { occurredAt: 'desc' } }
    }
  });
};

export const updateActivity = async (id, data, tenantId, userId) => {
  // Verify ownership
  const existing = await prisma.activity.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Activity not found or access denied');
  }
  
  // Auto-set completion timestamp if status changed to COMPLETED
  const isCompleting = data.status === 'COMPLETED' && existing.status !== 'COMPLETED';
  
  return prisma.activity.update({
    where: { id },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.subject !== undefined && { subject: data.subject.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.dueTime !== undefined && { dueTime: data.dueTime }),
      ...(data.reminderAt !== undefined && { reminderAt: data.reminderAt ? new Date(data.reminderAt) : null }),
      ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
      ...(data.customerId !== undefined && { customerId: data.customerId }),
      ...(data.contactId !== undefined && { contactId: data.contactId }),
      ...(data.leadId !== undefined && { leadId: data.leadId }),
      ...(data.dealId !== undefined && { dealId: data.dealId }),
      ...(data.outcome !== undefined && { outcome: data.outcome }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(isCompleting && {
        completedAt: new Date(),
        completedBy: userId
      })
    },
    include: {
      assignee: { select: { id: true, email: true } },
      creator: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } }
    }
  });
};

export const deleteActivity = async (id, tenantId) => {
  // Verify ownership
  const existing = await prisma.activity.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Activity not found or access denied');
  }
  
  return prisma.activity.delete({
    where: { id }
  });
};

export const completeActivity = async (id, outcome, notes, tenantId, userId) => {
  const existing = await prisma.activity.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Activity not found or access denied');
  }
  
  return prisma.activity.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy: userId,
      outcome: outcome || null,
      notes: notes || existing.notes
    },
    include: {
      assignee: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      deal: { select: {id: true, name: true } }
    }
  });
};

export const getMyActivities = async (tenantId, userId, filters = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const where = {
    tenantId,
    assignedTo: userId,
    ...(filters.status ? { status: filters.status } : { status: { in: ['PENDING', 'IN_PROGRESS'] } }),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.type ? { type: filters.type } : {})
  };
  
  return prisma.activity.findMany({
    where,
    include: {
      creator: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true, stage: true } }
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'asc' },
      { dueDate: 'asc' }
    ]
  });
};

export const getOverdueActivities = async (tenantId, userId = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const where = {
    tenantId,
    status: { in: ['PENDING', 'IN_PROGRESS'] },
    dueDate: { lt: today },
    ...(userId ? { assignedTo: userId } : {})
  };
  
  return prisma.activity.findMany({
    where,
    include: {
      assignee: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } }
    },
    orderBy: { dueDate: 'asc' }
  });
};

export const getUpcomingActivities = async (tenantId, userId = null, days = 7) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);
  
  const where = {
    tenantId,
    status: { in: ['PENDING', 'IN_PROGRESS'] },
    dueDate: { gte: today, lte: futureDate },
    ...(userId ? { assignedTo: userId } : {})
  };
  
  return prisma.activity.findMany({
    where,
    include: {
      assignee: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } }
    },
    orderBy: { dueDate: 'asc' }
  });
};
