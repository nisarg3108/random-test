import { apiClient } from './http.js';

// ==================== DOCUMENT API ====================

export const documentAPI = {
  // Document CRUD
  createDocument: (data) => apiClient.post('/documents', data),
  listDocuments: (params) => apiClient.get('/documents', { params }),
  getDocument: (id) => apiClient.get(`/documents/${id}`),
  updateDocument: (id, data) => apiClient.put(`/documents/${id}`, data),
  deleteDocument: (id, permanent = false) => apiClient.delete(`/documents/${id}`, { params: { permanent } }),
  restoreDocument: (id) => apiClient.post(`/documents/${id}/restore`),
  
  // File Upload & Download
  uploadDocument: (formData, onUploadProgress) => 
    apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress
    }),
  downloadDocument: (id) => 
    apiClient.get(`/documents/${id}/download`, { responseType: 'blob' }),
  
  // Version Control
  createVersion: (id, formData) => 
    apiClient.post(`/documents/${id}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getVersions: (id) => apiClient.get(`/documents/${id}/versions`),
  revertToVersion: (id, versionNumber) => 
    apiClient.post(`/documents/${id}/versions/${versionNumber}/revert`),
  downloadVersion: (id, versionNumber) => 
    apiClient.get(`/documents/${id}/versions/${versionNumber}/download`, { responseType: 'blob' }),
  
  // Activity
  getActivities: (id, params) => apiClient.get(`/documents/${id}/activities`, { params }),
  
  // Statistics
  getStatistics: () => apiClient.get('/documents/statistics'),
};

// ==================== FOLDER API ====================

export const folderAPI = {
  createFolder: (data) => apiClient.post('/documents/folders', data),
  listFolders: (params) => apiClient.get('/documents/folders', { params }),
  getFolder: (id) => apiClient.get(`/documents/folders/${id}`),
  updateFolder: (id, data) => apiClient.put(`/documents/folders/${id}`, data),
  deleteFolder: (id, permanent = false) => 
    apiClient.delete(`/documents/folders/${id}`, { params: { permanent } }),
  setPermissions: (id, permissions) => 
    apiClient.post(`/documents/folders/${id}/permissions`, { permissions }),
};

// ==================== SHARING API ====================

export const shareAPI = {
  createShare: (documentId, data) => apiClient.post(`/documents/${documentId}/shares`, data),
  listShares: (documentId) => apiClient.get(`/documents/${documentId}/shares`),
  revokeShare: (shareId) => apiClient.delete(`/documents/shares/${shareId}`),
};

// ==================== PERMISSION API ====================

export const permissionAPI = {
  setDocumentPermissions: (documentId, permissions) => 
    apiClient.post(`/documents/${documentId}/permissions`, { permissions }),
};

// ==================== TEMPLATE API ====================

export const templateAPI = {
  createTemplate: (formData) => 
    apiClient.post('/documents/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  listTemplates: (params) => apiClient.get('/documents/templates', { params }),
  generateFromTemplate: (id, data) => 
    apiClient.post(`/documents/templates/${id}/generate`, { data }),
};
