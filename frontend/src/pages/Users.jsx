import React, { useEffect, useState } from 'react';
import { 
  Users as UsersIcon, Plus, Search, Filter, Edit, Trash2, 
  Mail, Shield, CheckCircle, XCircle, UserPlus, Crown, Star, User
} from 'lucide-react';
import { apiClient } from '../api/http';
import { useSystemOptionsStore } from '../store/systemOptions.store';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal, { ConfirmModal } from '../components/common/Modal';
import { RoleGuard } from '../hooks/useAuth';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [roleOptions, setRoleOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE'
  });
  
  const { fetchOptions } = useSystemOptionsStore();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data || []);
    } catch (err) {
      setError('Failed to load users');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [roles, statuses] = await Promise.all([
        fetchOptions('USER_ROLE'),
        fetchOptions('USER_STATUS')
      ]);
      
      console.log('Fetched roles:', roles);
      console.log('Fetched statuses:', statuses);
      
      // Fallback to default roles if no options are found
      const defaultRoles = [
        { value: 'ADMIN', label: 'Administrator' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'USER', label: 'User' }
      ];
      
      const defaultStatuses = [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' }
      ];
      
      // Transform system options to the expected format
      const transformedRoles = Array.isArray(roles) && roles.length > 0 
        ? roles.map(role => ({ value: role.value, label: role.label }))
        : defaultRoles;
      
      const transformedStatuses = Array.isArray(statuses) && statuses.length > 0 
        ? statuses.map(status => ({ value: status.value, label: status.label }))
        : defaultStatuses;
      
      console.log('Transformed roles:', transformedRoles);
      console.log('Transformed statuses:', transformedStatuses);
      
      setRoleOptions(transformedRoles);
      setStatusOptions(transformedStatuses);
    } catch (err) {
      console.error('Failed to load options:', err);
      // Use fallback options
      const fallbackRoles = [
        { value: 'ADMIN', label: 'Administrator' },
        { value: 'MANAGER', label: 'Manager' },
        { value: 'USER', label: 'User' }
      ];
      const fallbackStatuses = [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'INACTIVE', label: 'Inactive' }
      ];
      
      console.log('Using fallback roles:', fallbackRoles);
      setRoleOptions(fallbackRoles);
      setStatusOptions(fallbackStatuses);
    }
  };

  useEffect(() => {
    loadUsers();
    loadOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editMode && selectedUser) {
        // Update existing user
        const updateData = {
          role: formData.role,
          status: formData.status
        };
        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        await apiClient.put(`/users/${selectedUser.id}`, updateData);
      } else {
        // Create new user
        await apiClient.post('/users', formData);
      }
      setFormData({ email: '', password: '', role: 'USER', status: 'ACTIVE' });
      setShowModal(false);
      setEditMode(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message || `Failed to ${editMode ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (user) => {
    setFormData({
      email: user.email,
      password: '',
      role: user.role || 'USER',
      status: user.status || 'ACTIVE'
    });
    setSelectedUser(user);
    setEditMode(true);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ email: '', password: '', role: 'USER', status: 'ACTIVE' });
    setEditMode(false);
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    setError('');
    try {
      await apiClient.delete(`/users/${userToDelete.id}`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
      setShowDeleteModal(false);
      setUserToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-red-100 text-red-700', icon: Crown },
      'MANAGER': { color: 'bg-blue-100 text-blue-700', icon: Star },
      'USER': { color: 'bg-emerald-100 text-emerald-700', icon: User }
    };
    
    const config = roleConfig[role] || roleConfig['USER'];
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{role}</span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'ACTIVE' ? (
      <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        <span>Active</span>
      </div>
    ) : (
      <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span>Inactive</span>
      </div>
    );
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    managers: users.filter(u => u.role === 'MANAGER').length
  };

  return (
    <RoleGuard requiredRole="MANAGER" fallback={
      <Layout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            You don't have the required permissions to access user management. Contact your administrator for access.
          </p>
        </div>
      </Layout>
    }>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users and their roles</p>
            </div>
            <button
              onClick={handleAddNew}
              className="btn-modern btn-primary flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-3">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total, icon: UsersIcon, bg: 'bg-blue-50', color: 'text-blue-600' },
              { label: 'Active Users', value: stats.active, icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
              { label: 'Administrators', value: stats.admins, icon: Crown, bg: 'bg-red-50', color: 'text-red-600' },
              { label: 'Managers', value: stats.managers, icon: Star, bg: 'bg-purple-50', color: 'text-purple-600' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="modern-card-elevated p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-600">{stat.label}</p>
                      <p className="text-xl font-bold text-primary-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="modern-card-elevated p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-modern pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filter by role:</span>
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input-modern min-w-[120px]"
                >
                  <option value="ALL">All Roles</option>
                  {Array.isArray(roleOptions) && roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="modern-card-elevated">
            <div className="px-6 py-4 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary-900">Users ({filteredUsers.length})</h2>
                <div className="text-sm text-primary-500">Showing {filteredUsers.length} of {users.length} users</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8">
                  <LoadingSpinner />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-modern btn-primary"
                  >
                    Add First User
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-primary-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-primary-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                              {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-primary-900">{user.email}</div>
                              <div className="text-xs text-primary-500">ID: {user.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => handleEdit(user)}
                              className="p-2 text-primary-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 text-primary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit User Modal */}
        <Modal 
          isOpen={showModal} 
          onClose={() => { 
            setShowModal(false); 
            setEditMode(false);
            setSelectedUser(null);
            setError(''); 
          }}
          title={editMode ? 'Edit User' : 'Add New User'}
          type="default"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Email Address</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={editMode}
                className="input-modern disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="user@company.com"
              />
              {editMode && (
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Password {editMode && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!editMode}
                className="input-modern"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="input-modern"
              >
                {roleOptions.length === 0 ? (
                  <option value="USER">User (Loading...)</option>
                ) : (
                  roleOptions.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))
                )}
              </select>
            </div>
            {editMode && (
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="input-modern"
                >
                  {statusOptions.length === 0 ? (
                    <>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </>
                  ) : (
                    statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))
                  )}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => { 
                  setShowModal(false); 
                  setEditMode(false);
                  setSelectedUser(null);
                  setError(''); 
                }}
                className="btn-modern btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-modern btn-primary disabled:opacity-50"
              >
                {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update User' : 'Create User')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete?.email}? This action cannot be undone.`}
          confirmText="Delete User"
          cancelText="Cancel"
          type="error"
        />
      </Layout>
    </RoleGuard>
  );
};

export default Users;