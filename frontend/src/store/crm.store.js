import { create } from 'zustand';
import { crmAPI } from '../api/crm.api';

export const useCRMStore = create((set, get) => ({
  customers: [],
  contacts: [],
  leads: [],
  deals: [],
  communications: [],
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getCustomers();
      set({ customers: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getContacts();
      set({ contacts: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchLeads: async () => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getLeads();
      set({ leads: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchDeals: async () => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getDeals();
      set({ deals: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCommunications: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getCommunications(params);
      set({ communications: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
