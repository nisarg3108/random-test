import prisma from '../../config/db.js';

export const assignPermissions = async (tenantId) => {
  const admin = await prisma.role.findFirst({
    where: { name: 'ADMIN', tenantId },
  });

  const user = await prisma.role.findFirst({
    where: { name: 'USER', tenantId },
  });

  if (!admin || !user) {
    throw new Error('Roles not found. Run role seed first.');
  }

  const perms = await prisma.permission.findMany();

  for (const perm of perms) {
    // ADMIN gets everything
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: admin.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: admin.id,
        permissionId: perm.id,
      },
    });

    // USER limited permissions
    if (
      perm.code === 'inventory.view' ||
      perm.code === 'department.view'
    ) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: user.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: user.id,
          permissionId: perm.id,
        },
      });
    }
  }
};
