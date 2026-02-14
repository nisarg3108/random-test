import prisma from './src/config/db.js';

async function grantManagerUserViewPermission() {
  try {
    console.log('Granting user.view permission to MANAGER role...');

    const permission = await prisma.permission.findFirst({
      where: { code: 'user.view' }
    });

    if (!permission) {
      console.log('user.view permission not found');
      return;
    }

    const managers = await prisma.role.findMany({
      where: { name: 'MANAGER' }
    });

    for (const manager of managers) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: manager.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: manager.id,
          permissionId: permission.id,
        },
      });
      console.log(`✓ Granted user.view to MANAGER (tenant: ${manager.tenantId})`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

grantManagerUserViewPermission();
