// Comprehensive API Test Suite for Project Management Enhancement
import http from 'http';

const BASE_URL = 'http://localhost:5000';
let authToken = null;

// Test data
const testData = {
  projectId: 'b0faf6c6-921f-4486-b381-370590b2f7d5',
  employeeId: 'd970fd9d-c4d8-4409-835b-707b9a153ef0',  // Test user employee ID
  userId: '581e6dd4-f795-4524-9c27-622d0e59284e',       // Test user ID
  tenantId: 'c3c0c484-00f4-4975-8f9a-1db32ca3e5c5'
};

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, useAuth = true) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => reject(error));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Log test result
function logTest(name, passed, details = '') {
  if (passed) {
    results.passed.push(name);
    console.log(`  ✅ ${name}`);
    if (details) console.log(`     ${details}`);
  } else {
    results.failed.push({ name, details });
    console.log(`  ❌ ${name}`);
    if (details) console.log(`     ${details}`);
  }
}

// Login test
async function testLogin() {
  console.log('\n🔐 Testing Authentication...\n');
  
  try {
    // Try to login with the user
    const loginBody = {
      email: 'apitest@test.com',
      password: 'Test@1234'
    };

    const response = await makeRequest('POST', '/api/auth/login', loginBody, false);
    
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      logTest('Login successful', true, `Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Login failed', false, `Status: ${response.status}, Response: ${JSON.stringify(response.data)}`);
      results.warnings.push('⚠️  Cannot test authenticated endpoints without login. Please update password in script.');
      return false;
    }
  } catch (error) {
    logTest('Login error', false, error.message);
    return false;
  }
}

// Project Member API Tests
async function testProjectMemberAPIs() {
  console.log('\n\n👥 Testing Project Member APIs...\n');
  
  let memberId = null;

  try {
    // Test 1: Add project member
    console.log('Test 1: Add project member');
    const memberData = {
      employeeId: testData.employeeId,
      role: 'Backend Developer',
      allocationPercent: 50,
      startDate: new Date().toISOString(),
      responsibilities: 'Implement Project Management APIs and database schema'
    };

    const addResponse = await makeRequest('POST', `/api/projects/${testData.projectId}/members`, memberData);
    if (addResponse.status === 201) {
      memberId = addResponse.data.id;
      logTest('Add project member', true, `Member ID: ${memberId}, Allocation: ${addResponse.data.allocationPercent}%`);
    } else {
      logTest('Add project member', false, `Status: ${addResponse.status}, ${JSON.stringify(addResponse.data)}`);
    }

    // Test 2: List project members
    console.log('\nTest 2: List project members');
    const listResponse = await makeRequest('GET', `/api/projects/${testData.projectId}/members`);
    if (listResponse.status === 200) {
      logTest('List project members', true, `Found ${listResponse.data.length} members`);
    } else {
      logTest('List project members', false, `Status: ${listResponse.status}`);
    }

    // Test 3: Check employee availability
    console.log('\nTest 3: Check employee availability');
    const availResponse = await makeRequest('GET', `/api/projects/employees/${testData.employeeId}/availability?startDate=${new Date().toISOString()}`);
    if (availResponse.status === 200) {
      const avail = availResponse.data;
      logTest('Check employee availability', true, 
        `Current: ${avail.currentAllocation}%, Available: ${avail.availablePercent}%, Projects: ${avail.projects?.length || 0}`);
    } else {
      logTest('Check employee availability', false, `Status: ${availResponse.status}`);
    }

    // Test 4: Get team capacity
    console.log('\nTest 4: Get project team capacity');
    const capacityResponse = await makeRequest('GET', `/api/projects/${testData.projectId}/members/capacity`);
    if (capacityResponse.status === 200) {
      const capacity = capacityResponse.data;
      logTest('Get team capacity', true, 
        `Members: ${capacity.totalMembers}, Total allocation: ${capacity.totalAllocation}%`);
    } else {
      logTest('Get team capacity', false, `Status: ${capacityResponse.status}`);
    }

    // Test 5: Try to overallocate (should fail)
    console.log('\nTest 5: Test overallocation prevention');
    const overallocData = {
      employeeId: testData.employeeId,
      role: 'Frontend Developer',
      allocationPercent: 60,  // This should push over 100%
      startDate: new Date().toISOString()
    };

    const overallocResponse = await makeRequest('POST', `/api/projects/${testData.projectId}/members`, overallocData);
    if (overallocResponse.status >= 400) {
      logTest('Overallocation prevention', true, 'Correctly rejected overallocation');
    } else {
      logTest('Overallocation prevention', false, 'Should have rejected overallocation');
    }

    // Test 6: Update member (if created)
    if (memberId) {
      console.log('\nTest 6: Update project member');
      const updateData = {
        allocationPercent: 75,
        role: 'Senior Backend Developer'
      };

      const updateResponse = await makeRequest('PUT', `/api/projects/members/${memberId}`, updateData);
      if (updateResponse.status === 200) {
        logTest('Update project member', true, `New allocation: ${updateResponse.data.allocationPercent}%`);
      } else {
        logTest('Update project member', false, `Status: ${updateResponse.status}`);
      }
    }

  } catch (error) {
    console.error('Error in project member tests:', error.message);
  }
}

// Timesheet API Tests
async function testTimesheetAPIs() {
  console.log('\n\n📅 Testing Timesheet APIs...\n');
  
  let timesheetId = null;

  try {
    // Test 1: Get or create timesheet
    console.log('Test 1: Get or create timesheet for current week');
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const weekStart = monday.toISOString().split('T')[0];

    const timesheetResponse = await makeRequest('GET', 
      `/api/timesheets/get-or-create?employeeId=${testData.employeeId}&weekStartDate=${weekStart}`);
    
    if (timesheetResponse.status === 200) {
      timesheetId = timesheetResponse.data.id;
      logTest('Get or create timesheet', true, 
        `Timesheet ID: ${timesheetId}, Status: ${timesheetResponse.data.status}, Week: ${timesheetResponse.data.weekStartDate}`);
    } else {
      logTest('Get or create timesheet', false, `Status: ${timesheetResponse.status}, ${JSON.stringify(timesheetResponse.data)}`);
    }

    // Test 2: List timesheets
    console.log('\nTest 2: List timesheets');
    const listResponse = await makeRequest('GET', `/api/timesheets?employeeId=${testData.employeeId}`);
    if (listResponse.status === 200) {
      logTest('List timesheets', true, `Found ${listResponse.data.length} timesheets`);
    } else {
      logTest('List timesheets', false, `Status: ${listResponse.status}`);
    }

    // Test 3: Try to submit empty timesheet (should fail)
    if (timesheetId) {
      console.log('\nTest 3: Submit empty timesheet (should fail)');
      const submitResponse = await makeRequest('POST', `/api/timesheets/${timesheetId}/submit`);
      if (submitResponse.status >= 400) {
        logTest('Empty timesheet validation', true, 'Correctly rejected empty timesheet');
      } else {
        logTest('Empty timesheet validation', false, 'Should have rejected empty timesheet');
      }
    }

    // Test 4: Get my timesheets
    console.log('\nTest 4: Get my timesheets');
    const myTimesheetsResponse = await makeRequest('GET', `/api/timesheets/employees/${testData.employeeId}`);
    if (myTimesheetsResponse.status === 200) {
      logTest('Get my timesheets', true, `Found ${myTimesheetsResponse.data.length} timesheets`);
    } else {
      logTest('Get my timesheets', false, `Status: ${myTimesheetsResponse.status}`);
    }

    // Test 5: Get pending approvals
    console.log('\nTest 5: Get pending approvals');
    const pendingResponse = await makeRequest('GET', '/api/timesheets/pending-approvals');
    if (pendingResponse.status === 200) {
      logTest('Get pending approvals', true, `Found ${pendingResponse.data.length} pending timesheets`);
    } else {
      logTest('Get pending approvals', false, `Status: ${pendingResponse.status}`);
    }

    // Test 6: Get timesheet summary
    console.log('\nTest 6: Get timesheet summary');
    const summaryResponse = await makeRequest('GET', '/api/timesheets/summary');
    if (summaryResponse.status === 200) {
      logTest('Get timesheet summary', true, 
        `Total: ${summaryResponse.data.totalTimesheets || 0}, Pending: ${summaryResponse.data.pendingCount || 0}`);
    } else {
      logTest('Get timesheet summary', false, `Status: ${summaryResponse.status}`);
    }

  } catch (error) {
    console.error('Error in timesheet tests:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PROJECT MANAGEMENT ENHANCEMENT - API TEST SUITE');
  console.log('='.repeat(70));

  // Login first
  const loginSuccess = await testLogin();

  if (loginSuccess) {
    // Run authenticated tests
    await testProjectMemberAPIs();
    await testTimesheetAPIs();
  } else {
    console.log('\n⚠️  Skipping authenticated tests - login failed');
    console.log('   Please update the password in the script and try again.');
  }

  // Print summary
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  if (results.warnings.length > 0) {
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
  }

  if (results.passed.length > 0) {
    console.log('\n✅ Passed tests:');
    results.passed.forEach(test => console.log(`   • ${test}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed tests:');
    results.failed.forEach(({ name, details }) => {
      console.log(`   • ${name}`);
      if (details) console.log(`     ${details}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`   ${warning}`));
  }

  console.log('\n' + '='.repeat(70));
  
  const passRate = results.passed.length / (results.passed.length + results.failed.length) * 100;
  if (passRate === 100) {
    console.log('🎉 ALL TESTS PASSED!');
  } else if (passRate >= 80) {
    console.log(`✅ ${passRate.toFixed(0)}% tests passed - Good job!`);
  } else if (passRate >= 50) {
    console.log(`⚠️  ${passRate.toFixed(0)}% tests passed - Some issues to fix`);
  } else {
    console.log(`❌ ${passRate.toFixed(0)}% tests passed - Needs attention`);
  }
  console.log('='.repeat(70) + '\n');
}

runAllTests().catch(console.error);
