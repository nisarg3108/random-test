import { apiClient } from './http.js';

export const salesAPI = {
  // Quotations
  getQuotations: () => apiClient.get('/sales/quotations'),
  createQuotation: (data) => apiClient.post('/sales/quotations', data),
  updateQuotation: (id, data) => apiClient.put(`/sales/quotations/${id}`, data),
  deleteQuotation: (id) => apiClient.delete(`/sales/quotations/${id}`),
  convertQuotationToOrder: (id) => apiClient.post(`/sales/quotations/${id}/convert-to-order`),

  // Sales Orders
  getSalesOrders: () => apiClient.get('/sales/orders'),
  createSalesOrder: (data) => apiClient.post('/sales/orders', data),
  updateSalesOrder: (id, data) => apiClient.put(`/sales/orders/${id}`, data),
  deleteSalesOrder: (id) => apiClient.delete(`/sales/orders/${id}`),
  convertOrderToInvoice: (id) => apiClient.post(`/sales/orders/${id}/convert-to-invoice`),

  // Invoices
  getInvoices: () => apiClient.get('/sales/invoices'),
  createInvoice: (data) => apiClient.post('/sales/invoices', data),
  updateInvoice: (id, data) => apiClient.put(`/sales/invoices/${id}`, data),
  deleteInvoice: (id) => apiClient.delete(`/sales/invoices/${id}`),

  // Invoice Payments
  getInvoicePayments: (invoiceId) => apiClient.get(`/sales/invoices/${invoiceId}/payments`),
  createInvoicePayment: (invoiceId, data) => apiClient.post(`/sales/invoices/${invoiceId}/payments`, data),
  updateInvoicePayment: (id, data) => apiClient.put(`/sales/payments/${id}`, data),
  deleteInvoicePayment: (id) => apiClient.delete(`/sales/payments/${id}`),

  // Tracking
  getTrackings: () => apiClient.get('/sales/trackings'),
  createTracking: (data) => apiClient.post('/sales/trackings', data),
  updateTracking: (id, data) => apiClient.put(`/sales/trackings/${id}`, data),
  deleteTracking: (id) => apiClient.delete(`/sales/trackings/${id}`),

  // Analytics
  getSalesAnalytics: (params) => apiClient.get('/sales/analytics', { params }),
  getRevenueMetrics: (params) => apiClient.get('/sales/analytics/revenue', { params }),
  getPaymentAnalytics: (params) => apiClient.get('/sales/analytics/payments', { params }),
  
  // Export
  exportPDF: (params) => apiClient.get('/sales/analytics/export/pdf', { 
    params, 
    responseType: 'blob' 
  }),
  exportCSV: (params) => apiClient.get('/sales/analytics/export/csv', { 
    params, 
    responseType: 'blob' 
  }),
  exportExcel: (params) => apiClient.get('/sales/analytics/export/excel', { 
    params, 
    responseType: 'blob' 
  }),
  
  // Email Reports
  emailReport: (data, params) => apiClient.post('/sales/analytics/email', data, { params }),
  scheduleReport: (data) => apiClient.post('/sales/analytics/schedule', data),
  cancelScheduledReport: (schedule) => apiClient.delete(`/sales/analytics/schedule/${schedule}`),
  
  // Forecasting
  getRevenueForecast: (params) => apiClient.get('/sales/analytics/forecast', { params })
};
