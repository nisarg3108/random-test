import prisma from './src/config/db.js';

async function diagnose() {
  try {
    console.log('🔍 Diagnosing leave permissions issue...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      include: { tenant: true }
    });
    
    console.log(`Found ${users.length} users\n`);
    
    for (const user of users) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`User: ${user.email}`);
      console.log(`Legacy Role: ${user.role}`);
      console.log(`Tenant: ${user.tenant?.companyName} (ID: ${user.tenantId})`);
      
      // Get user's roles
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
      
      if (userRoles.length === 0) {
        console.log('⚠️  NO ROLES ASSIGNED IN UserRole TABLE!');
      } else {
        console.log(`\nAssigned Roles (${userRoles.length}):`);
        userRoles.forEach(ur => {
          console.log(`  - ${ur.role.name} (Role Tenant: ${ur.role.tenantId})`);
          
          // Filter leave-related permissions
          const leavePerms = ur.role.permissions
            .filter(rp => rp.permission.code.includes('leave'))
            .map(rp => rp.permission.code);
          
          if (leavePerms.length > 0) {
            console.log(`    Leave Permissions: ${leavePerms.join(', ')}`);
          } else {
            console.log(`    ⚠️  No leave permissions`);
          }
        });
      }
    }
    
    // Check what leave permissions exist
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📋 Available Leave Permissions:');
    const leavePerms = await prisma.permission.findMany({
      where: {
        code: { contains: 'leave' }
      }
    });
    leavePerms.forEach(p => console.log(`  - ${p.code}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
