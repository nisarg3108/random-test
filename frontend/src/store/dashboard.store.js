import { create } from 'zustand';
import { dashboardAPI } from '../api/dashboard.api';
import { wsClient } from '../utils/websocket';

export const useDashboardStore = create((set, get) => ({
  stats: null,
  activities: [],
  dashboardData: null,
  loading: false,
  error: null,
  isRealTimeConnected: false,

  // Initialize real-time connection
  initializeRealTime: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await wsClient.connect(token);
      set({ isRealTimeConnected: true });

      // Subscribe to dashboard stats updates
      wsClient.on('/dashboard/stats', (data) => {
        set({ stats: data });
      });

      // Subscribe to activity updates
      wsClient.on('/dashboard/activities', (data) => {
        const currentActivities = get().activities;
        set({ activities: [data, ...currentActivities.slice(0, 19)] });
      });

    } catch (error) {
      console.error('Failed to initialize real-time connection:', error);
      set({ isRealTimeConnected: false });
    }
  },

  // Disconnect real-time
  disconnectRealTime: () => {
    wsClient.disconnect();
    set({ isRealTimeConnected: false });
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await dashboardAPI.getStats();
      set({ stats: response.data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch stats', loading: false });
    }
  },

  fetchActivities: async () => {
    set({ loading: true, error: null });
    try {
      const response = await dashboardAPI.getRecentActivities();
      set({ activities: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch activities', loading: false });
    }
  },

  fetchUserDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await dashboardAPI.getUserDashboard();
      set({ dashboardData: response.data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch dashboard', loading: false });
    }
  },

  fetchManagerDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await dashboardAPI.getManagerDashboard();
      set({ dashboardData: response.data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch dashboard', loading: false });
    }
  },

  fetchAdminDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = await dashboardAPI.getAdminDashboard();
      set({ dashboardData: response.data, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch dashboard', loading: false });
    }
  },

  // Update stats in real-time
  updateStats: (newStats) => {
    set({ stats: newStats });
  },

  // Add new activity in real-time
  addActivity: (activity) => {
    const currentActivities = get().activities;
    set({ activities: [activity, ...currentActivities.slice(0, 19)] });
  }
}));