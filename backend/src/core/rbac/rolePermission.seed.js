import prisma from '../../config/db.js';

export const assignPermissions = async (tenantId) => {
  const admin = await prisma.role.findFirst({
    where: { name: 'ADMIN', tenantId },
  });

  const manager = await prisma.role.findFirst({
    where: { name: 'MANAGER', tenantId },
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

    // MANAGER permissions
    if (manager && (
      perm.code === 'user.view' ||
      perm.code === 'inventory.view' ||
      perm.code === 'department.view' ||
      perm.code === 'employee.view' ||
      perm.code === 'employee.view.all' ||
      perm.code === 'leave.view' ||
      perm.code === 'leave.approve' ||
      perm.code === 'leaveType.view'
    )) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: manager.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: manager.id,
          permissionId: perm.id,
        },
      });
    }

    // USER limited permissions
    if (
      perm.code === 'inventory.view' ||
      perm.code === 'department.view' ||
      perm.code === 'employee.view' ||
      perm.code === 'employee.view.own' ||
      perm.code === 'leave.view' ||
      perm.code === 'leave.view.own' ||
      perm.code === 'leaveType.view' ||
      perm.code === 'leave.request' ||
      perm.code === 'crm.customer.view' ||
      perm.code === 'crm.contact.view' ||
      perm.code === 'crm.lead.create' ||
      perm.code === 'crm.lead.view' ||
      perm.code === 'crm.deal.view' ||
      perm.code === 'crm.communication.create' ||
      perm.code === 'crm.communication.view'
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
