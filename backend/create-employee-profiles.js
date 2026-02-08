import prisma from './src/config/db.js';

async function createEmployeeProfiles() {
  console.log('🚀 Creating employee profiles for users without them...\n');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        employee: true,
        department: true
      }
    });

    console.log(`Found ${users.length} active users`);
    
    let created = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Skip if user already has an employee profile
        if (user.employee) {
          console.log(`✓ User ${user.email} already has employee profile`);
          skipped++;
          continue;
        }

        // Get or create a default department
        let department = user.department;
        if (!department) {
          department = await prisma.department.findFirst({
            where: { tenantId: user.tenantId }
          });

          // If no department exists, create a default one
          if (!department) {
            department = await prisma.department.create({
              data: {
                tenantId: user.tenantId,
                name: 'General'
              }
            });
            console.log(`Created default department for tenant ${user.tenantId}`);
          }
        }

        // Generate employee code
        const employeeCount = await prisma.employee.count({
          where: { tenantId: user.tenantId }
        });
        const employeeCode = `EMP${String(employeeCount + 1).padStart(4, '0')}`;

        // Extract name from email if needed
        const emailName = user.email.split('@')[0];
        const name = emailName.charAt(0).toUpperCase() + emailName.slice(1);

        // Create employee profile
        const employee = await prisma.employee.create({
          data: {
            tenantId: user.tenantId,
            userId: user.id,
            departmentId: department.id,
            employeeCode,
            name,
            email: user.email,
            designation: user.role || 'Employee',
            joiningDate: new Date(),
            status: 'ACTIVE'
          }
        });

        console.log(`✅ Created employee profile for ${user.email} (${employeeCode})`);
        created++;

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Created: ${created} employee profiles`);
    console.log(`   - Skipped: ${skipped} (already have profiles)`);
    console.log(`   - Total: ${users.length} users processed`);
    console.log('\n✅ Employee profile creation completed!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createEmployeeProfiles();
