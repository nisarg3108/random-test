import prisma from '../../config/db.js';

export const seedRoles = async (tenantId) => {
  await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'ADMIN',
        tenantId,
      },
    },
    update: {},
    create: {
      name: 'ADMIN',
      tenantId,
    },
  });

  await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'USER',
        tenantId,
      },
    },
    update: {},
    create: {
      name: 'USER',
      tenantId,
    },
  });
};
