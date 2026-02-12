import React, { useEffect, useState } from 'react';
import { useRolesStore } from '../../store/roles.store';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Plus, Shield, Users, Edit, Trash2, Check, AlertCircle } from 'lucide-react';

const RolesList = () => {
  const { 
    roles, 
    permissions, 
    loading, 
    error, 
    success,
    fetchRoles, 
    fetchPermissions, 
    createRole,
    updateRole,
    deleteRole,
    clearMessages
  } = useRolesStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => clearMessages(), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearMessages]);

  const columns = [
    { 
      key: 'name', 
      label: 'Role Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            value === 'ADMIN' ? 'bg-red-100 text-red-700' :
            value === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
            value === 'USER' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {value?.charAt(0)}
          </span>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            {row.description && <p className="text-xs text-gray-500">{row.description}</p>}
          </div>
        </div>
      )
    },
    { 
      key: 'permissions', 
      label: 'Permissions',
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {value?.length || 0} permissions
        </span>
      )
    },
    {
      key: 'usersCount',
      label: 'Users',
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-gray-600">
          <Users className="w-4 h-4" />
          {value || 0}
        </span>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Created',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success;
    
    if (editingRole) {
      success = await updateRole(editingRole.id, formData);
    } else {
      success = await createRole(formData);
    }
    
    if (success) {
      setShowModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setEditingRole(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (permissionId) => {
    const updatedPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(id => id !== permissionId)
      : [...formData.permissions, permissionId];
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map(p => p.permissionId || p.id) || []
    });
    setShowModal(true);
  };

  const handleDeleteClick = (role) => {
    // Prevent deletion of system roles
    if (['ADMIN', 'MANAGER', 'USER'].includes(role.name)) {
      return;
    }
    setShowDeleteConfirm(role);
  };

  const handleConfirmDelete = async () => {
    if (showDeleteConfirm) {
      await deleteRole(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
    }
  };

  const isSystemRole = (role) => ['ADMIN', 'MANAGER', 'USER'].includes(role.name);

  // Group permissions by module
  const groupedPermissions = (Array.isArray(permissions) ? permissions : []).reduce((acc, permission) => {
    const module = permission.module || permission.key?.split('_')[0] || 'General';
    if (!acc[module]) acc[module] = [];
    acc[module].push(permission);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                Roles Management
              </h1>
              <p className="text-gray-500 mt-1">Create and manage user roles and their permissions</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Role
            </button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {col.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(Array.isArray(roles) ? roles : []).map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      {columns.map(col => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                          {col.render ? col.render(role[col.key], role) : role[col.key]}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(role)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title="Edit role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(role)}
                            disabled={isSystemRole(role)}
                            className={`p-1 rounded ${
                              isSystemRole(role)
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            }`}
                            title={isSystemRole(role) ? 'System roles cannot be deleted' : 'Delete role'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => { setShowModal(false); resetForm(); }}
            title={editingRole ? 'Edit Role' : 'Create Role'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Role Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={editingRole && isSystemRole(editingRole)}
                placeholder="e.g., SUPERVISOR"
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief description of this role's responsibilities..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <div key={module} className="border-b border-gray-200 last:border-0">
                      <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 uppercase">
                        {module}
                      </div>
                      <div className="p-3 space-y-2">
                        {perms.map((permission) => (
                          <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => handlePermissionChange(permission.id)}
                              className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={!!showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(null)}
            title="Delete Role"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete the role <strong>"{showDeleteConfirm?.name}"</strong>? 
                This action cannot be undone and will remove all associated permissions.
              </p>
              {showDeleteConfirm?.usersCount > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <strong>Warning:</strong> This role is assigned to {showDeleteConfirm.usersCount} user(s). 
                  They will lose access to permissions granted by this role.
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Role
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default RolesList;