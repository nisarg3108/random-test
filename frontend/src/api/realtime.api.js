import { apiClient } from './http';

export const realtimeAPI = {
  testDashboardStats: () => apiClient.post('/realtime/test/dashboard-stats'),
  testActivity: () => apiClient.post('/realtime/test/activity')
};