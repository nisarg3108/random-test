import prisma from '../../config/db.js';
import { SystemOptionsService } from '../system/systemOptions.service.js';
import { getAllPermissions, ROLE_PERMISSIONS } from './permissions.config.js';

/**
 * Seeds all permissions and roles with their mappings
 */
export const seedPermissions = async () => {
  console.log('🌱 Starting permission and role seeding...');
  
  // Seed system options first
  await SystemOptionsService.seedDefaultOptions();
  
  // 1. Seed all permissions from config
  const allPermissions = getAllPermissions();
  console.log(`📝 Seeding ${allPermissions.length} permissions...`);
  
  const permissionMap = {};
  for (const permCode of allPermissions) {
    // Generate label from code (e.g., 'user.create' -> 'Create User')
    const label = permCode
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .reverse()
      .join(' ');
    
    const permission = await prisma.permission.upsert({
      where: { code: permCode },
      update: { label },
      create: { code: permCode, label },
    });
    permissionMap[permCode] = permission.id;
  }
  
  console.log('✅ Permissions seeded successfully');
  
  // 2. Seed roles for each tenant that exists
  const tenants = await prisma.tenant.findMany();
  console.log(`🏢 Found ${tenants.length} tenants`);
  
  for (const tenant of tenants) {
    console.log(`\n🔄 Seeding roles for tenant: ${tenant.companyName}`);
    await seedRolesForTenant(tenant.id, permissionMap);
  }
  
  console.log('\n🎉 All permissions and roles seeded successfully!');
};

/**
 * Seeds roles for a specific tenant
 */
export const seedRolesForTenant = async (tenantId, permissionMap = null) => {
  // If permission map not provided, fetch it
  if (!permissionMap) {
    const permissions = await prisma.permission.findMany();
    permissionMap = {};
    permissions.forEach(p => {
      permissionMap[p.code] = p.id;
    });
  }
  
  // Create roles with their permissions
  for (const [roleKey, roleConfig] of Object.entries(ROLE_PERMISSIONS)) {
    console.log(`  📋 Creating role: ${roleConfig.label}`);
    
    // Create or update role
    const role = await prisma.role.upsert({
      where: {
        name_tenantId: {
          name: roleConfig.name,
          tenantId: tenantId,
        },
      },
      update: {},
      create: {
        name: roleConfig.name,
        tenantId: tenantId,
      },
    });
    
    // Map permissions to this role
    for (const permCode of roleConfig.permissions) {
      const permissionId = permissionMap[permCode];
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permissionId,
          },
        });
      }
    }
    
    console.log(`    ✓ ${roleConfig.permissions.length} permissions assigned`);
  }
};

/**
 * Assigns a role to a user
 */
export const assignRoleToUser = async (userId, roleName, tenantId) => {
  const role = await prisma.role.findFirst({
    where: {
      name: roleName,
      tenantId: tenantId,
    },
  });
  
  if (!role) {
    throw new Error(`Role ${roleName} not found for tenant ${tenantId}`);
  }
  
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: userId,
      roleId: role.id,
    },
  });
  
  // Also update the legacy role field on User for backward compatibility
  await prisma.user.update({
    where: { id: userId },
    data: { role: roleName },
  });
};

