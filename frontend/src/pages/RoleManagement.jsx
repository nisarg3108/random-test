import { useState, useEffect } from 'react';
import api from '../api/api';
import { 
  Users as UserGroupIcon, 
  ShieldCheck as ShieldCheckIcon, 
  UserPlus as UserPlusIcon,
  X as XMarkIcon,
  Check as CheckIcon
} from 'lucide-react';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/rbac/users'),
        api.get('/rbac/roles')
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      await api.post('/rbac/assign-role', {
        userId: selectedUser.id,
        roleName: selectedRole
      });
      setSuccess(`Role ${selectedRole} assigned successfully`);
      setShowAssignModal(false);
      setSelectedRole('');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign role');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveRole = async (userId, roleName) => {
    if (!confirm(`Remove role ${roleName} from this user?`)) return;

    try {
      await api.post('/rbac/remove-role', {
        userId,
        roleName
      });
      setSuccess(`Role ${roleName} removed successfully`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove role');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800',
      HR_MANAGER: 'bg-purple-100 text-purple-800',
      FINANCE_MANAGER: 'bg-green-100 text-green-800',
      INVENTORY_MANAGER: 'bg-blue-100 text-blue-800',
      SALES_MANAGER: 'bg-yellow-100 text-yellow-800',
      MANAGER: 'bg-indigo-100 text-indigo-800',
      EMPLOYEE: 'bg-gray-100 text-gray-800',
      USER: 'bg-gray-100 text-gray-600',
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UserGroupIcon className="h-8 w-8 text-blue-600" />
          Role Management
        </h1>
        <p className="mt-2 text-gray-600">
          Manage user roles and permissions across your organization
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckIcon className="h-5 w-5" />
          {success}
        </div>
      )}

      {/* Role Definitions */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
            Available Roles
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(role.name)}`}>
                  {role.label}
                </span>
                <span className="text-xs text-gray-500">{role.userCount} users</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{role.description}</p>
              <div className="text-xs text-gray-500">
                {role.permissionCount} permissions
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            User Role Assignments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span
                            key={role.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role.name)}`}
                          >
                            {role.label}
                            <button
                              onClick={() => handleRemoveRole(user.id, role.name)}
                              className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No roles assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowAssignModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                    >
                      <UserPlusIcon className="h-4 w-4" />
                      Assign Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Assign Role to {selectedUser?.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a role...</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.name}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAssignRole}
                disabled={!selectedRole}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign Role
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRole('');
                  setSelectedUser(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
