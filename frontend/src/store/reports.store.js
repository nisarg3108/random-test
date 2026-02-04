import { create } from 'zustand';
import * as reportsApi from '../api/reports.api.js';

export const useReportsStore = create((set, get) => ({
  // State
  reportData: null,
  templates: [],
  savedReports: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Financial Reports
  generateProfitLossReport: async (startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getProfitLossReport(startDate, endDate);
      set({ reportData: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  generateBalanceSheetReport: async (asOfDate) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getBalanceSheetReport(asOfDate);
      set({ reportData: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // HR Reports
  generateHRAnalyticsReport: async (startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getHRAnalyticsReport(startDate, endDate);
      set({ reportData: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Inventory Reports
  generateInventoryReport: async () => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getInventoryReport();
      set({ reportData: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Custom Reports
  executeCustomReport: async (config) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.executeCustomReport(config);
      set({ reportData: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Report Templates
  fetchTemplates: async (type = null) => {
    set({ loading: true, error: null });
    try {
      const templates = await reportsApi.getReportTemplates(type);
      set({ templates, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createTemplate: async (templateData) => {
    set({ loading: true, error: null });
    try {
      const newTemplate = await reportsApi.createReportTemplate(templateData);
      set((state) => ({
        templates: [...state.templates, newTemplate],
        loading: false,
      }));
      return newTemplate;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Saved Reports
  fetchSavedReports: async (type = null) => {
    set({ loading: true, error: null });
    try {
      const reports = await reportsApi.getSavedReports(type);
      set({ savedReports: reports, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  saveReport: async (reportData) => {
    set({ loading: true, error: null });
    try {
      const saved = await reportsApi.saveReport(reportData);
      set((state) => ({
        savedReports: [saved, ...state.savedReports],
        loading: false,
      }));
      return saved;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Export
  exportReport: async (params) => {
    set({ loading: true, error: null });
    try {
      const blob = await reportsApi.exportReport(params);
      set({ loading: false });
      return blob;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  exportCustomReport: async (config, format, reportName) => {
    set({ loading: true, error: null });
    try {
      const blob = await reportsApi.exportCustomReport(config, format, reportName);
      set({ loading: false });
      return blob;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Reset
  reset: () =>
    set({
      reportData: null,
      templates: [],
      savedReports: [],
      loading: false,
      error: null,
    }),
}));
