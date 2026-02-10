import {
  createAttachment,
  listAttachments,
  getAttachment,
  updateAttachment,
  deleteAttachment,
  getAttachmentsByEntity,
  getAttachmentStats,
  bulkUploadAttachments
} from './attachment.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

export const createAttachmentController = async (req, res, next) => {
  try {
    const attachment = await createAttachment(req.body, req.user.tenantId, req.user.userId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'ATTACHMENT',
      entityId: attachment.id
    });

    res.status(201).json(attachment);
  } catch (err) {
    next(err);
  }
};

export const listAttachmentsController = async (req, res, next) => {
  try {
    const filters = {
      customerId: req.query.customerId,
      dealId: req.query.dealId,
      communicationId: req.query.communicationId,
      fileType: req.query.fileType,
      uploadedBy: req.query.uploadedBy
    };
    const attachments = await listAttachments(req.user.tenantId, filters);
    res.json(attachments);
  } catch (err) {
    next(err);
  }
};

export const getAttachmentController = async (req, res, next) => {
  try {
    const attachment = await getAttachment(req.params.id, req.user.tenantId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    res.json(attachment);
  } catch (err) {
    next(err);
  }
};

export const updateAttachmentController = async (req, res, next) => {
  try {
    const attachment = await updateAttachment(req.params.id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'ATTACHMENT',
      entityId: attachment.id
    });

    res.json(attachment);
  } catch (err) {
    next(err);
  }
};

export const deleteAttachmentController = async (req, res, next) => {
  try {
    await deleteAttachment(req.params.id, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'DELETE',
      entity: 'ATTACHMENT',
      entityId: req.params.id
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getAttachmentsByEntityController = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const attachments = await getAttachmentsByEntity(entityType, entityId, req.user.tenantId);
    res.json(attachments);
  } catch (err) {
    next(err);
  }
};

export const getAttachmentStatsController = async (req, res, next) => {
  try {
    const stats = await getAttachmentStats(
      req.user.tenantId,
      req.query.entityType,
      req.query.entityId
    );
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const bulkUploadAttachmentsController = async (req, res, next) => {
  try {
    const { files, entityType, entityId } = req.body;
    
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: 'Files array is required' });
    }
    
    if (!entityType || !entityId) {
      return res.status(400).json({ message: 'entityType and entityId are required' });
    }

    const attachments = await bulkUploadAttachments(
      files, 
      entityType, 
      entityId, 
      req.user.tenantId, 
      req.user.userId
    );

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'CREATE',
      entity: 'ATTACHMENT',
      details: `Bulk uploaded ${attachments.length} files`
    });

    res.status(201).json(attachments);
  } catch (err) {
    next(err);
  }
};
