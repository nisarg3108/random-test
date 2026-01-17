import { apiClient } from './http';

export const hrAPI = {
  // Employee APIs
  getEmployees: () => apiClient.get('/employees'),
  createEmployee: (data) => apiClient.post('/employees', data),
  assignManager: (data) => apiClient.post('/employees/assign-manager', data),

  // Leave Request APIs
  getLeaveRequests: () => apiClient.get('/leave-requests'),
  createLeaveRequest: (data) => apiClient.post('/leave-requests', data),

  // Leave Type APIs
  getLeaveTypes: () => apiClient.get('/leave-types'),
  createLeaveType: (data) => apiClient.post('/leave-types', data)
};