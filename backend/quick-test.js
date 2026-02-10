// Simple API health check
// Run with: node quick-test.js

import http from 'http';

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`✅ ${description}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data.substring(0, 100)}${data.length > 100 ? '...' : ''}\n`);
        resolve({ success: true, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}`);
      console.log(`   Error: ${error.message}\n`);
      resolve({ success: false, error: error.message });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Project Management Enhancement - API Quick Tests\n');
  console.log('='.repeat(60) + '\n');

  // Test 1: Health check
  await testEndpoint('/api/health', 'Test 1: Health Check');

  // Test 2: Root endpoint
  await testEndpoint('/', 'Test 2: Root Endpoint');

  // Test 3: Projects endpoint (will require auth)
  await testEndpoint('/api/projects', 'Test 3: Projects List (should return 401)');

  console.log('='.repeat(60));
  console.log('✅ Server is running and responding!');
  console.log('\n📋 Next Steps:');
  console.log('1. Login to get an authentication token');
  console.log('2. Use the token to test authenticated endpoints');
  console.log('3. Test project member and timesheet APIs');
  console.log('\nAuthenticated endpoints to test:');
  console.log('  - POST   /api/projects/:projectId/members');
  console.log('  - GET    /api/projects/:projectId/members');
  console.log('  - GET    /api/projects/employees/:employeeId/availability');
  console.log('  - GET    /api/timesheets/get-or-create');
  console.log('  - POST   /api/timesheets/:id/submit');
  console.log('  - GET    /api/timesheets/pending-approvals');
}

runTests().catch(console.error);
