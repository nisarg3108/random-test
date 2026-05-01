import fetch from 'node-fetch';
import prisma from './src/config/db.js';

const API_BASE = 'http://localhost:5000/api';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAttendanceEmployeeProfile() {
  log('\n🧪 Testing Attendance - Employee Profile Fix', 'blue');
  log('='.repeat(50), 'blue');

  try {
    // Test 1: Register a new user
    log('\n📝 Test 1: Register a new user', 'yellow');
    const testEmail = `attendance-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testCompany = `TestCo-${Date.now()}`;

    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        companyName: testCompany,
        role: 'ADMIN'
      })
    });

    if (!registerRes.ok) {
      const error = await registerRes.text();
      log(`❌ Registration failed: ${error}`, 'red');
      return;
    }

    const registerData = await registerRes.json();
    const token = registerData.token;
    log(`✅ User registered successfully`, 'green');
    log(`   Email: ${testEmail}`, 'green');

    // Test 2: Verify database - Check if employee was created
    log('\n📊 Test 2: Verify employee record in database', 'yellow');
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        employee: true
      }
    });

    if (!dbUser) {
      log(`❌ User not found in database`, 'red');
      return;
    }

    if (!dbUser.employee) {
      log(`❌ Employee profile not created for user`, 'red');
      return;
    }

    log(`✅ Employee profile exists`, 'green');
    log(`   Employee ID: ${dbUser.employee.id}`, 'green');
    log(`   Employee Code: ${dbUser.employee.employeeCode}`, 'green');
    log(`   User ID: ${dbUser.employee.userId}`, 'green');
    log(`   Department ID: ${dbUser.employee.departmentId}`, 'green');

    // Verify userId is explicitly set
    if (!dbUser.employee.userId) {
      log(`⚠️  WARNING: Employee.userId is not set!`, 'red');
      return;
    }

    // Test 3: Try to fetch my-profile endpoint
    log('\n🔐 Test 3: Call /api/employees/my-profile endpoint', 'yellow');
    const profileRes = await fetch(`${API_BASE}/employees/my-profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!profileRes.ok) {
      const error = await profileRes.json();
      log(`❌ Failed to get employee profile: ${error.error || error.message}`, 'red');
      return;
    }

    const profile = await profileRes.json();
    log(`✅ Successfully fetched employee profile`, 'green');
    log(`   Name: ${profile.name}`, 'green');
    log(`   Email: ${profile.email}`, 'green');
    log(`   Designation: ${profile.designation}`, 'green');

    // Test 4: Try to fetch clock status (used by attendance module)
    log('\n⏰ Test 4: Call /api/attendance/clock-status endpoint', 'yellow');
    const clockStatusRes = await fetch(`${API_BASE}/attendance/clock-status/${profile.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!clockStatusRes.ok) {
      const error = await clockStatusRes.json();
      log(`⚠️  Clock status call failed: ${error.message}`, 'yellow');
      // This is expected if no clock records exist yet
    } else {
      const clockStatus = await clockStatusRes.json();
      log(`✅ Successfully fetched clock status`, 'green');
      log(`   Status: ${JSON.stringify(clockStatus)}`, 'green');
    }

    // Test 5: Verify department was created
    log('\n🏢 Test 5: Verify department was created', 'yellow');
    const department = await prisma.department.findUnique({
      where: { id: dbUser.employee.departmentId }
    });

    if (!department) {
      log(`❌ Department not found`, 'red');
      return;
    }

    log(`✅ Department exists and is linked`, 'green');
    log(`   Department ID: ${department.id}`, 'green');
    log(`   Department Name: ${department.name}`, 'green');

    log('\n' + '='.repeat(50), 'blue');
    log('✅ ALL TESTS PASSED! Attendance module should work correctly.', 'green');

  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAttendanceEmployeeProfile();
