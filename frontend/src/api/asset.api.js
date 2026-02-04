import { apiClient } from './http.js';

export const assetAPI = {
  // ========================================
  // ASSET CATEGORY OPERATIONS
  // ========================================
  createCategory: (data) => apiClient.post('/assets/categories', data),
  getCategories: () => apiClient.get('/assets/categories'),
  getCategoryById: (id) => apiClient.get(`/assets/categories/${id}`),
  updateCategory: (id, data) => apiClient.put(`/assets/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/assets/categories/${id}`),

  // ========================================
  // ASSET OPERATIONS
  // ========================================
  createAsset: (data) => apiClient.post('/assets', data),
  getAssets: (params) => apiClient.get('/assets', { params }),
  getAssetById: (id) => apiClient.get(`/assets/${id}`),
  updateAsset: (id, data) => apiClient.put(`/assets/${id}`, data),
  deleteAsset: (id) => apiClient.delete(`/assets/${id}`),
  getStatistics: () => apiClient.get('/assets/statistics'),

  // ========================================
  // ASSET ALLOCATION OPERATIONS
  // ========================================
  allocateAsset: (data) => apiClient.post('/asset-allocations', data),
  getAllocations: (params) => apiClient.get('/asset-allocations', { params }),
  getAllocationById: (id) => apiClient.get(`/asset-allocations/${id}`),
  updateAllocation: (id, data) => apiClient.put(`/asset-allocations/${id}`, data),
  returnAsset: (id, data) => apiClient.post(`/asset-allocations/${id}/return`, data),
  getMyAllocations: () => apiClient.get('/asset-allocations/my-allocations'),

  // ========================================
  // MAINTENANCE OPERATIONS
  // ========================================
  createMaintenance: (data) => apiClient.post('/asset-maintenance', data),
  getMaintenanceSchedules: (params) => apiClient.get('/asset-maintenance', { params }),
  getMaintenanceById: (id) => apiClient.get(`/asset-maintenance/${id}`),
  updateMaintenance: (id, data) => apiClient.put(`/asset-maintenance/${id}`, data),
  completeMaintenance: (id, data) => apiClient.post(`/asset-maintenance/${id}/complete`, data),
  deleteMaintenance: (id) => apiClient.delete(`/asset-maintenance/${id}`),
  getUpcomingMaintenance: (days = 30) => apiClient.get('/asset-maintenance/upcoming', { params: { days } }),
  getOverdueMaintenance: () => apiClient.get('/asset-maintenance/overdue'),

  // ========================================
  // DEPRECIATION OPERATIONS
  // ========================================
  calculateDepreciation: (assetId, data) => apiClient.post(`/asset-depreciation/calculate/${assetId}`, data),
  calculateAllDepreciation: (data) => apiClient.post('/asset-depreciation/calculate-all', data),
  getDepreciationHistory: (assetId, limit = 12) => apiClient.get(`/asset-depreciation/history/${assetId}`, { params: { limit } }),
  getDepreciationSummary: (params) => apiClient.get('/asset-depreciation/summary', { params }),
  getDepreciationReport: (params) => apiClient.get('/asset-depreciation/report', { params }),
};
