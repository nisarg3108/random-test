import prisma from '../../config/db.js';

export const createCommunication = async (data, tenantId, userId) => {
  return prisma.communication.create({
    data: {
      tenantId,
      // Existing fields
      type: data.type,
      subject: data.subject || null,
      notes: data.notes,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      createdBy: userId || null,
      customerId: data.customerId || null,
      contactId: data.contactId || null,
      leadId: data.leadId || null,
      // New Phase 2 fields
      direction: data.direction || null,
      duration: data.duration || null,
      outcome: data.outcome || null,
      emailFrom: data.emailFrom || null,
      emailTo: data.emailTo || null,
      emailCc: data.emailCc || null,
      meetingLocation: data.meetingLocation || null,
      meetingAttendees: data.meetingAttendees || [],
      dealId: data.dealId || null,
      activityId: data.activityId || null,
      hasAttachments: data.hasAttachments || false,
      attachmentCount: data.attachmentCount || 0,
      tags: data.tags || [],
      customFields: data.customFields || null
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
      customer: { select: { id: true, name: true } },
      contact: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, name: true, email: true } },
      deal: { select: { id: true, name: true, stage: true } },
      activity: { select: { id: true, subject: true, type: true } },
      creator: { select: { id: true, email: true } },
      attachments: true
    },
    orderBy: { occurredAt: 'desc' }
  });
};
