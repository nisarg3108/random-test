import React, { useEffect, useState } from 'react';
import { useRolesStore } from '../../store/roles.store';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/forms/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

const RolesList = () => {
  const { roles, permissions, loading, error, fetchRoles, fetchPermissions, createRole } = useRolesStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    permissions: []
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  const columns = [
    { key: 'name', label: 'Role Name' },
    { key: 'id', label: 'ID' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createRole(formData);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', permissions: [] });
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

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Roles Management</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create Role
            </button>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <DataTable
              columns={columns}
              data={roles}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}

          <Modal
            isOpen={showModal}
            onClose={() => { setShowModal(false); resetForm(); }}
            title="Create Role"
          >
            <form onSubmit={handleSubmit}>
              <FormField
                label="Role Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => handlePermissionChange(permission.id)}
                        className="mr-2"
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default RolesList;