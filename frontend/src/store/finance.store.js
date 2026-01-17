import { create } from 'zustand';
import * as financeApi from '../api/finance.api.js';

export const useFinanceStore = create((set, get) => ({
  // State
  expenseCategories: [],
  expenseClaims: [],
  dashboardData: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Expense Categories
  fetchExpenseCategories: async () => {
    set({ loading: true, error: null });
    try {
      const categories = await financeApi.getExpenseCategories();
      set({ expenseCategories: categories, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createExpenseCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      const newCategory = await financeApi.createExpenseCategory(categoryData);
      set(state => ({
        expenseCategories: [...state.expenseCategories, newCategory],
        loading: false
      }));
      return newCategory;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Expense Claims
  fetchExpenseClaims: async () => {
    set({ loading: true, error: null });
    try {
      const claims = await financeApi.getExpenseClaims();
      set({ expenseClaims: claims, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createExpenseClaim: async (claimData) => {
    set({ loading: true, error: null });
    try {
      const newClaim = await financeApi.createExpenseClaim(claimData);
      set(state => ({
        expenseClaims: [...state.expenseClaims, newClaim],
        loading: false
      }));
      return newClaim;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Dashboard
  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const data = await financeApi.getFinanceDashboard();
      set({ dashboardData: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Reset
  reset: () => set({
    expenseCategories: [],
    expenseClaims: [],
    dashboardData: null,
    loading: false,
    error: null
  })
}));