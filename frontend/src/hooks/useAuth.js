import { useState, useEffect } from 'react';
import { getToken, getUserFromToken, removeToken } from '../store/auth.store';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    
    if (token) {
      try {
        const userData = getUserFromToken();
        if (userData) {
          setUser({
            id: userData.userId || userData.id,
            email: userData.email,
            role: userData.role || 'USER',
            permissions: userData.permissions || [],
            companyId: userData.companyId
          });
        } else {
          removeToken();
        }
      } catch (error) {
        console.error('Token decode failed:', error);
        removeToken();
      }
    }
    setLoading(false);
  }, []);

  const hasRole = (requiredRole) => {
    if (!user) return false;
    const roleHierarchy = { 'ADMIN': 3, 'MANAGER': 2, 'USER': 1 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(permission);
  };

  return { user, loading, hasRole, hasPermission };
};

export const RoleGuard = ({ children, requiredRole, fallback = null }) => {
  const { hasRole } = useAuth();
  return hasRole(requiredRole) ? children : fallback;
};

export const PermissionGuard = ({ children, permission, fallback = null }) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? children : fallback;
};