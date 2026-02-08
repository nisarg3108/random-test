import prisma from './src/config/db.js';

async function testPermissionCheck() {
  try {
    // Get first user
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, role: true, tenantId: true }
    });
    
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('Testing permission check for user:', user);
    console.log('User role:', user.role);
    
    if (user.role === 'ADMIN') {
      console.log('✅ User is ADMIN - should bypass all checks');
    }
    
    // Try to get user roles
    console.log('\nQuerying userRoles...');
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });
    
    console.log(`Found ${userRoles.length} user role assignments`);
    
    if (userRoles.length > 0) {
      userRoles.forEach(ur => {
        console.log(`\nRole: ${ur.role?.name || 'NULL'}`);
        if (ur.role) {
          console.log(`  Permissions: ${ur.role.permissions.length}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionCheck();
