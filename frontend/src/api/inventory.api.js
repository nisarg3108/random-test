import { apiClient } from './http';

export const inventoryAPI = {
  getItems: () => apiClient.get('/inventory'),
  getItem: (id) => apiClient.get(`/inventory/${id}`),
  createItem: (data) => apiClient.post('/inventory', data),
  updateItem: (id, data) => apiClient.put(`/inventory/${id}`, data),
  deleteItem: (id) => apiClient.delete(`/inventory/${id}`)
};