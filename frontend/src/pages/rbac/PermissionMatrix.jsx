import React, { useEffect, useState } from 'react';
import { useRolesStore } from '../../store/roles.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { Save, RefreshCw, Check, X, Shield, AlertCircle } from 'lucide-react';

const PermissionMatrix = () => {
  const { 
    roles, 
    permissions, 
    loading, 
    error,
    success,
    fetchRoles, 
    fetchPermissions,
    updateRolePermissions,
    clearMessages
  } = useRolesStore();

  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [saving, setSaving] = useState(false);

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

  // Initialize pending changes when entering edit mode
  const handleEnterEditMode = () => {
    const initialChanges = {};
    roles.forEach(role => {
      initialChanges[role.id] = role.permissions?.map(p => p.permissionId || p.id) || [];
    });
    setPendingChanges(initialChanges);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setPendingChanges({});
    setEditMode(false);
  };

  const handlePermissionToggle = (roleId, permissionId) => {
    setPendingChanges(prev => {
      const rolePermissions = prev[roleId] || [];
      const hasPermission = rolePermissions.includes(permissionId);
      
      return {
        ...prev,
        [roleId]: hasPermission
          ? rolePermissions.filter(id => id !== permissionId)
          : [...rolePermissions, permissionId]
      };
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Save all changes
      for (const [roleId, permissionIds] of Object.entries(pendingChanges)) {
        await updateRolePermissions(roleId, permissionIds);
      }
      setEditMode(false);
      setPendingChanges({});
      await fetchRoles(); // Refresh roles data
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const isPermissionChecked = (role, permissionId) => {
    if (editMode && pendingChanges[role.id]) {
      return pendingChanges[role.id].includes(permissionId);
    }
    return role.permissions?.some(p => (p.permissionId || p.id) === permissionId);
  };

  const hasChanges = () => {
    if (!editMode) return false;
    return Object.entries(pendingChanges).some(([roleId, perms]) => {
      const role = roles.find(r => r.id === roleId);
      const originalPerms = role?.permissions?.map(p => p.permissionId || p.id) || [];
      return JSON.stringify([...perms].sort()) !== JSON.stringify([...originalPerms].sort());
    });
  };

  // Group permissions by module for better organization
  const groupedPermissions = permissions.reduce((acc, permission) => {
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
                Permission Matrix
              </h1>
              <p className="text-gray-500 mt-1">Manage role permissions across your organization</p>
            </div>
            <div className="flex gap-3">
              {!editMode ? (
                <>
                  <button
                    onClick={() => { fetchRoles(); fetchPermissions(); }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={handleEnterEditMode}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit Permissions
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={saving}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges() || saving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      hasChanges() && !saving
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
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

          {editMode && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              <strong>Edit Mode:</strong> Click on checkboxes to toggle permissions. Click "Save Changes" when done.
            </div>
          )}
          
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-r bg-gray-50 sticky left-0 z-10">
                        Permission
                      </th>
                      {roles.map((role) => (
                        <th key={role.id} className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b min-w-[120px]">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            role.name === 'ADMIN' ? 'bg-red-100 text-red-700' :
                            role.name === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {role.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <React.Fragment key={module}>
                        <tr className="bg-gray-50">
                          <td colSpan={roles.length + 1} className="px-6 py-2 text-sm font-semibold text-gray-700 border-r">
                            {module}
                          </td>
                        </tr>
                        {perms.map((permission) => (
                          <tr key={permission.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 border-r bg-white sticky left-0">
                              <div>
                                <span className="font-medium">{permission.label}</span>
                                {permission.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                                )}
                              </div>
                            </td>
                            {roles.map((role) => (
                              <td key={role.id} className="px-6 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isPermissionChecked(role, permission.id)}
                                  onChange={() => editMode && handlePermissionToggle(role.id, permission.id)}
                                  disabled={!editMode || role.name === 'ADMIN'} // Admin always has all permissions
                                  className={`h-5 w-5 rounded border-gray-300 ${
                                    editMode && role.name !== 'ADMIN'
                                      ? 'text-indigo-600 cursor-pointer focus:ring-indigo-500'
                                      : 'text-gray-400 cursor-not-allowed'
                                  }`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;