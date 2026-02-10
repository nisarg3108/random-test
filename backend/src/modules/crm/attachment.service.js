import prisma from '../../config/db.js';

/**
 * Attachment Service - Manages file attachments for CRM entities
 */

export const createAttachment = async (data, tenantId, userId) => {
  // Validation
  if (!data.fileName || data.fileName.trim().length === 0) {
    throw new Error('File name is required');
  }
  
  if (!data.fileUrl) {
    throw new Error('File URL is required');
  }
  
  // Must link to at least one entity
  if (!data.customerId && !data.dealId && !data.communicationId) {
    throw new Error('Attachment must be linked to a Customer, Deal, or Communication');
  }
  
  // Validate file size if provided
  if (data.fileSize && data.fileSize > 100 * 1024 * 1024) { // 100MB limit
    throw new Error('File size exceeds maximum limit of 100MB');
  }
  
  return prisma.attachment.create({
    data: {
      tenantId,
      fileName: data.fileName.trim(),
      fileUrl: data.fileUrl,
      fileType: data.fileType || null,
      fileSize: data.fileSize || null,
      description: data.description || null,
      uploadedBy: userId,
      customerId: data.customerId || null,
      dealId: data.dealId || null,
      communicationId: data.communicationId || null
    },
    include: {
      uploader: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } },
      communication: { select: { id: true, type: true, direction: true, occurredAt: true } }
    }
  });
};

export const listAttachments = async (tenantId, filters = {}) => {
  const where = {
    tenantId,
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.dealId ? { dealId: filters.dealId } : {}),
    ...(filters.communicationId ? { communicationId: filters.communicationId } : {}),
    ...(filters.fileType ? { fileType: { contains: filters.fileType, mode: 'insensitive' } } : {}),
    ...(filters.uploadedBy ? { uploadedBy: filters.uploadedBy } : {})
  };
  
  return prisma.attachment.findMany({
    where,
    include: {
      uploader: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } }
    },
    orderBy: { uploadedAt: 'desc' }
  });
};

export const getAttachment = async (id, tenantId) => {
  return prisma.attachment.findFirst({
    where: { id, tenantId },
    include: {
      uploader: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true, primaryEmail: true } },
      deal: { select: { id: true, name: true, stage: true, value: true } },
      communication: { 
        select: { 
          id: true, 
          type: true, 
          direction: true, 
          subject: true,
          occurredAt: true 
        } 
      }
    }
  });
};

export const updateAttachment = async (id, data, tenantId) => {
  // Verify ownership
  const existing = await prisma.attachment.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Attachment not found or access denied');
  }
  
  return prisma.attachment.update({
    where: { id },
    data: {
      ...(data.fileName !== undefined && { fileName: data.fileName.trim() }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.fileType !== undefined && { fileType: data.fileType }),
      ...(data.customerId !== undefined && { customerId: data.customerId }),
      ...(data.dealId !== undefined && { dealId: data.dealId }),
      ...(data.communicationId !== undefined && { communicationId: data.communicationId })
    },
    include: {
      uploader: { select: { id: true, email: true } },
      customer: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } }
    }
  });
};

export const deleteAttachment = async (id, tenantId) => {
  // Verify ownership
  const existing = await prisma.attachment.findFirst({
    where: { id, tenantId }
  });
  
  if (!existing) {
    throw new Error('Attachment not found or access denied');
  }
  
  // Note: You should also delete the file from S3/storage here
  // Example: await deleteFileFromStorage(existing.fileUrl);
  
  return prisma.attachment.delete({
    where: { id }
  });
};

export const getAttachmentsByEntity = async (entityType, entityId, tenantId) => {
  const validTypes = ['customer', 'deal', 'communication'];
  if (!validTypes.includes(entityType)) {
    throw new Error(`Invalid entity type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  const where = {
    tenantId,
    ...(entityType === 'customer' && { customerId: entityId }),
    ...(entityType === 'deal' && { dealId: entityId }),
    ...(entityType === 'communication' && { communicationId: entityId })
  };
  
  return prisma.attachment.findMany({
    where,
    include: {
      uploader: { select: { id: true, email: true } }
    },
    orderBy: { uploadedAt: 'desc' }
  });
};

export const getAttachmentStats = async (tenantId, entityType = null, entityId = null) => {
  const where = {
    tenantId,
    ...(entityType === 'customer' && entityId && { customerId: entityId }),
    ...(entityType === 'deal' && entityId && { dealId: entityId })
  };
  
  const attachments = await prisma.attachment.findMany({
    where,
    select: {
      fileSize: true,
      fileType: true
    }
  });
  
  const totalSize = attachments.reduce((sum, att) => sum + (att.fileSize || 0), 0);
  const totalCount = attachments.length;
  
  // Group by file type
  const byType = attachments.reduce((acc, att) => {
    const type = att.fileType || 'unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, size: 0 };
    }
    acc[type].count++;
    acc[type].size += att.fileSize || 0;
    return acc;
  }, {});
  
  return {
    totalCount,
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    byType
  };
};

export const bulkUploadAttachments = async (files, entityType, entityId, tenantId, userId) => {
  // Validate entity type
  const validTypes = ['customer', 'deal', 'communication'];
  if (!validTypes.includes(entityType)) {
    throw new Error(`Invalid entity type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Create attachments in transaction
  const attachments = await prisma.$transaction(
    files.map(file => 
      prisma.attachment.create({
        data: {
          tenantId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileType: file.fileType || null,
          fileSize: file.fileSize || null,
          description: file.description || null,
          uploadedBy: userId,
          ...(entityType === 'customer' && { customerId: entityId }),
          ...(entityType === 'deal' && { dealId: entityId }),
          ...(entityType === 'communication' && { communicationId: entityId })
        },
        include: {
          uploader: { select: { id: true, email: true } }
        }
      })
    )
  );
  
  return attachments;
};
