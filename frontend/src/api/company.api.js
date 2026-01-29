import { apiClient } from './http';

export const companyAPI = {
  getConfig: () => apiClient.get('/company/config'),
  updateConfig: (data) => apiClient.put('/company/config', data),
  setupCompany: (data) => apiClient.post('/company/setup', data),
  getWorkflowTemplates: (industry) => apiClient.get(`/company/workflow-templates${industry ? `?industry=${industry}` : ''}`),
  createApprovalMatrix: (data) => apiClient.post('/company/approval-matrix', data),
  addCustomField: (data) => apiClient.post('/company/custom-fields', data),
  getTenant: () => apiClient.get('/company/tenant'),
  updateTenant: (data) => apiClient.put('/company/tenant', data)
};