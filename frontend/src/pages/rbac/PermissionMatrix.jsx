import React, { useEffect } from 'react';
import { useRolesStore } from '../../store/roles.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

const PermissionMatrix = () => {
  const { roles, permissions, loading, fetchRoles, fetchPermissions } = useRolesStore();

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [fetchRoles, fetchPermissions]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Permission Matrix</h1>
          
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permission
                    </th>
                    {roles.map((role) => (
                      <th key={role.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {permission.label}
                      </td>
                      {roles.map((role) => (
                        <td key={role.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="checkbox"
                            checked={role.permissions?.some(p => p.permissionId === permission.id)}
                            readOnly
                            className="h-4 w-4 text-indigo-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;