import { apiClient } from './http';

export const auditAPI = {
  getAuditLogs: (params) => {
    console.log('API: Fetching audit logs with params:', params);
    return apiClient.get('/audit-logs', { params });
  },
  getAuditLog: (id) => apiClient.get(`/audit-logs/${id}`),
  createTestLog: () => {
    console.log('API: Creating test audit log');
    return apiClient.post('/audit-logs/test', {});
  }
};