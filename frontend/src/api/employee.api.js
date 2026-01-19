import { apiClient } from './http.js';

export const employeeAPI = {
  // Employee Dashboard & Profile
  getDashboard: () => apiClient.get('/employees/dashboard'),
  getMyProfile: () => apiClient.get('/employees/my-profile'),

  // Task Management
  getTasks: (params) => apiClient.get('/employees/tasks', { params }),
  updateTaskStatus: (taskId, status) => apiClient.put(`/employees/tasks/${taskId}/status`, { status }),
  createTask: (data) => apiClient.post('/employees/tasks', data),
  getManagerTasks: () => apiClient.get('/employees/manager/tasks'),
  getTeamTasks: () => apiClient.get('/employees/team/tasks'),

  // Salary Information
  getSalary: () => apiClient.get('/employees/salary'),
  createSalaryStructure: (data) => apiClient.post('/employees/salary-structure', data),

  // Work Reports
  createWorkReport: (data) => apiClient.post('/employees/work-reports', data),
  getWorkReports: (params) => apiClient.get('/employees/work-reports', { params }),

  // Notifications
  markNotificationRead: (notificationId) => apiClient.put(`/employees/notifications/${notificationId}/read`),

  // Employee Management (HR/Admin)
  createEmployee: (data) => apiClient.post('/employees', data),
  getEmployees: () => apiClient.get('/employees'),
  assignManager: (data) => apiClient.post('/employees/assign-manager', data),

  // Legacy employee functions
  getMyLeaveRequests: () => apiClient.get('/leave-requests'),
  createLeaveRequest: (data) => apiClient.post('/leave-requests', data),
  getMyExpenseClaims: () => apiClient.get('/expense-claims'),
  createExpenseClaim: (data) => apiClient.post('/expense-claims', data),
  getLeaveTypes: () => apiClient.get('/leave-types'),
  getExpenseCategories: () => apiClient.get('/expense-categories'),
};