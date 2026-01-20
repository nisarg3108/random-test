import { apiClient } from './http';

export const notificationAPI = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/mark-all-read');
    return response.data;
  }
};