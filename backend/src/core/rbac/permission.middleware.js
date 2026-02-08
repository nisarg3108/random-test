
import prisma from '../../config/db.js';

/**
 * Middleware to check if user has required permission
 * @param {string|string[]} permissionCode - Single permission or array of permissions (OR logic)
 * @param {object} options - Additional options
 * @param {boolean} options.requireAll - If true, user must have ALL permissions (AND logic)
 */
export const requirePermission = (permissionCode, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required' 
        });
      }

      // Check if user has ADMIN role in their basic role field (backward compatibility)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      // ADMIN bypasses all permission checks
      if (user?.role === 'ADMIN') {
        return next();
      }

      // Get user's roles and permissions
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      // Extract all permission codes the user has (filter by tenant)
      const userPermissions = new Set();
      userRoles.forEach(userRole => {
        // Only include permissions from roles that match the user's tenant
        if (userRole.role && userRole.role.tenantId === tenantId) {
          userRole.role.permissions.forEach(rp => {
            userPermissions.add(rp.permission.code);
          });
        }
      });

      // Handle array of permissions
      const requiredPermissions = Array.isArray(permissionCode) 
        ? permissionCode 
        : [permissionCode];

      // Check permissions based on logic mode
      let hasPermission;
      if (options.requireAll) {
        // AND logic: must have ALL permissions
        hasPermission = requiredPermissions.every(perm => userPermissions.has(perm));
      } else {
        // OR logic: must have AT LEAST ONE permission
        hasPermission = requiredPermissions.some(perm => userPermissions.has(perm));
      }

      if (!hasPermission) {
        console.log('❌ Permission denied:', {
          userId,
          required: requiredPermissions,
          userHas: Array.from(userPermissions),
        });
        
        return res.status(403).json({ 
          success: false,
          message: 'Access denied: insufficient permissions',
          required: requiredPermissions,
        });
      }

      // Store user permissions in request for later use
      req.userPermissions = Array.from(userPermissions);
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error checking permissions',
        error: error.message 
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified roles
 * @param {string|string[]} roleNames - Single role or array of roles
 */
export const requireRole = (roleNames) => {
  const rolesArray = Array.isArray(roleNames) ? roleNames : [roleNames];
  
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required' 
        });
      }

      // Check legacy role field first
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (user?.role && rolesArray.includes(user.role)) {
        return next();
      }

      // Check UserRole table
      const userRoles = await prisma.userRole.findMany({
        where: { 
          userId,
          role: {
            tenantId,
            name: { in: rolesArray }
          }
        },
        include: {
          role: {
            select: { name: true }
          }
        }
      });

      if (userRoles.length > 0) {
        return next();
      }

      console.log('❌ Role check failed:', {
        userId,
        required: rolesArray,
        userHas: user?.role,
      });

      return res.status(403).json({ 
        success: false,
        message: 'Access denied: insufficient role privileges',
        required: rolesArray,
      });
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error checking roles',
        error: error.message 
      });
    }
  };
};

/**
 * Helper middleware to get user's permissions and attach to request
 * Useful for conditional logic in controllers
 */
export const attachUserPermissions = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      req.userPermissions = [];
      req.userRoles = [];
      return next();
    }

    // Get user roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          where: { tenantId },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    // Extract permissions
    const permissions = new Set();
    const roles = new Set();
    
    if (user?.role) {
      roles.add(user.role);
    }

    userRoles.forEach(userRole => {
      roles.add(userRole.role.name);
      userRole.role.permissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    req.userPermissions = Array.from(permissions);
    req.userRoles = Array.from(roles);
    
    next();
  } catch (error) {
    console.error('Error attaching permissions:', error);
    req.userPermissions = [];
    req.userRoles = [];
    next();
  }
};
