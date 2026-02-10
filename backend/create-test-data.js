// Create test data for Project Management API testing
import prisma from './src/config/db.js';

async function createTestData() {
  try {
    console.log('🌱 Creating test data for Project Management APIs...\n');
    console.log('='.repeat(60));

    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found! Please create a tenant first.');
      return;
    }
    console.log(`✅ Using tenant: ${tenant.name} (${tenant.id})`);

    // Get or create user
    let user = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
    
    if (!user) {
      console.log('\n⚠️  No active user found!');
      return;
    }
    console.log(`✅ Using user: ${user.email} (${user.id})`);

    // Get or create employee
    let employee = await prisma.employee.findFirst({
      where: { 
        status: 'ACTIVE',
        tenantId: tenant.id 
      }
    });

    if (!employee) {
      console.log('\n⚠️  No active employee found!');
      return;
    }
    console.log(`✅ Using employee: ${employee.email} (${employee.id})`);

    // Create test project if none exists
    let project = await prisma.project.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { status: 'ACTIVE' },
          { status: 'IN_PROGRESS' }
        ]
      }
    });

    if (!project) {
      console.log('\n📦 Creating test project...');
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90); // 90 days from now

      project = await prisma.project.create({
        data: {
          projectCode: 'ERP-PM-001',
          projectName: 'ERP Enhancement Project',
          description: 'Test project for Project Management API testing - includes team management, timesheet tracking, and milestone dependencies',
          projectManager: user.id,
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          type: 'INTERNAL',
          startDate: startDate,
          endDate: endDate,
          tenantId: tenant.id,
          estimatedBudget: 100000,
          createdBy: user.id
        }
      });
      console.log(`   ✅ Created project: ${project.projectName} (${project.id})`);
    } else {
      console.log(`\n✅ Found existing project: ${project.projectName} (${project.id})`);
    }

    // Create a milestone if none exists
    const milestone = await prisma.projectMilestone.findFirst({
      where: { projectId: project.id }
    });

    if (!milestone) {
      console.log('\n📍 Creating test milestone...');
      const milestoneDate = new Date();
      milestoneDate.setDate(milestoneDate.getDate() + 30);

      const newMilestone = await prisma.projectMilestone.create({
        data: {
          milestoneName: 'Week 1 - Backend Foundation',
          description: 'Complete database schema, services, controllers, and routes',
          projectId: project.id,
          dueDate: milestoneDate,
          status: 'IN_PROGRESS',
          tenantId: tenant.id,
          createdBy: user.id
        }
      });
      console.log(`   ✅ Created milestone: ${newMilestone.milestoneName} (${newMilestone.id})`);
    } else {
      console.log(`\n✅ Found existing milestone: ${milestone.milestoneName}`);
    }

    // Get second employee for testing multiple team members
    const employees = await prisma.employee.findMany({
      where: { 
        status: 'ACTIVE',
        tenantId: tenant.id 
      },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TEST DATA READY!\n');
    console.log('📋 COPY THESE IDs FOR API TESTING:\n');
    console.log('PowerShell variables (paste all at once):');
    console.log(`$projectId = "${project.id}"`);
    console.log(`$employeeId = "${employee.id}"`);
    console.log(`$userId = "${user.id}"`);
    console.log(`$tenantId = "${tenant.id}"`);
    console.log(`$userEmail = "${user.email}"`);
    
    if (employees.length > 1) {
      console.log(`\n# Additional employees for testing:`);
      employees.forEach((emp, idx) => {
        if (idx > 0 && emp.email) {
          console.log(`$employee${idx}Id = "${emp.id}" # ${emp.email}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🧪 READY TO TEST APIs!\n');
    console.log('Next steps:');
    console.log('1. Get auth token: Login with $userEmail');
    console.log('2. Test add member: POST /api/projects/$projectId/members');
    console.log('3. Test availability: GET /api/projects/employees/$employeeId/availability');
    console.log('4. Test timesheet: GET /api/timesheets/get-or-create');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
