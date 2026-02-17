import { apiClient } from './http.js';

export const getCurrentSubscription = async () => {
  const response = await apiClient.get('/billing/subscription');
  return response.data;
};

export const getAvailablePlans = async () => {
  const response = await apiClient.get('/billing/plans');
  return response.data;
};

export const changeSubscriptionPlan = async (planId, provider = 'STRIPE') => {
  const response = await apiClient.post('/billing/subscription/change-plan', {
    planId,
    provider,
  });
  return response.data;
};

export const cancelSubscription = async (atPeriodEnd = true) => {
  const response = await apiClient.post('/billing/subscription/cancel', {
    atPeriodEnd,
  });
  return response.data;
};

export const getPaymentHistory = async (params = {}) => {
  const response = await apiClient.get('/billing/payments', { params });
  return response.data;
};

export const getBillingEvents = async (params = {}) => {
  const response = await apiClient.get('/billing/events', { params });
  return response.data;
};

export const getBillingMetrics = async () => {
  const response = await apiClient.get('/billing/metrics');
  return response.data;
};

/**
 * Invoice API Functions
 */

export const getInvoices = async () => {
  const response = await apiClient.get('/billing/invoices');
  return response.data;
};

export const getInvoiceByPaymentId = async (paymentId) => {
  const response = await apiClient.get(`/billing/invoices/${paymentId}`);
  return response.data;
};

export const downloadInvoice = async (paymentId) => {
  const response = await apiClient.get(`/billing/invoices/${paymentId}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

export const resendInvoiceEmail = async (paymentId) => {
  const response = await apiClient.post(`/billing/invoices/${paymentId}/resend`);
  return response.data;
};

