import prisma from '../../config/db.js';

export const bridgeUserRoles = async (tenantId) => {
  const users = await prisma.user.findMany({ where: { tenantId } });

  const adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN', tenantId },
  });

  const userRole = await prisma.role.findFirst({
    where: { name: 'USER', tenantId },
  });

  for (const user of users) {
    const role = user.role === 'ADMIN' ? adminRole : userRole;

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }
};
