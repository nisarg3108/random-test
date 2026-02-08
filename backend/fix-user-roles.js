import prisma from './src/config/db.js';
import { assignRoleToUser } from './src/core/rbac/permissions.seed.js';

async function fixUserRoles() {
  try {
    console.log('🔧 Fixing user role assignments...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    for (const user of users) {
      console.log(`\nProcessing: ${user.email} (Role: ${user.role})`);
      
      if (!user.role || !user.tenantId) {
        console.log('  ⚠️  Skipping - missing role or tenantId');
        continue;
      }
      
      try {
        // Assign role based on legacy role field
        await assignRoleToUser(user.id, user.role, user.tenantId);
        console.log(`  ✅ Assigned ${user.role} role`);
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n✨ Done! Verifying assignments...\n');
    
    // Verify
    for (const user of users) {
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true }
              }
            }
          }
        }
      });
      
      console.log(`${user.email}:`);
      if (userRoles.length === 0) {
        console.log('  ⚠️  Still no roles!');
      } else {
        userRoles.forEach(ur => {
          const leavePerms = ur.role.permissions
            .filter(rp => rp.permission.code.includes('leave'))
            .map(rp => rp.permission.code);
          console.log(`  ✓ ${ur.role.name} - Leave perms: ${leavePerms.join(', ')}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
