import { create } from 'zustand';
import { rolesAPI } from '../api/roles.api';

export const useRolesStore = create((set) => ({
  roles: [],
  permissions: [],
  loading: false,
  error: null,

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
    set({ loading: true, error: null });
    try {
      const response = await rolesAPI.createRole(data);
      set(state => ({ 
        roles: [...state.roles, response.data], 
        loading: false 
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to create role', loading: false });
      return false;
    }
  }
}));