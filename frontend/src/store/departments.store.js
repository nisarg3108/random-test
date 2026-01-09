import { create } from 'zustand';
import { departmentsAPI } from '../api/departments.api';

export const useDepartmentsStore = create((set) => ({
  departments: [],
  loading: false,
  error: null,

  fetchDepartments: async () => {
    set({ loading: true, error: null });
    try {
      const response = await departmentsAPI.getDepartments();
      set({ departments: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch departments', loading: false, departments: [] });
    }
  },

  addDepartment: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await departmentsAPI.createDepartment(data);
      set(state => ({ 
        departments: [...state.departments, response.data], 
        loading: false 
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to add department', loading: false });
      return false;
    }
  },

  updateDepartment: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await departmentsAPI.updateDepartment(id, data);
      set(state => ({
        departments: state.departments.map(dept => 
          dept.id === id ? response.data : dept
        ),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to update department', loading: false });
      return false;
    }
  },

  deleteDepartment: async (id) => {
    set({ loading: true, error: null });
    try {
      await departmentsAPI.deleteDepartment(id);
      set(state => ({
        departments: state.departments.filter(dept => dept.id !== id),
        loading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.message || 'Failed to delete department', loading: false });
      return false;
    }
  }
}));