import { apiClient } from './http.js';

const payrollAPI = {
  // ==========================================
  // SALARY COMPONENTS
  // ==========================================
  createSalaryComponent: (data) => apiClient.post('/payroll/components', data),
  getSalaryComponents: (params) => apiClient.get('/payroll/components', { params }),
  updateSalaryComponent: (id, data) => apiClient.put(`/payroll/components/${id}`, data),

  // ==========================================
  // TAX CONFIGURATION
  // ==========================================
  createTaxConfiguration: (data) => apiClient.post('/payroll/tax-config', data),
  getTaxConfigurations: () => apiClient.get('/payroll/tax-config'),
  calculateTax: (data) => apiClient.post('/payroll/tax-config/calculate', data),

  // ==========================================
  // PAYROLL CYCLES
  // ==========================================
  createPayrollCycle: (data) => apiClient.post('/payroll/cycles', data),
  getPayrollCycles: (params) => apiClient.get('/payroll/cycles', { params }),
  getPayrollCycle: (id) => apiClient.get(`/payroll/cycles/${id}`),
  generatePayslips: (cycleId) => apiClient.post(`/payroll/cycles/${cycleId}/generate-payslips`),
  createDisbursements: (cycleId) => apiClient.post(`/payroll/cycles/${cycleId}/disbursements`),

  // ==========================================
  // PAYSLIPS
  // ==========================================
  getPayslips: (params) => apiClient.get('/payroll/payslips', { params }),
  getPayslip: (id) => apiClient.get(`/payroll/payslips/${id}`),
  approvePayslip: (id) => apiClient.post(`/payroll/payslips/${id}/approve`),

  // ==========================================
  // DISBURSEMENTS
  // ==========================================
  createDisbursements: (data) => apiClient.post('/hr/disbursements', data),
  getDisbursements: (params) => apiClient.get('/hr/disbursements', { params }),
  getDisbursement: (id) => apiClient.get(`/hr/disbursements/${id}`),
  getDisbursementStats: (params) => apiClient.get('/hr/disbursements/stats', { params }),
  updateDisbursementStatus: (id, data) => apiClient.patch(`/hr/disbursements/${id}/status`, data),
  bulkUpdateDisbursementStatus: (data) => apiClient.patch('/hr/disbursements/bulk-status', data),
  generatePaymentFile: (data) => apiClient.post('/hr/disbursements/generate-payment-file', data),
  reconcilePayments: (data) => apiClient.post('/hr/disbursements/reconcile', data),

  // ==========================================
  // REPORTS
  // ==========================================
  getPayrollSummary: (params) => apiClient.get('/payroll/reports/summary', { params }),
};

export default payrollAPI;
