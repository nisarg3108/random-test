import { requirePermission } from '../core/rbac/permission.middleware.js';

// Export requirePermission as checkPermission for compatibility
export const checkPermission = requirePermission;