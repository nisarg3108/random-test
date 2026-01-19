import prisma from './src/config/db.js';

async function testEmployeeUserIntegration() {
  console.log('Testing Employee-User Integration...\n');

  try {
    // Test 1: Check if all employees have user accounts
    const employeesWithUsers = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
            status: true
          }
        }
      }
    });

    console.log('✅ Employees with User Accounts:');
    employeesWithUsers.forEach(emp => {
      console.log(`  - ${emp.name} (${emp.email}) -> User Role: ${emp.user.role}`);
    });

    // Test 2: Check leave requests functionality
    const leaveRequests = await prisma.leaveRequest.findMany({
      include: {
        employee: {
          include: {
            user: true
          }
        },
        leaveType: true
      }
    });

    console.log('\n✅ Leave Requests:');
    if (leaveRequests.length === 0) {
      console.log('  - No leave requests found (this is normal for a fresh setup)');
    } else {
      leaveRequests.forEach(req => {
        console.log(`  - ${req.employee.name}: ${req.leaveType.name} (${req.status})`);
      });
    }

    // Test 3: Check leave types
    const leaveTypes = await prisma.leaveType.findMany();
    console.log('\n✅ Available Leave Types:');
    leaveTypes.forEach(type => {
      console.log(`  - ${type.name}: ${type.maxDays} days (${type.paid ? 'Paid' : 'Unpaid'})`);
    });

    console.log('\n🎉 Employee-User Integration Test Completed Successfully!');
    console.log('\nNext Steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend server: npm run dev (in frontend folder)');
    console.log('3. Login with employee credentials:');
    console.log('   - Email: managernisarg@gmail.com, Password: employee123');
    console.log('   - Email: empnisarg@gmail.com, Password: employee123');
    console.log('   - Email: bhavsarnisarg85120@gmail.com, Password: employee123');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmployeeUserIntegration();