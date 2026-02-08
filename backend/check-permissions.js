import prisma from './src/config/db.js';

async function checkPermissions() {
  try {
    console.log('Checking permissions...\n');
    
    // Check if permissions exist
    const perms = await prisma.permission.findMany({
      where: {
        code: {
          in: ['leaveType.view', 'leave.view']
        }
      }
    });
    
    console.log('Required permissions:');
    console.log(JSON.stringify(perms, null, 2));
    
    // Get the first user to check their roles and permissions
    const user = await prisma.user.findFirst({
      include: {
        tenant: true
      }
    });
    
    if (user) {
      console.log('\nFirst user:', {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name
      });
      
      // Check user roles
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });
      
      console.log('\nUser roles and permissions:');
      userRoles.forEach(ur => {
        console.log(`\nRole: ${ur.role.name} (id: ${ur.role.id}, tenantId: ${ur.role.tenantId})`);
        console.log('Permissions:');
        ur.role.permissions.forEach(rp => {
          console.log(`  - ${rp.permission.code}`);
        });
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
