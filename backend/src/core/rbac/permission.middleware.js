
import prisma from '../../config/db.js';

export const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
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
          return res.status(403).json({ message: 'Permission denied' });


    const hasPermission = roles.some(r =>
      r.role.permissions.some(p => p.permission.code === permissionCode)
    );

    if (!hasPermission) {
        console.log('USER ROLES RESULT:', roles);

    }

    next();
  };
};
