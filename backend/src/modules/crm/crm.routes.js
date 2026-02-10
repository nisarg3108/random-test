import { Router } from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import { requirePermission } from '../../core/rbac/permission.middleware.js';
import {
  createCustomerController,
  listCustomersController,
  getCustomerController,
  updateCustomerController,
  deleteCustomerController
} from './customer.controller.js';
import {
  createContactController,
  listContactsController,
  getContactController,
  updateContactController,
  deleteContactController
} from './contact.controller.js';
import {
  createLeadController,
  listLeadsController,
  getLeadController,
  updateLeadController,
  convertLeadController
} from './lead.controller.js';
import {
  createDealController,
  listDealsController,
  getDealController,
  updateDealController,
  deleteDealController
} from './deal.controller.js';
import {
  createCommunicationController,
  listCommunicationsController
} from './communication.controller.js';
import {
  createPipelineController,
  listPipelinesController,
  getPipelineController,
  getDefaultPipelineController,
  updatePipelineController,
  deletePipelineController,
  createPipelineStageController,
  updatePipelineStageController,
  deletePipelineStageController,
  reorderPipelineStagesController
} from './pipeline.controller.js';
import {
  createActivityController,
  listActivitiesController,
  getActivityController,
  updateActivityController,
  deleteActivityController,
  completeActivityController,
  getMyActivitiesController,
  getOverdueActivitiesController,
  getUpcomingActivitiesController
} from './activity.controller.js';
import {
  createAttachmentController,
  listAttachmentsController,
  getAttachmentController,
  updateAttachmentController,
  deleteAttachmentController,
  getAttachmentsByEntityController,
  getAttachmentStatsController,
  bulkUploadAttachmentsController
} from './attachment.controller.js';

const router = Router();

// Customers
router.post('/customers', requireAuth, requirePermission('crm.customer.create'), createCustomerController);
router.get('/customers', requireAuth, requirePermission('crm.customer.view'), listCustomersController);
router.get('/customers/:id', requireAuth, requirePermission('crm.customer.view'), getCustomerController);
router.put('/customers/:id', requireAuth, requirePermission('crm.customer.update'), updateCustomerController);
router.delete('/customers/:id', requireAuth, requirePermission('crm.customer.delete'), deleteCustomerController);

// Contacts
router.post('/contacts', requireAuth, requirePermission('crm.contact.create'), createContactController);
router.get('/contacts', requireAuth, requirePermission('crm.contact.view'), listContactsController);
router.get('/contacts/:id', requireAuth, requirePermission('crm.contact.view'), getContactController);
router.put('/contacts/:id', requireAuth, requirePermission('crm.contact.update'), updateContactController);
router.delete('/contacts/:id', requireAuth, requirePermission('crm.contact.delete'), deleteContactController);

// Leads
router.post('/leads', requireAuth, requirePermission('crm.lead.create'), createLeadController);
router.get('/leads', requireAuth, requirePermission('crm.lead.view'), listLeadsController);
router.get('/leads/:id', requireAuth, requirePermission('crm.lead.view'), getLeadController);
router.put('/leads/:id', requireAuth, requirePermission('crm.lead.update'), updateLeadController);
router.post('/leads/:id/convert', requireAuth, requirePermission('crm.lead.convert'), convertLeadController);

// Deals
router.post('/deals', requireAuth, requirePermission('crm.deal.create'), createDealController);
router.get('/deals', requireAuth, requirePermission('crm.deal.view'), listDealsController);
router.get('/deals/:id', requireAuth, requirePermission('crm.deal.view'), getDealController);
router.put('/deals/:id', requireAuth, requirePermission('crm.deal.update'), updateDealController);
router.delete('/deals/:id', requireAuth, requirePermission('crm.deal.delete'), deleteDealController);

// Communications
router.post('/communications', requireAuth, requirePermission('crm.communication.create'), createCommunicationController);
router.get('/communications', requireAuth, requirePermission('crm.communication.view'), listCommunicationsController);

// Pipelines
router.post('/pipelines', requireAuth, requirePermission('crm.pipeline.create'), createPipelineController);
router.get('/pipelines', requireAuth, requirePermission('crm.pipeline.view'), listPipelinesController);
router.get('/pipelines/default', requireAuth, requirePermission('crm.pipeline.view'), getDefaultPipelineController);
router.get('/pipelines/:id', requireAuth, requirePermission('crm.pipeline.view'), getPipelineController);
router.put('/pipelines/:id', requireAuth, requirePermission('crm.pipeline.update'), updatePipelineController);
router.delete('/pipelines/:id', requireAuth, requirePermission('crm.pipeline.delete'), deletePipelineController);

// Pipeline Stages
router.post('/pipelines/:pipelineId/stages', requireAuth, requirePermission('crm.pipeline.update'), createPipelineStageController);
router.put('/stages/:stageId', requireAuth, requirePermission('crm.pipeline.update'), updatePipelineStageController);
router.delete('/stages/:stageId', requireAuth, requirePermission('crm.pipeline.update'), deletePipelineStageController);
router.post('/pipelines/:pipelineId/stages/reorder', requireAuth, requirePermission('crm.pipeline.update'), reorderPipelineStagesController);

// Activities
router.post('/activities', requireAuth, requirePermission('crm.activity.create'), createActivityController);
router.get('/activities', requireAuth, requirePermission('crm.activity.view'), listActivitiesController);
router.get('/activities/my', requireAuth, requirePermission('crm.activity.view'), getMyActivitiesController);
router.get('/activities/overdue', requireAuth, requirePermission('crm.activity.view'), getOverdueActivitiesController);
router.get('/activities/upcoming', requireAuth, requirePermission('crm.activity.view'), getUpcomingActivitiesController);
router.get('/activities/:id', requireAuth, requirePermission('crm.activity.view'), getActivityController);
router.put('/activities/:id', requireAuth, requirePermission('crm.activity.update'), updateActivityController);
router.post('/activities/:id/complete', requireAuth, requirePermission('crm.activity.update'), completeActivityController);
router.delete('/activities/:id', requireAuth, requirePermission('crm.activity.delete'), deleteActivityController);

// Attachments
router.post('/attachments', requireAuth, requirePermission('crm.attachment.create'), createAttachmentController);
router.post('/attachments/bulk', requireAuth, requirePermission('crm.attachment.create'), bulkUploadAttachmentsController);
router.get('/attachments', requireAuth, requirePermission('crm.attachment.view'), listAttachmentsController);
router.get('/attachments/stats', requireAuth, requirePermission('crm.attachment.view'), getAttachmentStatsController);
router.get('/attachments/:entityType/:entityId', requireAuth, requirePermission('crm.attachment.view'), getAttachmentsByEntityController);
router.get('/attachments/:id', requireAuth, requirePermission('crm.attachment.view'), getAttachmentController);
router.put('/attachments/:id', requireAuth, requirePermission('crm.attachment.update'), updateAttachmentController);
router.delete('/attachments/:id', requireAuth, requirePermission('crm.attachment.delete'), deleteAttachmentController);

export default router;
