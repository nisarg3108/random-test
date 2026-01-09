import { apiClient } from './http';

export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getRecentActivities: () => apiClient.get('/dashboard/activities'),
  getUserDashboard: () => apiClient.get('/dashboard/user'),
  getManagerDashboard: () => apiClient.get('/dashboard/manager'),
  getAdminDashboard: () => apiClient.get('/dashboard/admin')
};