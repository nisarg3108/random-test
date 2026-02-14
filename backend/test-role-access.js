/**
 * Role-Based Access Test Script
 * Tests all role-specific dashboards and sidebar access
 */

import prisma from './src/config/db.js';

async function testRoleBasedAccess() {
  console.log('🧪 Testing Role-Based Access Control\n');
  console.log('=' .repeat(80));

  try {
    // 1. Check existing users and their roles
    console.log('\n📊 TEST 1: User Role Assignments');
    console.log('-'.repeat(80));
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    console.log(`\nTotal Users: ${users.length}\n`);

    const roleCount = {};
    users.forEach(user => {
      const role = user.role || 'UNASSIGNED';
      roleCount[role] = (roleCount[role] || 0) + 1;
      
      const rbacRoles = user.roles.map(r => r.role.name).join(', ') || 'None';
      console.log(`  👤 ${user.email.padEnd(30)} | ${user.role.padEnd(20)} | RBAC: ${rbacRoles}`);
    });

    console.log('\n📈 Role Distribution:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role.padEnd(25)} : ${count} user(s)`);
    });

    // 2. Check all available roles
    console.log('\n\n📊 TEST 2: Available Roles and Permissions');
    console.log('-'.repeat(80));
    
    const roles = await prisma.role.findMany({
      select: {
        name: true,
        _count: {
          select: {
            permissions: true,
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`\nTotal Roles: ${roles.length}\n`);
    roles.forEach(role => {
      console.log(`  🛡️  ${role.name.padEnd(25)} | Permissions: ${role._count.permissions.toString().padStart(3)} | Users: ${role._count.users}`);
    });

    // 3. Dashboard mapping verification
    console.log('\n\n📊 TEST 3: Dashboard Mapping Verification');
    console.log('-'.repeat(80));
    
    const expectedDashboards = [
      'ADMIN',
      'MANAGER', 
      'HR_MANAGER',
      'HR_STAFF',
      'FINANCE_MANAGER',
      'ACCOUNTANT',
      'INVENTORY_MANAGER',
      'WAREHOUSE_STAFF',
      'SALES_MANAGER',
      'SALES_STAFF',
      'PURCHASE_MANAGER',
      'PROJECT_MANAGER',
      'EMPLOYEE',
      'USER'
    ];

    console.log('\nChecking dashboard coverage for all roles:\n');
    expectedDashboards.forEach(role => {
      const hasUsers = users.some(u => u.role === role);
      const roleExists = roles.some(r => r.name === role);
      const status = hasUsers ? '✅ HAS USERS' : roleExists ? '⚠️  NO USERS' : '❌ NOT CONFIGURED';
      console.log(`  ${role.padEnd(25)} : ${status}`);
    });

    // 4. Sidebar filter test
    console.log('\n\n📊 TEST 4: Sidebar Access Filtering');
    console.log('-'.repeat(80));
    
    const sampleRoutes = [
      { path: '/dashboard', minRole: 'USER' },
      { path: '/users', minRole: 'MANAGER' },
      { path: '/role-management', minRole: 'ADMIN' },
      { path: '/inventory', minRole: 'USER' },
      { path: '/hr', minRole: 'MANAGER' },
      { path: '/finance', minRole: 'MANAGER' }
    ];

    console.log('\nTesting route access for each role:\n');
    
    const testRoles = ['USER', 'EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN'];
    const roleHierarchy = { 
      'ADMIN': 10, 
      'HR_MANAGER': 8,
      'FINANCE_MANAGER': 8,
      'INVENTORY_MANAGER': 8,
      'SALES_MANAGER': 8,
      'PURCHASE_MANAGER': 8,
      'PROJECT_MANAGER': 7,
      'MANAGER': 6, 
      'HR_STAFF': 5,
      'ACCOUNTANT': 5,
      'WAREHOUSE_STAFF': 4,
      'SALES_STAFF': 4,
      'EMPLOYEE': 3,
      'USER': 1 
    };

    testRoles.forEach(userRole => {
      console.log(`\n  ${userRole}:`);
      sampleRoutes.forEach(route => {
        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[route.minRole] || 0;
        const hasAccess = userLevel >= requiredLevel;
        const icon = hasAccess ? '✅' : '❌';
        console.log(`    ${icon} ${route.path.padEnd(25)} (requires: ${route.minRole})`);
      });
    });

    // 5. Test user creation suggestions
    console.log('\n\n📊 TEST 5: Missing Role Coverage');
    console.log('-'.repeat(80));
    
    const missingRoles = expectedDashboards.filter(role => 
      !users.some(u => u.role === role)
    );

    if (missingRoles.length > 0) {
      console.log('\n⚠️  The following roles have no users assigned:\n');
      missingRoles.forEach(role => {
        console.log(`  • ${role}`);
      });
      
      console.log('\n💡 Suggested next steps:');
      console.log('  1. Create test users for each role');
      console.log('  2. Update existing users to use new roles');
      console.log('  3. Test login and dashboard access for each role');
    } else {
      console.log('\n✅ All roles have at least one user assigned!');
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`  Total Users:              ${users.length}`);
    console.log(`  Total Roles:              ${roles.length}`);
    console.log(`  Total Permissions:        ${await prisma.permission.count()}`);
    console.log(`  Roles with Users:         ${expectedDashboards.length - missingRoles.length}`);
    console.log(`  Roles without Users:      ${missingRoles.length}`);
    console.log(`  Dashboard Coverage:       ${((expectedDashboards.length - missingRoles.length) / expectedDashboards.length * 100).toFixed(1)}%`);

    console.log('\n✅ Role-Based Access Test Complete!\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRoleBasedAccess()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
