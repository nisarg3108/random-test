import prisma from './src/config/db.js';

async function listPermissions() {
  try {
    // Check all leave-related permissions
    const leavePerms = await prisma.permission.findMany({
      where: {
        code: { contains: 'leave' }
      },
      orderBy: { code: 'asc' }
    });
    
    console.log(`Found ${leavePerms.length} leave-related permissions:\n`);
    leavePerms.forEach(p => {
      console.log(`  ${p.code} - ${p.label}`);
    });
    
    // Check if roles exist
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        tenantId: true
      }
    });
    
    console.log(`\n\nFound ${roles.length} roles:`);
    roles.forEach(r => {
      console.log(`  ${r.name} (tenantId: ${r.tenantId})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listPermissions();
