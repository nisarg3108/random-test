import { create } from 'zustand';
import { hrAPI } from '../api/hr.api';

export const useHRStore = create((set, get) => ({
  // State
  employees: [],
  leaveRequests: [],
  leaveTypes: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Employee actions
  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const response = await hrAPI.getEmployees();
      set({ employees: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addEmployee: async (employeeData) => {
    set({ loading: true, error: null });
    try {
      const response = await hrAPI.createEmployee(employeeData);
      const newEmployee = response.data;
      set(state => ({
        employees: [...state.employees, newEmployee],
        loading: false
      }));
      return newEmployee;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  assignManager: async (employeeId, managerId) => {
    set({ loading: true, error: null });
    try {
      const response = await hrAPI.assignManager({ employeeId, managerId });
      const updatedEmployee = response.data;
      set(state => ({
        employees: state.employees.map(emp => 
          emp.id === employeeId ? updatedEmployee : emp
        ),
        loading: false
      }));
      return updatedEmployee;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Leave Request actions
  fetchLeaveRequests: async () => {
    set({ loading: true, error: null });
    try {
      const response = await hrAPI.getLeaveRequests();
      set({ leaveRequests: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addLeaveRequest: async (requestData) => {
    set({ loading: true, error: null });
    try {
      const response = await hrAPI.createLeaveRequest(requestData);
      const newRequest = response.data;
      set(state => ({
        leaveRequests: [...state.leaveRequests, newRequest],
        loading: false
      }));
      return newRequest;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Leave Type actions
  fetchLeaveTypes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await hrAPI.getLeaveTypes();
      set({ leaveTypes: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addLeaveType: async (typeData) => {
    set({ loading: true, error: null });
    try {
      const response = await hrAPI.createLeaveType(typeData);
      const newType = response.data;
      set(state => ({
        leaveTypes: [...state.leaveTypes, newType],
        loading: false
      }));
      return newType;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset store
  reset: () => set({
    employees: [],
    leaveRequests: [],
    leaveTypes: [],
    loading: false,
    error: null
  })
}));