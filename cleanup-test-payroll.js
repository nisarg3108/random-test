/**
 * Clean up test payroll data
 * Deletes test payroll cycles and payslips to allow fresh testing
 */

import prisma from './backend/src/config/db.js';

async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test payroll data...\n');

    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found!');
      return;
    }

    // Get all test cycles (including "Component Engine Test", "Disbursement Test")
    const testCycles = await prisma.payrollCycle.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { name: { contains: 'Test Cycle' } },
          { name: { contains: 'Component Engine Test' } },
          { name: { contains: 'Disbursement Test' } }
        ]
      },
      select: { id: true }
    });

    const cycleIds = testCycles.map(c => c.id);

    // Delete payslips first
    const deletedPayslips = await prisma.payslip.deleteMany({
      where: {
        payrollCycleId: {
          in: cycleIds
        }
      }
    });

    console.log(`✅ Deleted ${deletedPayslips.count} test payslips`);

    // Delete test payroll cycles
    const deletedCycles = await prisma.payrollCycle.deleteMany({
      where: {
        id: {
          in: cycleIds
        }
      }
    });

    console.log(`✅ Deleted ${deletedCycles.count} test payroll cycles`);
    
    // Also delete disbursements for test cycles
    const deletedDisbursements = await prisma.salaryDisbursement.deleteMany({
      where: {
        payrollCycleId: {
          in: cycleIds
        }
      }
    });
    
    console.log(`✅ Deleted ${deletedDisbursements.count} test disbursements`);

    console.log('\n✅ Cleanup completed!\n');

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
