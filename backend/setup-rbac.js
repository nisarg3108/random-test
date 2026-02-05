/**
 * RBAC Setup and Migration Script
 * Run this to initialize or update the RBAC system
 */

import prisma from './src/config/db.js';
import { seedPermissions, seedRolesForTenant, assignRoleToUser } from './src/core/rbac/permissions.seed.js';
import { ROLE_PERMISSIONS } from './src/core/rbac/permissions.config.js';

async function setupRBAC() {
  console.log('🚀 Starting RBAC Setup...\n');

  try {
    // 1. Seed all permissions
    console.log('Step 1: Seeding permissions...');
    await seedPermissions();

    // 2. Get all tenants and ensure roles exist
    console.log('\nStep 2: Setting up roles for all tenants...');
    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.companyName} (${tenant.id})`);
      await seedRolesForTenant(tenant.id);
    }

    // 3. Migrate existing users to RBAC system
    console.log('\nStep 3: Migrating existing users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`Found ${users.length} user(s) to migrate`);

    for (const user of users) {
      // Skip if user already has role assignments
      if (user.roles.length > 0) {
        console.log(`  ✓ ${user.email} already has roles assigned`);
        continue;
      }

      // Map legacy role to new RBAC role
      let targetRole = user.role || 'USER';
      
      // Map old role names to new ones if needed
      const roleMapping = {
        'ADMIN': 'ADMIN',
        'MANAGER': 'MANAGER',
        'USER': 'EMPLOYEE',
        'HR': 'HR_MANAGER',
        'FINANCE': 'FINANCE_MANAGER',
        'INVENTORY': 'INVENTORY_MANAGER',
        'SALES': 'SALES_MANAGER',
      };

      targetRole = roleMapping[targetRole] || targetRole;

      // Verify the role exists in our config
      if (!ROLE_PERMISSIONS[targetRole]) {
        console.log(`  ⚠ Unknown role ${targetRole} for ${user.email}, assigning EMPLOYEE`);
        targetRole = 'EMPLOYEE';
      }

      try {
        await assignRoleToUser(user.id, targetRole, user.tenantId);
        console.log(`  ✓ Assigned ${targetRole} to ${user.email}`);
      } catch (error) {
        console.error(`  ✗ Failed to assign role to ${user.email}:`, error.message);
      }
    }

    // 4. Summary
    console.log('\n📊 Setup Summary:');
    const permissionCount = await prisma.permission.count();
    const roleCount = await prisma.role.count();
    const roleAssignmentCount = await prisma.userRole.count();

    console.log(`  • Permissions: ${permissionCount}`);
    console.log(`  • Roles: ${roleCount}`);
    console.log(`  • User Role Assignments: ${roleAssignmentCount}`);

    console.log('\n✅ RBAC Setup Complete!\n');
    
    // Display available roles
    console.log('📋 Available Roles:');
    Object.entries(ROLE_PERMISSIONS).forEach(([key, config]) => {
      console.log(`  • ${config.label} (${config.name})`);
      console.log(`    ${config.description}`);
      console.log(`    Permissions: ${config.permissions.length}\n`);
    });

  } catch (error) {
    console.error('❌ Error during RBAC setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupRBAC()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
