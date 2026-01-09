import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authFetch } from '../../api/http';

const RoleSwitcher = () => {
  const { user, setUser } = useAuth();

  const switchRole = async (newRole) => {
    try {
      // Update role via API
      const response = await authFetch('/users/role', {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      
      // Update local user state
      setUser({ ...user, role: newRole });
      
      // Refresh page to apply new permissions
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch role:', error);
      // Fallback to localStorage for development
      localStorage.setItem('mockUserRole', newRole);
      window.location.reload();
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-primary-600 font-medium">Switch Role:</span>
      <select
        value={user.role}
        onChange={(e) => switchRole(e.target.value)}
        className="text-xs border border-primary-300 rounded-md px-3 py-1.5 bg-white text-primary-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <option value="USER">USER</option>
        <option value="MANAGER">MANAGER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
    </div>
  );
};

export default RoleSwitcher;