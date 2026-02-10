// Create test user with known password for API testing
import prisma from './src/config/db.js';
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    console.log('🔐 Creating test user for API testing...\n');

    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found!');
      return;
    }

    // Check if test user exists
    let testUser = await prisma.user.findUnique({
      where: { email: 'apitest@test.com' }
    });

    const testPassword = 'Test@1234';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    if (testUser) {
      console.log('⚠️  Test user already exists, updating password...');
      testUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { password: hashedPassword }
      });
    } else {
      console.log('📝 Creating new test user...');
      testUser = await prisma.user.create({
        data: {
          email: 'apitest@test.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          tenantId: tenant.id
        }
      });
    }

    // Check if employee exists
    let testEmployee = await prisma.employee.findFirst({
      where: { email: 'apitest@test.com' }
    });

    if (!testEmployee) {
      console.log('👤 Creating employee record...');
      
      // Get a department
      let department = await prisma.department.findFirst({
        where: { tenantId: tenant.id }
      });
      
      if (!department) {
        // Create a default department
        department = await prisma.department.create({
          data: {
            code: 'TEST',
            name: 'Test Department',
            tenantId: tenant.id
          }
        });
      }
      
      testEmployee = await prisma.employee.create({
        data: {
          employeeCode: 'EMP-TEST-001',
          name: 'API Tester',
          email: 'apitest@test.com',
          phone: '1234567890',
          designation: 'Test Engineer',
          joiningDate: new Date(),
          status: 'ACTIVE',
          tenantId: tenant.id,
          userId: testUser.id,
          departmentId: department.id
        }
      });
    }

    console.log('\n✅ Test user created successfully!\n');
    console.log('='.repeat(60));
    console.log('📋 TEST USER CREDENTIALS:');
    console.log('='.repeat(60));
    console.log(`Email:    apitest@test.com`);
    console.log(`Password: ${testPassword}`);
    console.log(`Role:     ${testUser.role}`);
    console.log(`User ID:  ${testUser.id}`);
    console.log(`Employee ID: ${testEmployee.id}`);
    console.log('='.repeat(60));
    console.log('\n💡 Update the test script with these credentials\n');

    // Update test data file
    console.log('PowerShell variables:');
    console.log(`$testEmail = "apitest@test.com"`);
    console.log(`$testPassword = "${testPassword}"`);
    console.log(`$testUserId = "${testUser.id}"`);
    console.log(`$testEmployeeId = "${testEmployee.id}"`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
