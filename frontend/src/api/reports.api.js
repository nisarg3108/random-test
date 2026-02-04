import { apiClient } from './http.js';

// Financial Reports
export const getProfitLossReport = async (startDate, endDate) => {
  const response = await apiClient.get('/reports/financial/profit-loss', {
    params: { startDate, endDate },
  });
  return response.data;
};

export const getBalanceSheetReport = async (asOfDate) => {
  const response = await apiClient.get('/reports/financial/balance-sheet', {
    params: { asOfDate },
  });
  return response.data;
};

// HR Reports
export const getHRAnalyticsReport = async (startDate, endDate) => {
  const response = await apiClient.get('/reports/hr/analytics', {
    params: { startDate, endDate },
  });
  return response.data;
};

// Inventory Reports
export const getInventoryReport = async () => {
  const response = await apiClient.get('/reports/inventory');
  return response.data;
};

// Custom Reports
export const executeCustomReport = async (config) => {
  const response = await apiClient.post('/reports/custom/execute', { config });
  return response.data;
};

// Report Templates
export const createReportTemplate = async (templateData) => {
  const response = await apiClient.post('/reports/templates', templateData);
  return response.data;
};

export const getReportTemplates = async (type = null) => {
  const response = await apiClient.get('/reports/templates', {
    params: { type },
  });
  return response.data;
};

export const getReportTemplate = async (id) => {
  const response = await apiClient.get(`/reports/templates/${id}`);
  return response.data;
};

// Saved Reports
export const saveReport = async (reportData) => {
  const response = await apiClient.post('/reports/saved', reportData);
  return response.data;
};

export const getSavedReports = async (type = null) => {
  const response = await apiClient.get('/reports/saved', {
    params: { type },
  });
  return response.data;
};

export const getSavedReport = async (id) => {
  const response = await apiClient.get(`/reports/saved/${id}`);
  return response.data;
};

// Export Reports
export const exportReport = async (params) => {
  const response = await apiClient.get('/reports/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

export const exportCustomReport = async (config, format, reportName) => {
  const response = await apiClient.post(
    '/reports/export',
    { config },
    {
      params: { format, reportType: 'custom', reportName },
      responseType: 'blob',
    }
  );
  return response.data;
};
