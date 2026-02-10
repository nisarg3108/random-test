import { apiClient } from './http';

export const crmAPI = {
  // Customers
  getCustomers: (params = {}) => apiClient.get('/crm/customers', { params }),
  getCustomer: (id) => apiClient.get(`/crm/customers/${id}`),
  createCustomer: (data) => apiClient.post('/crm/customers', data),
  updateCustomer: (id, data) => apiClient.put(`/crm/customers/${id}`, data),
  deleteCustomer: (id) => apiClient.delete(`/crm/customers/${id}`),

  // Contacts
  getContacts: (params = {}) => apiClient.get('/crm/contacts', { params }),
  getContact: (id) => apiClient.get(`/crm/contacts/${id}`),
  createContact: (data) => apiClient.post('/crm/contacts', data),
  updateContact: (id, data) => apiClient.put(`/crm/contacts/${id}`, data),
  deleteContact: (id) => apiClient.delete(`/crm/contacts/${id}`),

  // Leads
  getLeads: (params = {}) => apiClient.get('/crm/leads', { params }),
  getLead: (id) => apiClient.get(`/crm/leads/${id}`),
  createLead: (data) => apiClient.post('/crm/leads', data),
  updateLead: (id, data) => apiClient.put(`/crm/leads/${id}`, data),
  convertLead: (id, data = {}) => apiClient.post(`/crm/leads/${id}/convert`, data),

  // Deals
  getDeals: (params = {}) => apiClient.get('/crm/deals', { params }),
  getDeal: (id) => apiClient.get(`/crm/deals/${id}`),
  createDeal: (data) => apiClient.post('/crm/deals', data),
  updateDeal: (id, data) => apiClient.put(`/crm/deals/${id}`, data),
  deleteDeal: (id) => apiClient.delete(`/crm/deals/${id}`),

  // Communications
  getCommunications: (params = {}) => apiClient.get('/crm/communications', { params }),
  createCommunication: (data) => apiClient.post('/crm/communications', data),

  // Pipelines
  getPipelines: (params = {}) => apiClient.get('/crm/pipelines', { params }),
  getPipeline: (id) => apiClient.get(`/crm/pipelines/${id}`),
  getDefaultPipeline: () => apiClient.get('/crm/pipelines/default'),
  createPipeline: (data) => apiClient.post('/crm/pipelines', data),
  updatePipeline: (id, data) => apiClient.put(`/crm/pipelines/${id}`, data),
  deletePipeline: (id) => apiClient.delete(`/crm/pipelines/${id}`),

  // Pipeline Stages
  createPipelineStage: (pipelineId, data) => apiClient.post(`/crm/pipelines/${pipelineId}/stages`, data),
  updatePipelineStage: (stageId, data) => apiClient.put(`/crm/stages/${stageId}`, data),
  deletePipelineStage: (stageId) => apiClient.delete(`/crm/stages/${stageId}`),
  reorderPipelineStages: (pipelineId, stageOrders) => apiClient.post(`/crm/pipelines/${pipelineId}/stages/reorder`, { stageOrders }),

  // Activities
  getActivities: (params = {}) => apiClient.get('/crm/activities', { params }),
  getActivity: (id) => apiClient.get(`/crm/activities/${id}`),
  getMyActivities: (params = {}) => apiClient.get('/crm/activities/my', { params }),
  getOverdueActivities: (params = {}) => apiClient.get('/crm/activities/overdue', { params }),
  getUpcomingActivities: (params = {}) => apiClient.get('/crm/activities/upcoming', { params }),
  createActivity: (data) => apiClient.post('/crm/activities', data),
  updateActivity: (id, data) => apiClient.put(`/crm/activities/${id}`, data),
  completeActivity: (id, data) => apiClient.post(`/crm/activities/${id}/complete`, data),
  deleteActivity: (id) => apiClient.delete(`/crm/activities/${id}`),

  // Attachments
  getAttachments: (params = {}) => apiClient.get('/crm/attachments', { params }),
  getAttachment: (id) => apiClient.get(`/crm/attachments/${id}`),
  getAttachmentsByEntity: (entityType, entityId) => apiClient.get(`/crm/attachments/${entityType}/${entityId}`),
  getAttachmentStats: (params = {}) => apiClient.get('/crm/attachments/stats', { params }),
  createAttachment: (data) => apiClient.post('/crm/attachments', data),
  bulkUploadAttachments: (data) => apiClient.post('/crm/attachments/bulk', data),
  updateAttachment: (id, data) => apiClient.put(`/crm/attachments/${id}`, data),
  deleteAttachment: (id) => apiClient.delete(`/crm/attachments/${id}`)
};
