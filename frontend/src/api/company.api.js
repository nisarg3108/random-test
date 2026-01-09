import { apiClient } from './http';

export const companyAPI = {
  getConfig: () => apiClient.get('/company/config'),
  updateConfig: (data) => apiClient.put('/company/config', data),
  getTenant: () => apiClient.get('/company/tenant'),
  updateTenant: (data) => apiClient.put('/company/tenant', data)
};