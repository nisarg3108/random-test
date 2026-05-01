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

  createRole: async (roleData) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await rolesAPI.createRole(roleData);
      set({ 
        loading: false,
        success: 'Role created successfully'
      });
      get().fetchRoles();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create role';
      set({ error: errorMsg, loading: false });
      return false;
    }
  },

  updateRole: async (roleId, roleData) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await rolesAPI.updateRole(roleId, roleData);
      set({ 
        loading: false,
        success: 'Role updated successfully'
      });
      get().fetchRoles();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update role';
      set({ error: errorMsg, loading: false });
      return false;
    }
  },

  deleteRole: async (roleId) => {
    set({ loading: true, error: null, success: null });
    try {
      await rolesAPI.deleteRole(roleId);
      set({ 
        loading: false,
        success: 'Role deleted successfully'
      });
      get().fetchRoles();
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete role';
      set({ error: errorMsg, loading: false });
      return false;
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
      get().fetchRoles();
      get().fetchPermissions();
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to initialize roles', loading: false });
      return false;
    }
  }
}));