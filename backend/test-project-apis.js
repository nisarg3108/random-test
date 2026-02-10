// Test script for Project Management Enhancement APIs
// Run with: node test-project-apis.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid JWT token from your system
// Login first and copy the token
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

// Test results storage
const results = {
  passed: [],
  failed: []
};

// Helper to log test results
function logTest(name, passed, details) {
  if (passed) {
    results.passed.push(name);
    console.log(`✅ ${name}`);
  } else {
    results.failed.push({ name, details });
    console.log(`❌ ${name}: ${details}`);
  }
}

// ============================================
// PROJECT MEMBER API TESTS
// ============================================

async function testProjectMemberAPIs() {
  console.log('\n📋 Testing Project Member APIs...\n');

  let testMemberId = null;
  const testProjectId = 'YOUR_PROJECT_ID'; // Replace with actual project ID
  const testEmployeeId = 'YOUR_EMPLOYEE_ID'; // Replace with actual employee ID

  try {
    // Test 1: Add project member
    console.log('Test 1: Add project member...');
    const addResponse = await fetch(`${BASE_URL}/projects/${testProjectId}/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        employeeId: testEmployeeId,
        role: 'Developer',
        allocationPercent: 50,
        startDate: new Date().toISOString(),
        responsibilities: 'Backend development'
      })
    });

    if (addResponse.ok) {
      const member = await addResponse.json();
      testMemberId = member.id;
      logTest('Add project member', true, member);
    } else {
      const error = await addResponse.text();
      logTest('Add project member', false, `Status ${addResponse.status}: ${error}`);
    }

    // Test 2: List project members
    console.log('\nTest 2: List project members...');
    const listResponse = await fetch(`${BASE_URL}/projects/${testProjectId}/members`, {
      headers
    });

    if (listResponse.ok) {
      const members = await listResponse.json();
      logTest('List project members', true, `Found ${members.length} members`);
    } else {
      logTest('List project members', false, `Status ${listResponse.status}`);
    }

    // Test 3: Check member availability
    console.log('\nTest 3: Check member availability...');
    const availResponse = await fetch(
      `${BASE_URL}/projects/employees/${testEmployeeId}/availability?startDate=${new Date().toISOString()}`,
      { headers }
    );

    if (availResponse.ok) {
      const availability = await availResponse.json();
      logTest('Check member availability', true, 
        `Available: ${availability.availablePercent}%, Current: ${availability.currentAllocation}%`);
    } else {
      logTest('Check member availability', false, `Status ${availResponse.status}`);
    }

    // Test 4: Get team capacity
    console.log('\nTest 4: Get project team capacity...');
    const capacityResponse = await fetch(
      `${BASE_URL}/projects/${testProjectId}/members/capacity`,
      { headers }
    );

    if (capacityResponse.ok) {
      const capacity = await capacityResponse.json();
      logTest('Get team capacity', true, 
        `Total allocation: ${capacity.totalAllocation}%, Members: ${capacity.totalMembers}`);
    } else {
      logTest('Get team capacity', false, `Status ${capacityResponse.status}`);
    }

    // Test 5: Update project member (if we created one)
    if (testMemberId) {
      console.log('\nTest 5: Update project member...');
      const updateResponse = await fetch(`${BASE_URL}/projects/members/${testMemberId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          allocationPercent: 75,
          role: 'Senior Developer'
        })
      });

      if (updateResponse.ok) {
        const updated = await updateResponse.json();
        logTest('Update project member', true, `Allocation: ${updated.allocationPercent}%`);
      } else {
        logTest('Update project member', false, `Status ${updateResponse.status}`);
      }
    }

    // Test 6: Test overallocation prevention
    console.log('\nTest 6: Test overallocation prevention (should fail)...');
    const overallocResponse = await fetch(`${BASE_URL}/projects/${testProjectId}/members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        employeeId: testEmployeeId,
        role: 'Tester',
        allocationPercent: 60, // This should fail if employee already has 50%
        startDate: new Date().toISOString()
      })
    });

    if (!overallocResponse.ok) {
      const error = await overallocResponse.json();
      logTest('Overallocation prevention', true, 'Correctly rejected overallocation');
    } else {
      logTest('Overallocation prevention', false, 'Should have rejected overallocation');
    }

  } catch (error) {
    console.error('Error testing project member APIs:', error);
  }
}

// ============================================
// TIMESHEET API TESTS
// ============================================

async function testTimesheetAPIs() {
  console.log('\n\n📅 Testing Timesheet APIs...\n');

  let testTimesheetId = null;
  const testEmployeeId = 'YOUR_EMPLOYEE_ID'; // Replace with actual employee ID

  try {
    // Test 1: Get or create timesheet for current week
    console.log('Test 1: Get or create timesheet...');
    const getOrCreateResponse = await fetch(
      `${BASE_URL}/timesheets/get-or-create?employeeId=${testEmployeeId}&weekStartDate=${new Date().toISOString()}`,
      { headers }
    );

    if (getOrCreateResponse.ok) {
      const timesheet = await getOrCreateResponse.json();
      testTimesheetId = timesheet.id;
      logTest('Get or create timesheet', true, 
        `Timesheet ${timesheet.id}, Status: ${timesheet.status}`);
    } else {
      const error = await getOrCreateResponse.text();
      logTest('Get or create timesheet', false, `Status ${getOrCreateResponse.status}: ${error}`);
    }

    // Test 2: List timesheets
    console.log('\nTest 2: List timesheets...');
    const listResponse = await fetch(
      `${BASE_URL}/timesheets?employeeId=${testEmployeeId}`,
      { headers }
    );

    if (listResponse.ok) {
      const timesheets = await listResponse.json();
      logTest('List timesheets', true, `Found ${timesheets.length} timesheets`);
    } else {
      logTest('List timesheets', false, `Status ${listResponse.status}`);
    }

    // Test 3: Submit empty timesheet (should fail)
    if (testTimesheetId) {
      console.log('\nTest 3: Submit empty timesheet (should fail)...');
      const submitEmptyResponse = await fetch(
        `${BASE_URL}/timesheets/${testTimesheetId}/submit`,
        {
          method: 'POST',
          headers
        }
      );

      if (!submitEmptyResponse.ok) {
        logTest('Submit empty timesheet validation', true, 'Correctly rejected empty timesheet');
      } else {
        logTest('Submit empty timesheet validation', false, 'Should have rejected empty timesheet');
      }
    }

    // Test 4: Get my timesheets
    console.log('\nTest 4: Get my timesheets...');
    const myTimesheetsResponse = await fetch(
      `${BASE_URL}/timesheets/employees/${testEmployeeId}`,
      { headers }
    );

    if (myTimesheetsResponse.ok) {
      const myTimesheets = await myTimesheetsResponse.json();
      logTest('Get my timesheets', true, `Found ${myTimesheets.length} timesheets`);
    } else {
      logTest('Get my timesheets', false, `Status ${myTimesheetsResponse.status}`);
    }

    // Test 5: Get pending approvals
    console.log('\nTest 5: Get pending approvals...');
    const pendingResponse = await fetch(
      `${BASE_URL}/timesheets/pending-approvals`,
      { headers }
    );

    if (pendingResponse.ok) {
      const pending = await pendingResponse.json();
      logTest('Get pending approvals', true, `Found ${pending.length} pending timesheets`);
    } else {
      logTest('Get pending approvals', false, `Status ${pendingResponse.status}`);
    }

    // Test 6: Get timesheet summary
    console.log('\nTest 6: Get timesheet summary...');
    const summaryResponse = await fetch(
      `${BASE_URL}/timesheets/summary`,
      { headers }
    );

    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      logTest('Get timesheet summary', true, 
        `Total: ${summary.totalTimesheets}, Submitted: ${summary.submittedCount}`);
    } else {
      logTest('Get timesheet summary', false, `Status ${summaryResponse.status}`);
    }

  } catch (error) {
    console.error('Error testing timesheet APIs:', error);
  }
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runTests() {
  console.log('🚀 Project Management Enhancement API Tests');
  console.log('==========================================\n');
  console.log('⚠️  Make sure to update AUTH_TOKEN, testProjectId, and testEmployeeId in the script!\n');

  await testProjectMemberAPIs();
  await testTimesheetAPIs();

  // Print summary
  console.log('\n\n📊 Test Summary');
  console.log('==========================================');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.passed.length > 0) {
    console.log('\nPassed tests:');
    results.passed.forEach(test => console.log(`  ✅ ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\nFailed tests:');
    results.failed.forEach(({ name, details }) => {
      console.log(`  ❌ ${name}`);
      console.log(`     ${details}`);
    });
  }
}

runTests().catch(console.error);
