import prisma from '../config/db.js';

const TENANT_ID = '2ffb2a5f-6cb9-40d3-a76e-e4d62d7af033';

async function fix() {
  const adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN', tenantId: TENANT_ID },
  });

  if (!adminRole) {
    console.error('ADMIN role not found for tenant');
    process.exit(1);
  }

  const permissions = await prisma.permission.findMany();

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  console.log('✅ ADMIN permissions fixed for tenant');
}

fix()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
