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
  updateLeadController,
  convertLeadController
} from './lead.controller.js';
import {
  createDealController,
  listDealsController,
  updateDealController,
  deleteDealController
} from './deal.controller.js';
import {
  createCommunicationController,
  listCommunicationsController
} from './communication.controller.js';

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
router.put('/leads/:id', requireAuth, requirePermission('crm.lead.update'), updateLeadController);
router.post('/leads/:id/convert', requireAuth, requirePermission('crm.lead.convert'), convertLeadController);

// Deals
router.post('/deals', requireAuth, requirePermission('crm.deal.create'), createDealController);
router.get('/deals', requireAuth, requirePermission('crm.deal.view'), listDealsController);
router.put('/deals/:id', requireAuth, requirePermission('crm.deal.update'), updateDealController);
router.delete('/deals/:id', requireAuth, requirePermission('crm.deal.delete'), deleteDealController);

// Communications
router.post('/communications', requireAuth, requirePermission('crm.communication.create'), createCommunicationController);
router.get('/communications', requireAuth, requirePermission('crm.communication.view'), listCommunicationsController);

export default router;
