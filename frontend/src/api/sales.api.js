import { apiClient } from './http.js';

export const salesAPI = {
  // Quotations
  getQuotations: () => apiClient.get('/sales/quotations'),
  createQuotation: (data) => apiClient.post('/sales/quotations', data),
  updateQuotation: (id, data) => apiClient.put(`/sales/quotations/${id}`, data),
  deleteQuotation: (id) => apiClient.delete(`/sales/quotations/${id}`),

  // Sales Orders
  getSalesOrders: () => apiClient.get('/sales/orders'),
  createSalesOrder: (data) => apiClient.post('/sales/orders', data),
  updateSalesOrder: (id, data) => apiClient.put(`/sales/orders/${id}`, data),
  deleteSalesOrder: (id) => apiClient.delete(`/sales/orders/${id}`),

  // Invoices
  getInvoices: () => apiClient.get('/sales/invoices'),
  createInvoice: (data) => apiClient.post('/sales/invoices', data),
  updateInvoice: (id, data) => apiClient.put(`/sales/invoices/${id}`, data),
  deleteInvoice: (id) => apiClient.delete(`/sales/invoices/${id}`),

  // Tracking
  getTrackings: () => apiClient.get('/sales/trackings'),
  createTracking: (data) => apiClient.post('/sales/trackings', data),
  updateTracking: (id, data) => apiClient.put(`/sales/trackings/${id}`, data),
  deleteTracking: (id) => apiClient.delete(`/sales/trackings/${id}`)
};
