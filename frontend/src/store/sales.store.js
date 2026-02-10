import { create } from 'zustand';
import { salesAPI } from '../api/sales.api';

export const useSalesStore = create((set, get) => ({
  // State
  quotations: [],
  salesOrders: [],
  invoices: [],
  trackings: [],
  loading: false,
  error: null,

  // Quotations
  fetchQuotations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await salesAPI.getQuotations();
      set({ quotations: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createQuotation: async (data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.createQuotation(data);
      await get().fetchQuotations();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateQuotation: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.updateQuotation(id, data);
      await get().fetchQuotations();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteQuotation: async (id) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.deleteQuotation(id);
      await get().fetchQuotations();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Sales Orders
  fetchSalesOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await salesAPI.getSalesOrders();
      set({ salesOrders: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createSalesOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.createSalesOrder(data);
      await get().fetchSalesOrders();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSalesOrder: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.updateSalesOrder(id, data);
      await get().fetchSalesOrders();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSalesOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.deleteSalesOrder(id);
      await get().fetchSalesOrders();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Invoices
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await salesAPI.getInvoices();
      set({ invoices: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createInvoice: async (data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.createInvoice(data);
      await get().fetchInvoices();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateInvoice: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.updateInvoice(id, data);
      await get().fetchInvoices();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.deleteInvoice(id);
      await get().fetchInvoices();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Tracking
  fetchTrackings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await salesAPI.getTrackings();
      set({ trackings: response.data || [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createTracking: async (data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.createTracking(data);
      await get().fetchTrackings();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTracking: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await salesAPI.updateTracking(id, data);
      await get().fetchTrackings();
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Conversions
  convertQuotationToOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await salesAPI.convertQuotationToOrder(id);
      await Promise.all([
        get().fetchQuotations(),
        get().fetchSalesOrders()
      ]);
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  convertOrderToInvoice: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await salesAPI.convertOrderToInvoice(id);
      await Promise.all([
        get().fetchSalesOrders(),
        get().fetchInvoices()
      ]);
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear state
  clearError: () => set({ error: null }),
  
  reset: () => set({
    quotations: [],
    salesOrders: [],
    invoices: [],
    trackings: [],
    loading: false,
    error: null
  })
}));
