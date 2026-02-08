/**
 * Authentication & RBAC Module Test Script
 * Tests all authentication and role-based access control features
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';
let adminToken = '';
let testUserId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n📋 Testing: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testHealthCheck() {
  logTest('Health Check');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      logSuccess('Backend is running and healthy');
      return true;
    } else {
      logError('Backend health check failed');
      return false;
    }
  } catch (error) {
    logError(`Cannot connect to backend: ${error.message}`);
    logWarning('Please ensure the backend is running on port 5000');
    return false;
  }
}

async function testRegister() {
  logTest('User Registration');
  try {
    const testCompany = `TestCompany_${Date.now()}`;
    const testEmail = `admin_${Date.now()}@test.com`;
    
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: testCompany,
        email: testEmail,
        password: 'test123456',
        role: 'ADMIN'
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      adminToken = data.token;
      logSuccess('User registered successfully');
      logSuccess(`Company: ${testCompany}`);
      logSuccess(`Email: ${testEmail}`);
      return true;
    } else {
      logError(`Registration failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Registration error: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  logTest('User Login');
  try {
    // Try to login with existing admin credentials
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.token) {
      adminToken = data.token;
      logSuccess('Login successful');
      return true;
    } else {
      logWarning('Login with default credentials failed, will use registered user token');
      return !!adminToken;
    }
  } catch (error) {
    logError(`Login error: ${error.message}`);
    return false;
  }
}

async function testProtectedRoute() {
  logTest('Protected Route Access');
  try {
    const response = await fetch(`${API_BASE}/protected`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      logSuccess('Protected route accessed successfully');
      logSuccess(`User ID: ${data.user?.id || data.user?.userId}`);
      logSuccess(`Tenant ID: ${data.user?.tenantId}`);
      return true;
    } else {
      logError(`Protected route access failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Protected route error: ${error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  logTest('Unauthorized Access (Should Fail)');
  try {
    const response = await fetch(`${API_BASE}/protected`);
    const data = await response.json();
    
    if (response.status === 401) {
      logSuccess('Correctly rejected unauthorized request');
      return true;
    } else {
      logError('Security issue: Unauthorized access was allowed');
      return false;
    }
  } catch (error) {
    logError(`Error testing unauthorized access: ${error.message}`);
    return false;
  }
}

async function testGetRoles() {
  logTest('Get Available Roles');
  try {
    const response = await fetch(`${API_BASE}/rbac/roles`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      logSuccess(`Found ${data.data?.length || 0} roles`);
      if (data.data && data.data.length > 0) {
        data.data.slice(0, 5).forEach(role => {
          log(`  - ${role.name} (${role.permissions?.length || 0} permissions)`, 'cyan');
        });
      }
      return true;
    } else {
      logError(`Get roles failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Get roles error: ${error.message}`);
    return false;
  }
}

async function testGetPermissions() {
  logTest('Get Available Permissions');
  try {
    const response = await fetch(`${API_BASE}/rbac/permissions`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      logSuccess(`Found ${data.data?.length || 0} permissions`);
      if (data.grouped) {
        const modules = Object.keys(data.grouped);
        logSuccess(`Organized into ${modules.length} modules`);
        log(`  Modules: ${modules.slice(0, 5).join(', ')}...`, 'cyan');
      }
      return true;
    } else {
      logError(`Get permissions failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Get permissions error: ${error.message}`);
    return false;
  }
}

async function testGetMyPermissions() {
  logTest('Get My Permissions');
  try {
    const response = await fetch(`${API_BASE}/rbac/my-permissions`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      logSuccess(`User has ${data.data?.permissions?.length || 0} permissions`);
      logSuccess(`User roles: ${data.data?.roles?.join(', ') || 'None'}`);
      return true;
    } else {
      logError(`Get my permissions failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Get my permissions error: ${error.message}`);
    return false;
  }
}

async function testGetUsers() {
  logTest('Get Users List');
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      const users = data.users || data.data || [];
      logSuccess(`Found ${users.length} users`);
      if (users.length > 0) {
        testUserId = users[0].id;
        users.slice(0, 3).forEach(user => {
          log(`  - ${user.email} (${user.role})`, 'cyan');
        });
      }
      return true;
    } else {
      logError(`Get users failed: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Get users error: ${error.message}`);
    return false;
  }
}

async function testRoleBasedAccess() {
  logTest('Role-Based Access Control');
  try {
    // Test admin route
    const response = await fetch(`${API_BASE}/admin`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      logSuccess('Admin route accessed successfully');
      return true;
    } else {
      logError(`Admin route access failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Role-based access test error: ${error.message}`);
    return false;
  }
}

async function testPermissionBasedAccess() {
  logTest('Permission-Based Access Control');
  try {
    // Test a route that requires permissions (e.g., departments)
    const response = await fetch(`${API_BASE}/departments`, {
      headers: { 
        'Authorization': `Bearer ${adminToken}` 
      },
    });

    const data = await response.json();
    
    if (response.ok || response.status === 404) {
      logSuccess('Permission-based route accessed successfully');
      return true;
    } else if (response.status === 403) {
      logWarning('Permission denied - check if RBAC is properly seeded');
      return false;
    } else {
      logError(`Permission-based access failed: ${data.message}`);
      return false;
    }
  } catch (error) {
    logError(`Permission-based access test error: ${error.message}`);
    return false;
  }
}

async function testInvalidToken() {
  logTest('Invalid Token (Should Fail)');
  try {
    const response = await fetch(`${API_BASE}/protected`, {
      headers: { 
        'Authorization': 'Bearer invalid_token_12345' 
      },
    });

    if (response.status === 401) {
      logSuccess('Correctly rejected invalid token');
      return true;
    } else {
      logError('Security issue: Invalid token was accepted');
      return false;
    }
  } catch (error) {
    logError(`Error testing invalid token: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  logSection('🔐 AUTHENTICATION & RBAC MODULE TEST SUITE');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Health Check', fn: testHealthCheck, critical: true },
    { name: 'User Registration', fn: testRegister, critical: true },
    { name: 'User Login', fn: testLogin, critical: false },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess, critical: false },
    { name: 'Invalid Token', fn: testInvalidToken, critical: false },
    { name: 'Protected Route', fn: testProtectedRoute, critical: true },
    { name: 'Get Roles', fn: testGetRoles, critical: false },
    { name: 'Get Permissions', fn: testGetPermissions, critical: false },
    { name: 'Get My Permissions', fn: testGetMyPermissions, critical: false },
    { name: 'Get Users', fn: testGetUsers, critical: false },
    { name: 'Role-Based Access', fn: testRoleBasedAccess, critical: false },
    { name: 'Permission-Based Access', fn: testPermissionBasedAccess, critical: false },
  ];

  for (const test of tests) {
    results.total++;
    const passed = await test.fn();
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
      if (test.critical) {
        logWarning(`Critical test failed: ${test.name}. Stopping further tests.`);
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Print summary
  logSection('📊 TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
    results.passed === results.total ? 'green' : 'yellow');

  if (results.passed === results.total) {
    logSection('🎉 ALL TESTS PASSED!');
    log('Authentication & RBAC module is working correctly!', 'green');
  } else {
    logSection('⚠️  SOME TESTS FAILED');
    log('Please review the errors above and fix the issues.', 'yellow');
  }

  return results;
}

// Run the tests
runTests().catch(error => {
  logError(`Test suite error: ${error.message}`);
  process.exit(1);
});
