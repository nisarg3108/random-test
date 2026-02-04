import { apiClient } from './http.js';

export const projectAPI = {
  // Dashboard
  getDashboard: () => apiClient.get('/projects/dashboard'),

  // Project CRUD
  createProject: (data) => apiClient.post('/projects', data),
  getProjects: (params) => apiClient.get('/projects', { params }),
  getProjectById: (id) => apiClient.get(`/projects/${id}`),
  updateProject: (id, data) => apiClient.put(`/projects/${id}`, data),
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),

  // Milestones
  createMilestone: (data) => apiClient.post('/projects/milestones', data),
  getMilestones: (projectId) => apiClient.get(`/projects/${projectId}/milestones`),
  updateMilestone: (id, data) => apiClient.put(`/projects/milestones/${id}`, data),
  deleteMilestone: (id) => apiClient.delete(`/projects/milestones/${id}`),

  // Resources
  allocateResource: (data) => apiClient.post('/projects/resources', data),
  getResources: (projectId) => apiClient.get(`/projects/${projectId}/resources`),
  updateResource: (id, data) => apiClient.put(`/projects/resources/${id}`, data),
  deleteResource: (id) => apiClient.delete(`/projects/resources/${id}`),

  // Budget
  createBudget: (data) => apiClient.post('/projects/budgets', data),
  getBudgets: (projectId) => apiClient.get(`/projects/${projectId}/budgets`),
  updateBudget: (id, data) => apiClient.put(`/projects/budgets/${id}`, data),
  deleteBudget: (id) => apiClient.delete(`/projects/budgets/${id}`),

  // Time Tracking
  logTime: (data) => apiClient.post('/projects/time-logs', data),
  getTimeLogs: (projectId, params) => apiClient.get(`/projects/${projectId}/time-logs`, { params }),
  updateTimeLog: (id, data) => apiClient.put(`/projects/time-logs/${id}`, data),
  deleteTimeLog: (id) => apiClient.delete(`/projects/time-logs/${id}`),
};
