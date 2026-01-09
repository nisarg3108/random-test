import { apiClient } from './http';

export const auditAPI = {
  getAuditLogs: (params) => apiClient.get('/audit-logs', { params }),
  getAuditLog: (id) => apiClient.get(`/audit-logs/${id}`)
};