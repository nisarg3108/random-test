import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';
import { getToken, getUserFromToken } from '../store/auth.store';

const PermissionContext = createContext(null);

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let permissionCache = null;
let cacheTimestamp = null;

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check if cache is still valid
  const isCacheValid = () => {
    if (!permissionCache || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  };

  // Fetch permissions with caching
  const fetchPermissions = async (force = false) => {
    // Return cached data if valid and not forcing refresh
    if (!force && isCacheValid()) {
      setPermissions(permissionCache.permissions);
      setRoles(permissionCache.roles);
      setLoading(false);
      return permissionCache;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await api.get('/rbac/my-permissions', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response?.success) {
        const data = {
          permissions: response.data?.permissions || [],
          roles: response.data?.roles || []
        };

        // Update cache
        permissionCache = data;
        cacheTimestamp = Date.now();

        setPermissions(data.permissions);
        setRoles(data.roles);
        return data;
      }
    } catch (error) {
      console.warn('Permissions API not available:', error.message);
      // If cache exists but expired, continue using it
      if (permissionCache) {
        setPermissions(permissionCache.permissions);
        setRoles(permissionCache.roles);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = getUserFromToken();
      if (userData) {
        setUser({
          id: userData.userId || userData.id,
          email: userData.email,
          role: userData.role || 'USER',
          companyId: userData.companyId
        });
      }

      await fetchPermissions();
    };

    initAuth();
  }, []);

  // Permission check helper
  const hasPermission = (resource, action) => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'ADMIN') return true;
    
    // Check in permissions array
    return permissions.some(
      p => p.resource === resource && (p.action === action || p.action === '*')
    );
  };

  // Role check helper
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Admin has all roles
    if (user.role === 'ADMIN') return true;
    
    // Check user role
    if (user.role === requiredRole) return true;
    
    // Check in roles array
    return roles.some(r => r.name === requiredRole);
  };

  // Check multiple permissions (OR logic)
  const hasAnyPermission = (checks) => {
    return checks.some(({ resource, action }) => hasPermission(resource, action));
  };

  // Check multiple permissions (AND logic)
  const hasAllPermissions = (checks) => {
    return checks.every(({ resource, action }) => hasPermission(resource, action));
  };

  // Manually refresh permissions (for after login or role changes)
  const refreshPermissions = () => {
    return fetchPermissions(true);
  };

  // Clear cache (for logout)
  const clearCache = () => {
    permissionCache = null;
    cacheTimestamp = null;
    setPermissions([]);
    setRoles([]);
    setUser(null);
  };

  const value = {
    user,
    permissions,
    roles,
    loading,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
    clearCache
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

export default PermissionContext;
