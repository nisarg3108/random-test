/**
 * Comprehensive Test Runner for ERP System
 * 
 * Usage:
 *   node tests/test-runner.js [module] [email] [password]
 * 
 * Examples:
 *   node tests/test-runner.js all admin@company.com password
 *   node tests/test-runner.js payroll admin@company.com password
 *   node tests/test-runner.js hr admin@company.com password
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';

const TEST_USER = {
  email: process.env.TEST_EMAIL || process.argv[3] || 'admin@example.com',
  password: process.env.TEST_PASSWORD || process.argv[4] || 'admin123'
};

const MODULE_TO_TEST = process.argv[2] || 'all';

// Helper function for API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Test result tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

const logTest = (name, status, message = '') => {
  const icons = { pass: '✅', fail: '❌', skip: '⏭️' };
  console.log(`${icons[status]} ${name} ${message}`);
  results.tests.push({ name, status, message });
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else results.skipped++;
};

// Login
async function login() {
  console.log('\n🔐 Authentication');
  console.log('═══════════════════════════════════════');
  try {
    const response = await apiCall('POST', '/auth/login', TEST_USER);
    authToken = response.token || response.accessToken;
    logTest('Login', 'pass', `- ${TEST_USER.email}`);
    return true;
  } catch (error) {
    logTest('Login', 'fail', `- ${error.message}`);
    return false;
  }
}

// Import all test modules
const testModules = {
  payroll: require('./modules/payroll.test'),
  hr: require('./modules/hr.test'),
  finance: require('./modules/finance.test'),
  inventory: require('./modules/inventory.test'),
  crm: require('./modules/crm.test'),
  sales: require('./modules/sales.test'),
  purchase: require('./modules/purchase.test'),
  projects: require('./modules/projects.test'),
  assets: require('./modules/assets.test'),
  attendance: require('./modules/attendance.test'),
  communication: require('./modules/communication.test'),
  documents: require('./modules/documents.test'),
  reports: require('./modules/reports.test'),
  ap: require('./modules/ap.test')
};

// Main test runner
async function runTests() {
  console.log('\n🚀 ERP System Comprehensive Test Suite');
  console.log('================================================');
  console.log(`📧 User: ${TEST_USER.email}`);
  console.log(`🌐 API: ${API_BASE_URL}`);
  console.log(`📦 Module: ${MODULE_TO_TEST}\n`);
  
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n⚠️  Authentication failed. Update credentials.');
    return;
  }
  
  const modulesToRun = MODULE_TO_TEST === 'all' 
    ? Object.keys(testModules) 
    : [MODULE_TO_TEST];
  
  for (const moduleName of modulesToRun) {
    if (testModules[moduleName]) {
      await testModules[moduleName].run(apiCall, logTest);
    }
  }
  
  // Summary
  console.log('\n\n📊 Test Summary');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📝 Total: ${results.tests.length}`);
  
  const successRate = ((results.passed / results.tests.length) * 100).toFixed(2);
  console.log(`\n🎯 Success Rate: ${successRate}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => t.status === 'fail').forEach(t => {
      console.log(`   - ${t.name}: ${t.message}`);
    });
  }
}

runTests();
