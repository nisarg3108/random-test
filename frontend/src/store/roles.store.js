import { create } from 'zustand';
import { rolesAPI } from '../api/roles.api';

export const useRolesStore = create((set, get) => ({
  roles: [],
  permissions: [],
  loading: false,
  error: null,
  success: null,

  clearMessages: () => set({ error: null, success: null }),

  fetchRoles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await rolesAPI.getRoles();
      set({ roles: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch roles', loading: false, roles: [] });
    }
  },

  fetchPermissions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await rolesAPI.getPermissions();
      set({ permissions: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch permissions', loading: false, permissions: [] });
    }
  },

  createRole: async (data) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await rolesAPI.createRole(data);
      set(state => ({ 
        roles: [...state.roles, response.data], 
        loading: false,
        success: 'Role created successfully'
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to create role', loading: false });
      return false;
    }
  },

  updateRole: async (id, data) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await rolesAPI.updateRole(id, data);
      set(state => ({
        roles: state.roles.map(role => role.id === id ? response.data : role),
        loading: false,
        success: 'Role updated successfully'
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to update role', loading: false });
      return false;
    }
  },

  deleteRole: async (id) => {
    set({ loading: true, error: null, success: null });
    try {
      await rolesAPI.deleteRole(id);
      set(state => ({
        roles: state.roles.filter(role => role.id !== id),
        loading: false,
        success: 'Role deleted successfully'
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to delete role', loading: false });
      return false;
    }
  },

  updateRolePermissions: async (roleId, permissionIds) => {
    set({ loading: true, error: null, success: null });
    try {
      const response = await rolesAPI.updateRole(roleId, { permissions: permissionIds });
      set(state => ({
        roles: state.roles.map(role => role.id === roleId ? response.data : role),
        loading: false,
        success: 'Permissions updated successfully'
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to update permissions', loading: false });
      return false;
    }
  }
}));