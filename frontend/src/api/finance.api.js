import { apiClient } from './http.js';

// Expense Categories
export const getExpenseCategories = async () => {
  const response = await apiClient.get('/finance/expense-categories');
  return response.data;
};

export const createExpenseCategory = async (categoryData) => {
  const response = await apiClient.post('/finance/expense-categories', categoryData);
  return response.data;
};

// Expense Claims
export const getExpenseClaims = async () => {
  const response = await apiClient.get('/finance/expense-claims');
  return response.data;
};

export const createExpenseClaim = async (claimData) => {
  const response = await apiClient.post('/finance/expense-claims', claimData);
  return response.data;
};

// Finance Dashboard
export const getFinanceDashboard = async () => {
  const response = await apiClient.get('/finance/dashboard');
  return response.data;
};