import { create } from 'zustand';
import { crmAPI } from '../api/crm.api';

export const useCRMStore = create((set, get) => ({
  customers: [],
  contacts: [],
  leads: [],
  deals: [],
  communications: [],
  pipelines: [],
  activities: [],
  attachments: [],
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchCustomers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getCustomers(params);
      set({ customers: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchContacts: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getContacts(params);
      set({ contacts: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchLeads: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getLeads(params);
      set({ leads: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchDeals: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getDeals(params);
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
  },

  fetchPipelines: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getPipelines(params);
      set({ pipelines: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchActivities: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getActivities(params);
      set({ activities: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMyActivities: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getMyActivities(params);
      set({ activities: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAttachments: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await crmAPI.getAttachments(params);
      set({ attachments: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
