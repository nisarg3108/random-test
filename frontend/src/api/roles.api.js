import { apiClient } from './http';

export const rolesAPI = {
  getRoles: () => apiClient.get('/rbac/roles'),
  createRole: (data) => apiClient.post('/rbac/roles', data),
  updateRole: (id, data) => apiClient.put(`/rbac/roles/${id}`, data),
  deleteRole: (id) => apiClient.delete(`/rbac/roles/${id}`),
  getPermissions: () => apiClient.get('/rbac/permissions'),
  getMyPermissions: () => apiClient.get('/rbac/my-permissions'),
  getUserPermissions: (userId) => apiClient.get(`/rbac/users/${userId}/permissions`),
  getUsersWithRoles: () => apiClient.get('/rbac/users'),
  assignRole: (userId, roleName) => apiClient.post('/rbac/assign-role', { userId, roleName }),
  removeRole: (userId, roleName) => apiClient.post('/rbac/remove-role', { userId, roleName }),
  initializeRoles: () => apiClient.post('/rbac/initialize')
};