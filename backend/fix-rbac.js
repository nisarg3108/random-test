import prisma from './src/config/db.js';
import { assignRoleToUser } from './src/core/rbac/permissions.seed.js';

async function fixMissingRoles() {
  try {
    const hrStaff = await prisma.user.findUnique({ where: { email: 'hr.staff@test.com' } });
    const financeManager = await prisma.user.findUnique({ where: { email: 'finance.manager@test.com' } });
    
    if (hrStaff) {
      await assignRoleToUser(hrStaff.id, 'HR_STAFF', hrStaff.tenantId);
      console.log('✅ Fixed hr.staff@test.com');
    }
    
    if (financeManager) {
      await assignRoleToUser(financeManager.id, 'FINANCE_MANAGER', financeManager.tenantId);
      console.log('✅ Fixed finance.manager@test.com');
    }
    
    console.log('✅ All RBAC roles fixed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingRoles().then(() => process.exit(0)).catch(() => process.exit(1));
