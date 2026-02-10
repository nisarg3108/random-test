import prisma from '../../config/db.js';

export const createContact = async (data, tenantId, userId) => {
  // Validation
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Contact name is required');
  }
  
  if (!data.customerId) {
    throw new Error('Customer ID is required');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  
  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, tenantId }
  });
  
  if (!customer) {
    throw new Error('Customer not found');
  }
  
  return prisma.contact.create({
    data: {
      tenantId,
      customerId: data.customerId,
      // Existing fields
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      status: data.status || 'ACTIVE',
      // New Phase 2 fields
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      jobTitle: data.jobTitle || null,
      department: data.department || null,
      role: data.role || null,
      mobilePhone: data.mobilePhone || null,
      workPhone: data.workPhone || null,
      linkedinUrl: data.linkedinUrl || null,
      twitterHandle: data.twitterHandle || null,
      isPrimary: data.isPrimary || false,
      ownerId: data.ownerId || userId || null,
      preferredChannel: data.preferredChannel || null,
      lastContactDate: data.lastContactDate ? new Date(data.lastContactDate) : null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      anniversary: data.anniversary ? new Date(data.anniversary) : null,
      emailOptIn: data.emailOptIn !== undefined ? data.emailOptIn : true,
      smsOptIn: data.smsOptIn || false,
      doNotCall: data.doNotCall || false,
      tags: data.tags || [],
      customFields: data.customFields || null
    }
  });
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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
    include: {
      customer: true,
      communications: { orderBy: { occurredAt: 'desc' }, take: 50 },
      activities: { 
        orderBy: { dueDate: 'asc' },
        include: {
          assignee: { select: { id: true, email: true } }
        }
      },
      owner: { select: { id: true, email: true } }
    }
  });
};

export const updateContact = async (id, data, tenantId) => {
  // Verify tenant ownership first
  const existing = await prisma.contact.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Contact not found or access denied');
  }
  
  const updateData = {
    ...(data.customerId !== undefined && { customerId: data.customerId }),
    ...(data.name !== undefined && { name: data.name.trim() }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.title !== undefined && { title: data.title }),
    ...(data.status !== undefined && { status: data.status }),
    // New Phase 2 fields
    ...(data.firstName !== undefined && { firstName: data.firstName }),
    ...(data.lastName !== undefined && { lastName: data.lastName }),
    ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
    ...(data.department !== undefined && { department: data.department }),
    ...(data.role !== undefined && { role: data.role }),
    ...(data.mobilePhone !== undefined && { mobilePhone: data.mobilePhone }),
    ...(data.workPhone !== undefined && { workPhone: data.workPhone }),
    ...(data.linkedinUrl !== undefined && { linkedinUrl: data.linkedinUrl }),
    ...(data.twitterHandle !== undefined && { twitterHandle: data.twitterHandle }),
    ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
    ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
    ...(data.preferredChannel !== undefined && { preferredChannel: data.preferredChannel }),
    ...(data.lastContactDate !== undefined && { lastContactDate: new Date(data.lastContactDate) }),
    ...(data.birthday !== undefined && { birthday: data.birthday ? new Date(data.birthday) : null }),
    ...(data.anniversary !== undefined && { anniversary: data.anniversary ? new Date(data.anniversary) : null }),
    ...(data.emailOptIn !== undefined && { emailOptIn: data.emailOptIn }),
    ...(data.smsOptIn !== undefined && { smsOptIn: data.smsOptIn }),
    ...(data.doNotCall !== undefined && { doNotCall: data.doNotCall }),
    ...(data.tags !== undefined && { tags: data.tags }),
    ...(data.customFields !== undefined && { customFields: data.customFields })
  };
  
  return prisma.contact.update({
    where: { id },
    data: updateData
  });
};

export const deleteContact = async (id, tenantId) => {
  // Verify tenant ownership first
  const existing = await prisma.contact.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Contact not found or access denied');
  }
  
  return prisma.contact.delete({
    where: { id }
  });
};
