import { apiClient } from './http';

export const rolesAPI = {
  getRoles: () => apiClient.get('/roles'),
  getPermissions: () => apiClient.get('/permissions'),
  createRole: (data) => apiClient.post('/roles', data),
  updateRole: (id, data) => apiClient.put(`/roles/${id}`, data),
  deleteRole: (id) => apiClient.delete(`/roles/${id}`),
  assignUserRole: (userId, roleId) => apiClient.post('/user-roles', { userId, roleId }),
  removeUserRole: (userId, roleId) => apiClient.delete(`/user-roles/${userId}/${roleId}`)
};