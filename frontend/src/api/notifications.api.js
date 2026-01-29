import { authFetch } from './http.js';

export const notificationAPI = {
  getNotifications: async () => {
    return await authFetch('/notifications');
  },

  markAsRead: async (notificationId) => {
    return await authFetch(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },

  markAllAsRead: async () => {
    return await authFetch('/notifications/mark-all-read', {
      method: 'PUT'
    });
  }
};