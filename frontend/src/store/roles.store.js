import { create } from 'zustand';
import { rolesAPI } from '../api/roles.api';

export const useRolesStore = create((set, get) => ({
  roles: [],
  permissions: [],
  users: [],
  myPermissions: {
    permissions: [],
    roles: []
  },
  loading: false,
  error: null,
  success: null,

  clearMessages: () => set({ error: null, success: null }),

  fetchRoles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await rolesAPI.getRoles();
      // Backend returns { success: true, data: [...] }, apiClient wraps it in { data: response }
      const rolesData = response.data?.data || response.data || [];
      set({ roles: Array.isArray(rolesData) ? rolesData : [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch roles', loading: false, roles: [] });
    }
  },

  fetchPermissions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await rolesAPI.getPermissions();
      // Backend returns { success: true, data: [...] }, apiClient wraps it in { data: response }
      const permissionsData = response.data?.data || response.data || [];
      set({ permissions: Array.isArray(permissionsData) ? permissionsData : [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch permissions', loading: false, permissions: [] });
    }
  },

  fetchMyPermissions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await rolesAPI.getMyPermissions();
      const myPermsData = response.data?.data || response.data || { permissions: [], roles: [] };
      set({ myPermissions: myPermsData, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch permissions', loading: false });
    }
  },

  fetchUsersWithRoles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await rolesAPI.getUsersWithRoles();
      const usersData = response.data?.data || response.data || [];
      set({ users: Array.isArray(usersData) ? usersData : [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch users', loading: false, users: [] });
    }
  },

  assignRole: async (userId, roleName) => {
    set({ loading: true, error: null, success: null });
    try {
      await rolesAPI.assignRole(userId, roleName);
      set({ 
        loading: false,
        success: `Role ${roleName} assigned successfully`
      });
      // Refresh users list
      get().fetchUsersWithRoles();
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to assign role', loading: false });
      return false;
    }
  },

  removeRole: async (userId, roleName) => {
    set({ loading: true, error: null, success: null });
    try {
      await rolesAPI.removeRole(userId, roleName);
      set({ 
        loading: false,
        success: `Role ${roleName} removed successfully`
      });
      // Refresh users list
      get().fetchUsersWithRoles();
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to remove role', loading: false });
      return false;
    }
  },

  initializeRoles: async () => {
    set({ loading: true, error: null, success: null });
    try {
      await rolesAPI.initializeRoles();
      set({ 
        loading: false,
        success: 'Roles initialized successfully'
      });
      // Refresh roles and permissions
      get().fetchRoles();
      get().fetchPermissions();
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to initialize roles', loading: false });
      return false;
    }
  }
}));