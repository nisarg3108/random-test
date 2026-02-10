// Get test data IDs for API testing
import prisma from './src/config/db.js';

async function getTestData() {
  try {
    console.log('🔍 Fetching test data IDs...\n');
    console.log('='.repeat(60));

    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (tenant) {
      console.log('\n✅ TENANT:');
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Name: ${tenant.name}`);
    } else {
      console.log('\n⚠️  No tenant found!');
    }

    // Get active project
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'IN_PROGRESS' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (project) {
      console.log('\n✅ PROJECT:');
      console.log(`   ID: ${project.id}`);
      console.log(`   Name: ${project.projectName}`);
      console.log(`   Code: ${project.projectCode}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Tenant ID: ${project.tenantId}`);
    } else {
      console.log('\n⚠️  No active projects found!');
    }

    // Get active employee
    const employee = await prisma.employee.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    if (employee) {
      console.log('\n✅ EMPLOYEE:');
      console.log(`   ID: ${employee.id}`);
      console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
      console.log(`   Email: ${employee.email}`);
      console.log(`   Status: ${employee.status}`);
      console.log(`   Tenant ID: ${employee.tenantId}`);
    } else {
      console.log('\n⚠️  No active employees found!');
    }

    // Get admin/manager user
    const user = await prisma.user.findFirst({
      where: {
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (user) {
      console.log('\n✅ USER (Admin/Manager):');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
    } else {
      console.log('\n⚠️  No admin/manager user found!');
    }

    // Check new tables
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 NEW TABLES VERIFICATION:');

    const memberCount = await prisma.projectMember.count();
    console.log(`   ProjectMember records: ${memberCount}`);

    const timesheetCount = await prisma.projectTimesheet.count();
    console.log(`   ProjectTimesheet records: ${timesheetCount}`);

    const dependencyCount = await prisma.projectMilestoneDependency.count();
    console.log(`   ProjectMilestoneDependency records: ${dependencyCount}`);

    // Check permissions
    console.log('\n' + '='.repeat(60));
    console.log('\n🔐 PERMISSIONS VERIFICATION:');

    const projectPerms = await prisma.permission.findMany({
      where: { code: { startsWith: 'PROJECT' } },
      select: { code: true, label: true }
    });
    console.log(`\n   Project Permissions (${projectPerms.length}):`);
    projectPerms.forEach(p => console.log(`   - ${p.code}: ${p.label}`));

    const timesheetPerms = await prisma.permission.findMany({
      where: { code: { startsWith: 'TIMESHEET' } },
      select: { code: true, label: true }
    });
    console.log(`\n   Timesheet Permissions (${timesheetPerms.length}):`);
    timesheetPerms.forEach(p => console.log(`   - ${p.code}: ${p.label}`));

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 COPY THESE IDs FOR API TESTING:\n');
    console.log('PowerShell variables:');
    if (project) console.log(`$projectId = "${project.id}"`);
    if (employee) console.log(`$employeeId = "${employee.id}"`);
    if (user) console.log(`$userId = "${user.id}"`);
    if (tenant) console.log(`$tenantId = "${tenant.id}"`);

    console.log('\n✅ Data fetch complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getTestData();
