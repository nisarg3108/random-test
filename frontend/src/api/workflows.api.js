import { apiClient } from './http';

export const workflowsAPI = {
  getWorkflows: () => apiClient.get('/workflows'),
  createWorkflow: (data) => apiClient.post('/workflows', data),
  updateWorkflow: (id, data) => apiClient.put(`/workflows/${id}`, data),
  deleteWorkflow: (id) => apiClient.delete(`/workflows/${id}`),
  getApprovals: () => apiClient.get('/approvals'),
  approveRequest: (id, data) => apiClient.post(`/approvals/${id}/approve`, data),
  rejectRequest: (id, data) => apiClient.post(`/approvals/${id}/reject`, data)
};