import prisma from '../config/db.js';
import { assignPermissions } from '../core/rbac/rolePermission.seed.js';

async function fixHRPermissions() {
  try {
    console.log('Fixing HR permissions...');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    
    for (const tenant of tenants) {
      console.log(`Updating permissions for tenant: ${tenant.name}`);
      await assignPermissions(tenant.id);
    }
    
    console.log('HR permissions fixed successfully!');
  } catch (error) {
    console.error('Error fixing HR permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixHRPermissions();