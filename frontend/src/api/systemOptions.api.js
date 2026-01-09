import { apiClient } from './http.js';

export const systemOptionsAPI = {
  getOptions: (category) => apiClient.get(`/system-options/${category}`),
  createOption: (data) => apiClient.post('/system-options', data),
  updateOption: (id, data) => apiClient.put(`/system-options/${id}`, data),
  deleteOption: (id) => apiClient.delete(`/system-options/${id}`)
};