import { useState, useEffect, createElement } from 'react';
import { getToken, getUserFromToken, removeToken } from '../store/auth.store';
import { usePermissions } from '../contexts/PermissionContext';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get permissions from context (cached, no redundant API calls)
  const permissionContext = usePermissions();

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = getUserFromToken();
        if (!userData) {
          console.error('Invalid token - could not decode');
          setLoading(false);
          return;
        }

        // Set user from token
        setUser({
          id: userData.userId || userData.id,
          email: userData.email,
          role: userData.role || 'USER',
          companyId: userData.companyId
        });
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // Empty dependency array - run once on mount

  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Use permission context if available
    if (permissionContext && !permissionContext.loading) {
      return permissionContext.hasRole(requiredRole);
    }
    
    // Fallback to basic role check
    if (user.role === 'ADMIN') return true;
    if (user.role === requiredRole) return true;
    
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
    
    // Use permission context if available
    if (permissionContext && !permissionContext.loading) {
      // Handle array of permissions (OR logic)
      if (Array.isArray(permission)) {
        return permissionContext.hasAnyPermission(
          permission.map(p => ({ resource: p, action: 'read' }))
        );
      }
      return permissionContext.hasPermission(permission, 'read');
    }
    
    // Fallback: ADMIN has all permissions
    return user.role === 'ADMIN';
  };

  const hasAllPermissions = (permissionList) => {
    if (!user) return false;
    
    // Use permission context if available
    if (permissionContext && !permissionContext.loading) {
      return permissionContext.hasAllPermissions(
        permissionList.map(p => ({ resource: p, action: 'read' }))
      );
    }
    
    // Fallback: ADMIN has all permissions
    return user.role === 'ADMIN';
  };

  const hasAnyRole = (roleList) => {
    if (!user) return false;
    return roleList.some(role => hasRole(role));
  };

  return { 
    user, 
    loading: loading || (permissionContext?.loading ?? false),
    hasRole, 
    hasPermission,
    hasAllPermissions,
    hasAnyRole,
    permissions: permissionContext?.permissions || [],
    roles: permissionContext?.roles || [],
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
