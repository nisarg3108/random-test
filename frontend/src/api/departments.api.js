import { apiClient } from './http';

export const departmentsAPI = {
  getDepartments: () => apiClient.get('/departments'),
  getDepartment: (id) => apiClient.get(`/departments/${id}`),
  createDepartment: (data) => apiClient.post('/departments', data),
  updateDepartment: (id, data) => apiClient.put(`/departments/${id}`, data),
  deleteDepartment: (id) => apiClient.delete(`/departments/${id}`)
};