/**
 * Create Test Users for All Roles
 * Creates one test user for each role to enable comprehensive testing
 */

import prisma from './src/config/db.js';
import bcrypt from 'bcrypt';
import { assignRoleToUser } from './src/core/rbac/permissions.seed.js';

async function createTestUsers() {
  console.log('👥 Creating Test Users for All Roles\n');
  console.log('=' .repeat(80));

  try {
    // Get the first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      throw new Error('No tenant found. Please create a tenant first.');
    }

    console.log(`Using tenant: ${tenant.companyName} (${tenant.id})\n`);

    // First, fix existing user with wrong RBAC role
    console.log('🔧 Fixing Existing Users...\n');
    
    // Fix mit@gmail.com - should have HR_MANAGER RBAC role
    const mitUser = await prisma.user.findUnique({ where: { email: 'mit@gmail.com' } });
    if (mitUser && mitUser.role === 'HR_MANAGER') {
      await assignRoleToUser(mitUser.id, 'HR_MANAGER', tenant.id);
      console.log('  ✅ Updated mit@gmail.com to HR_MANAGER RBAC role');
    }

    // Fix jeet@gmail.com - should have MANAGER RBAC role
    const jeetUser = await prisma.user.findUnique({ where: { email: 'jeet@gmail.com' } });
    if (jeetUser && jeetUser.role === 'MANAGER') {
      // Remove old role
      await prisma.userRole.deleteMany({ where: { userId: jeetUser.id } });
      await assignRoleToUser(jeetUser.id, 'MANAGER', tenant.id);
      console.log('  ✅ Updated jeet@gmail.com to MANAGER RBAC role');
    }

    // Define test users for missing roles
    const testUsers = [
      { email: 'hr.staff@test.com', role: 'HR_STAFF', name: 'HR Staff Test' },
      { email: 'finance.manager@test.com', role: 'FINANCE_MANAGER', name: 'Finance Manager Test' },
      { email: 'accountant@test.com', role: 'ACCOUNTANT', name: 'Accountant Test' },
      { email: 'inventory.manager@test.com', role: 'INVENTORY_MANAGER', name: 'Inventory Manager Test' },
      { email: 'warehouse.staff@test.com', role: 'WAREHOUSE_STAFF', name: 'Warehouse Staff Test' },
      { email: 'sales.manager@test.com', role: 'SALES_MANAGER', name: 'Sales Manager Test' },
      { email: 'sales.staff@test.com', role: 'SALES_STAFF', name: 'Sales Staff Test' },
      { email: 'purchase.manager@test.com', role: 'PURCHASE_MANAGER', name: 'Purchase Manager Test' },
      { email: 'project.manager@test.com', role: 'PROJECT_MANAGER', name: 'Project Manager Test' },
      { email: 'user@test.com', role: 'USER', name: 'Basic User Test' }
    ];

    console.log('\n👥 Creating New Test Users...\n');

    // Password for all test users
    const password = 'Test@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`  ⏭️  ${userData.email.padEnd(35)} already exists`);
        continue;
      }

      // Create user
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          tenantId: tenant.id,
          status: 'ACTIVE'
        }
      });

      // Skip employee record creation - not required for authentication testing
      // Employee records require departmentId, joiningDate, userId which complicate setup

      // Assign RBAC role
      await assignRoleToUser(newUser.id, userData.role, tenant.id);

      console.log(`  ✅ ${userData.email.padEnd(35)} | ${userData.role}`);
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));

    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { role: 'asc' }
    });

    console.log(`\nTotal Users: ${allUsers.length}\n`);

    const roleGroups = {};
    allUsers.forEach(user => {
      if (!roleGroups[user.role]) {
        roleGroups[user.role] = [];
      }
      const rbacRoles = user.roles.map(r => r.role.name).join(', ') || 'None';
      roleGroups[user.role].push({
        email: user.email,
        rbac: rbacRoles
      });
    });

    Object.keys(roleGroups).sort().forEach(role => {
      console.log(`\n🛡️  ${role}:`);
      roleGroups[role].forEach(user => {
        const rbacCheck = user.rbac === role || user.rbac.includes(role) ? '✅' : '⚠️';
        console.log(`  ${rbacCheck} ${user.email.padEnd(35)} (RBAC: ${user.rbac})`);
      });
    });

    console.log('\n\n🔑 Test User Credentials:');
    console.log('   Email: [role]@test.com');
    console.log('   Password: Test@123\n');
    console.log('   Example: hr.staff@test.com / Test@123\n');

    console.log('✅ Test users created successfully!\n');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
