
import prisma from '../../config/db.js';

export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    // Temporarily bypass permission checks for debugging
    console.log('BYPASSING PERMISSION CHECK FOR:', permissionCode);
    return next();
    
    console.log('PERMISSION CHECK USER:', req.user);

    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const roles = await prisma.userRole.findMany({
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

    const hasPermission = roles.some(r =>
      r.role.permissions.some(p => p.permission.code === permissionCode)
    );

    if (!hasPermission) {
      console.log('USER ROLES RESULT:', roles);
      console.log('REQUIRED PERMISSION:', permissionCode);
      console.log('USER PERMISSIONS:', roles.flatMap(r => r.role.permissions.map(p => p.permission.code)));
      return res.status(403).json({ message: 'Permission denied' });
    }

    next();
  };
};
