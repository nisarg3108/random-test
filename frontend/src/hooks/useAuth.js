import { useState, useEffect, createElement } from 'react';
import { getToken, getUserFromToken, removeToken } from '../store/auth.store';
import api from '../api/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      
      if (token) {
        try {
          const userData = getUserFromToken();
          if (userData) {
            setUser({
              id: userData.userId || userData.id,
              email: userData.email,
              role: userData.role || 'USER',
              companyId: userData.companyId
            });

            // Fetch user's actual permissions from backend
            try {
              const response = await api.get('/rbac/my-permissions');
              if (response.data.success) {
                setPermissions(response.data.data.permissions || []);
                setRoles(response.data.data.roles || []);
              }
            } catch (error) {
              console.error('Failed to fetch permissions:', error);
              // Continue with basic auth even if permission fetch fails
            }
          } else {
            removeToken();
          }
        } catch (error) {
          console.error('Token decode failed:', error);
          removeToken();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Check if user has ADMIN role (full access)
    if (user.role === 'ADMIN') return true;
    
    // Check if user has the specific role
    if (user.role === requiredRole) return true;
    
    // Check in roles array from RBAC system
    if (roles.some(r => r.name === requiredRole)) return true;
    
    // Role hierarchy check for backward compatibility
    const roleHierarchy = { 
      'ADMIN': 10, 
      'HR_MANAGER': 8,
      'FINANCE_MANAGER': 8,
      'INVENTORY_MANAGER': 8,
      'SALES_MANAGER': 8,
      'PURCHASE_MANAGER': 8,
      'PROJECT_MANAGER': 7,
      'MANAGER': 6, 
      'HR_STAFF': 5,
      'ACCOUNTANT': 5,
      'WAREHOUSE_STAFF': 4,
      'SALES_STAFF': 4,
      'EMPLOYEE': 3,
      'USER': 1 
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // ADMIN has all permissions
    if (user.role === 'ADMIN') return true;
    
    // Check if user has the specific permission
    if (Array.isArray(permission)) {
      // Check if user has ANY of the permissions (OR logic)
      return permission.some(perm => permissions.includes(perm));
    }
    
    return permissions.includes(permission);
  };

  const hasAllPermissions = (permissionList) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    
    // Check if user has ALL permissions (AND logic)
    return permissionList.every(perm => permissions.includes(perm));
  };

  const hasAnyRole = (roleList) => {
    if (!user) return false;
    return roleList.some(role => hasRole(role));
  };

  return { 
    user, 
    loading, 
    hasRole, 
    hasPermission,
    hasAllPermissions,
    hasAnyRole,
    permissions,
    roles,
    isAdmin: user?.role === 'ADMIN'
  };
};

export const RoleGuard = ({ children, requiredRole, fallback = null }) => {
  const { hasRole, loading } = useAuth();
  
  if (loading) {
    return createElement('div', { className: 'flex items-center justify-center p-4' },
      createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
    );
  }
  
  return hasRole(requiredRole) ? children : fallback;
};

export const PermissionGuard = ({ children, permission, requireAll = false, fallback = null }) => {
  const { hasPermission, hasAllPermissions, loading } = useAuth();
  
  if (loading) {
    return createElement('div', { className: 'flex items-center justify-center p-4' },
      createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
    );
  }
  
  const hasAccess = requireAll 
    ? hasAllPermissions(Array.isArray(permission) ? permission : [permission])
    : hasPermission(permission);
  
  return hasAccess ? children : fallback;
};

export const MultiRoleGuard = ({ children, roles, fallback = null }) => {
  const { hasAnyRole, loading } = useAuth();
  
  if (loading) {
    return createElement('div', { className: 'flex items-center justify-center p-4' },
      createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
    );
  }
  
  return hasAnyRole(roles) ? children : fallback;
};
