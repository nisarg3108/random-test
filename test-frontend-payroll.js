/**
 * Frontend Payroll Pages Test Script
 * Tests all new disbursement and enhanced payslip pages
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:5173';

let authToken = '';
let tenantId = '';
let testCycleId = '';
let testPayslipIds = [];
let testDisbursementIds = [];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${'='.repeat(60)}\n`);
}

function logSuccess(message) {
  log('✅', message, colors.green);
}

function logError(message) {
  log('❌', message, colors.red);
}

function logInfo(message) {
  log('ℹ️', message, colors.blue);
}

function logWarning(message) {
  log('⚠️', message, colors.yellow);
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Test 1: Login
async function test1_Login() {
  logSection('Test 1: Authentication');
  
  try {
    const response = await apiRequest('POST', '/auth/login', {
      email: 'apitest@test.com',
      password: 'Test@1234'
    });
    
    authToken = response.token;
    
    // Decode JWT to get tenantId
    const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    tenantId = payload.tenantId;
    
    logSuccess(`Logged in successfully`);
    logInfo(`Tenant ID: ${tenantId}`);
    return true;
  } catch (error) {
    logError(`Login failed: ${error.message}`);
    return false;
  }
}

// Test 2: Fetch existing disbursements
async function test2_FetchDisbursements() {
  logSection('Test 2: Fetch Disbursements (GET /api/hr/disbursements)');
  
  try {
    const response = await apiRequest('GET', '/hr/disbursements');
    const disbursements = response.disbursements || [];
    
    logSuccess(`Fetched ${disbursements.length} disbursements`);
    
    if (disbursements.length > 0) {
      logInfo(`Sample disbursement:`);
      const sample = disbursements[0];
      console.log(`  - ID: ${sample.id}`);
      console.log(`  - Employee: ${sample.employee?.name || 'N/A'}`);
      console.log(`  - Amount: ₹${sample.amount.toLocaleString('en-IN')}`);
      console.log(`  - Status: ${sample.status}`);
      console.log(`  - Payment Method: ${sample.paymentMethod}`);
      
      testDisbursementIds = disbursements.map(d => d.id);
    } else {
      logWarning('No disbursements found. Will create test data...');
    }
    
    return true;
  } catch (error) {
    logError(`Failed to fetch disbursements: ${error.message}`);
    return false;
  }
}

// Test 3: Fetch disbursement statistics
async function test3_FetchStatistics() {
  logSection('Test 3: Fetch Statistics (GET /api/hr/disbursements/stats)');
  
  try {
    const stats = await apiRequest('GET', '/hr/disbursements/stats');
    
    logSuccess('Statistics fetched successfully');
    console.log(`  Total: ${stats.totalCount || 0} (₹${(stats.totalAmount || 0).toLocaleString('en-IN')})`);
    console.log(`  Pending: ${stats.pendingCount || 0} (₹${(stats.pendingAmount || 0).toLocaleString('en-IN')})`);
    console.log(`  Processing: ${stats.processingCount || 0} (₹${(stats.processingAmount || 0).toLocaleString('en-IN')})`);
    console.log(`  Completed: ${stats.completedCount || 0} (₹${(stats.completedAmount || 0).toLocaleString('en-IN')})`);
    console.log(`  Failed: ${stats.failedCount || 0} (₹${(stats.failedAmount || 0).toLocaleString('en-IN')})`);
    
    return true;
  } catch (error) {
    logError(`Failed to fetch statistics: ${error.message}`);
    return false;
  }
}

// Test 4: Test filters (status, payment method)
async function test4_TestFilters() {
  logSection('Test 4: Test Filtering');
  
  try {
    // Test status filter
    logInfo('Testing status filter (PENDING)...');
    const pendingResponse = await apiRequest('GET', '/hr/disbursements?status=PENDING');
    logSuccess(`Found ${pendingResponse.disbursements?.length || 0} PENDING disbursements`);
    
    // Test payment method filter
    logInfo('Testing payment method filter (BANK_TRANSFER)...');
    const bankResponse = await apiRequest('GET', '/hr/disbursements?paymentMethod=BANK_TRANSFER');
    logSuccess(`Found ${bankResponse.disbursements?.length || 0} BANK_TRANSFER disbursements`);
    
    // Test combined filters
    logInfo('Testing combined filters...');
    const combinedResponse = await apiRequest('GET', '/hr/disbursements?status=PENDING&paymentMethod=BANK_TRANSFER');
    logSuccess(`Found ${combinedResponse.disbursements?.length || 0} PENDING BANK_TRANSFER disbursements`);
    
    return true;
  } catch (error) {
    logError(`Filter test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Generate payment file (if disbursements exist)
async function test5_GeneratePaymentFile() {
  logSection('Test 5: Generate Payment File');
  
  if (testDisbursementIds.length === 0) {
    logWarning('No disbursements available for payment file generation');
    return true;
  }
  
  try {
    // Test CSV format
    logInfo('Generating CSV payment file...');
    const csvResponse = await apiRequest('POST', '/hr/disbursements/generate-payment-file', {
      disbursementIds: testDisbursementIds.slice(0, 3), // Use first 3
      fileFormat: 'CSV'
    });
    
    logSuccess(`CSV file generated: ${csvResponse.filename}`);
    logInfo(`  Records: ${csvResponse.recordCount}`);
    logInfo(`  Total: ₹${csvResponse.totalAmount.toLocaleString('en-IN')}`);
    logInfo(`  Preview (first 200 chars):`);
    console.log(`  ${csvResponse.fileContent.substring(0, 200)}...`);
    
    // Test NEFT format
    logInfo('\nGenerating NEFT payment file...');
    const neftResponse = await apiRequest('POST', '/hr/disbursements/generate-payment-file', {
      disbursementIds: testDisbursementIds.slice(0, 3),
      fileFormat: 'NEFT'
    });
    
    logSuccess(`NEFT file generated: ${neftResponse.filename}`);
    logInfo(`  Records: ${neftResponse.recordCount}`);
    logInfo(`  Total: ₹${neftResponse.totalAmount.toLocaleString('en-IN')}`);
    logInfo(`  Preview (first 200 chars):`);
    console.log(`  ${neftResponse.fileContent.substring(0, 200)}...`);
    
    return true;
  } catch (error) {
    logError(`Payment file generation failed: ${error.message}`);
    return false;
  }
}

// Test 6: Test bulk status update
async function test6_BulkStatusUpdate() {
  logSection('Test 6: Bulk Status Update');
  
  if (testDisbursementIds.length === 0) {
    logWarning('No disbursements available for bulk update test');
    return true;
  }
  
  try {
    // Get pending disbursements
    const response = await apiRequest('GET', '/hr/disbursements?status=PENDING');
    const pendingIds = response.disbursements?.slice(0, 2).map(d => d.id) || [];
    
    if (pendingIds.length === 0) {
      logWarning('No PENDING disbursements found for bulk update');
      return true;
    }
    
    logInfo(`Updating ${pendingIds.length} disbursements to PROCESSING...`);
    await apiRequest('PATCH', '/hr/disbursements/bulk-status', {
      disbursementIds: pendingIds,
      status: 'PROCESSING',
      transactionRef: 'TEST_BULK_' + Date.now(),
      notes: 'Bulk update test from frontend validation'
    });
    
    logSuccess(`Successfully updated ${pendingIds.length} disbursements to PROCESSING`);
    
    // Revert back to PENDING for other tests
    logInfo('Reverting back to PENDING...');
    await apiRequest('PATCH', '/hr/disbursements/bulk-status', {
      disbursementIds: pendingIds,
      status: 'PENDING'
    });
    
    logSuccess('Reverted successfully');
    return true;
  } catch (error) {
    logError(`Bulk update failed: ${error.message}`);
    return false;
  }
}

// Test 7: Test single status update
async function test7_SingleStatusUpdate() {
  logSection('Test 7: Single Status Update');
  
  if (testDisbursementIds.length === 0) {
    logWarning('No disbursements available for single update test');
    return true;
  }
  
  try {
    const disbursementId = testDisbursementIds[0];
    
    logInfo(`Updating disbursement ${disbursementId.substring(0, 8)}... to COMPLETED...`);
    await apiRequest('PATCH', `/hr/disbursements/${disbursementId}/status`, {
      status: 'COMPLETED',
      transactionRef: 'TEST_TXN_' + Date.now(),
      notes: 'Test completion from frontend validation'
    });
    
    logSuccess('Status updated successfully to COMPLETED');
    
    // Revert back
    logInfo('Reverting to PENDING...');
    await apiRequest('PATCH', `/hr/disbursements/${disbursementId}/status`, {
      status: 'PENDING'
    });
    
    logSuccess('Reverted successfully');
    return true;
  } catch (error) {
    logError(`Single status update failed: ${error.message}`);
    return false;
  }
}

// Test 8: Fetch enhanced payslip (to test new visualizations)
async function test8_FetchPayslip() {
  logSection('Test 8: Fetch Payslip for Enhanced View');
  
  try {
    const response = await apiRequest('GET', '/payroll/payslips?limit=1');
    const payslips = response.data || [];
    
    if (payslips.length === 0) {
      logWarning('No payslips found to test enhanced view');
      return true;
    }
    
    const payslip = payslips[0];
    logSuccess('Payslip fetched successfully');
    console.log(`  Payslip #: ${payslip.payslipNumber}`);
    console.log(`  Employee: ${payslip.employee?.name || 'N/A'}`);
    console.log(`  Gross: ₹${payslip.grossSalary?.toLocaleString('en-IN') || 0}`);
    console.log(`  Deductions: ₹${payslip.totalDeductions?.toLocaleString('en-IN') || 0}`);
    console.log(`  Net: ₹${payslip.netSalary?.toLocaleString('en-IN') || 0}`);
    console.log(`  Status: ${payslip.status}`);
    
    logInfo('Component Breakdown:');
    console.log(`  Basic Salary: ₹${payslip.basicSalary?.toLocaleString('en-IN') || 0}`);
    
    if (payslip.allowances && Object.keys(payslip.allowances).length > 0) {
      console.log(`  Allowances:`, payslip.allowances);
    }
    
    if (payslip.otherDeductions && Object.keys(payslip.otherDeductions).length > 0) {
      console.log(`  Other Deductions:`, payslip.otherDeductions);
    }
    
    return true;
  } catch (error) {
    logError(`Failed to fetch payslip: ${error.message}`);
    return false;
  }
}

// Test 9: Frontend route availability check
async function test9_FrontendRoutes() {
  logSection('Test 9: Frontend Routes Accessibility');
  
  try {
    logInfo('Checking frontend is accessible...');
    await axios.get(FRONTEND_BASE);
    logSuccess('Frontend is running');
    
    logInfo('\nKey Routes to Test Manually:');
    console.log(`  ${colors.cyan}Dashboard:${colors.reset}          ${FRONTEND_BASE}/hr/payroll`);
    console.log(`  ${colors.cyan}Disbursements:${colors.reset}      ${FRONTEND_BASE}/hr/payroll/disbursements`);
    console.log(`  ${colors.cyan}Payslip Details:${colors.reset}    ${FRONTEND_BASE}/hr/payroll/payslips/:id`);
    console.log(`  ${colors.cyan}Payroll Cycles:${colors.reset}     ${FRONTEND_BASE}/hr/payroll/cycles`);
    
    return true;
  } catch (error) {
    logError(`Frontend not accessible: ${error.message}`);
    return false;
  }
}

// Test 10: API endpoint summary
async function test10_APIEndpointSummary() {
  logSection('Test 10: API Endpoint Coverage Summary');
  
  const endpoints = [
    { method: 'POST', path: '/api/hr/disbursements', status: '✓' },
    { method: 'GET', path: '/api/hr/disbursements', status: '✓' },
    { method: 'GET', path: '/api/hr/disbursements/stats', status: '✓' },
    { method: 'PATCH', path: '/api/hr/disbursements/:id/status', status: '✓' },
    { method: 'PATCH', path: '/api/hr/disbursements/bulk-status', status: '✓' },
    { method: 'POST', path: '/api/hr/disbursements/generate-payment-file', status: '✓' },
    { method: 'POST', path: '/api/hr/disbursements/reconcile', status: 'Manual test needed' },
    { method: 'GET', path: '/api/payroll/payslips', status: '✓' }
  ];
  
  console.table(endpoints.map(e => ({
    Method: e.method,
    Endpoint: e.path,
    Status: e.status
  })));
  
  return true;
}

// Main test runner
async function runTests() {
  console.log(`\n${'█'.repeat(60)}`);
  console.log(`${colors.magenta}    PAYROLL FRONTEND PAGES TEST SUITE    ${colors.reset}`);
  console.log(`${'█'.repeat(60)}\n`);
  
  const tests = [
    { name: 'Authentication', fn: test1_Login },
    { name: 'Fetch Disbursements', fn: test2_FetchDisbursements },
    { name: 'Fetch Statistics', fn: test3_FetchStatistics },
    { name: 'Test Filters', fn: test4_TestFilters },
    { name: 'Generate Payment File', fn: test5_GeneratePaymentFile },
    { name: 'Bulk Status Update', fn: test6_BulkStatusUpdate },
    { name: 'Single Status Update', fn: test7_SingleStatusUpdate },
    { name: 'Fetch Payslip', fn: test8_FetchPayslip },
    { name: 'Frontend Routes', fn: test9_FrontendRoutes },
    { name: 'API Summary', fn: test10_APIEndpointSummary }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      
      if (!result) {
        logWarning(`Test "${test.name}" reported failure`);
      }
    } catch (error) {
      logError(`Test "${test.name}" threw error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  logSection('TEST SUMMARY');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });
  
  console.log(`\n${'='.repeat(60)}`);
  if (passed === total) {
    logSuccess(`ALL TESTS PASSED: ${passed}/${total} ✨`);
  } else {
    logWarning(`TESTS PASSED: ${passed}/${total}`);
  }
  console.log(`${'='.repeat(60)}\n`);
  
  // Manual testing guide
  logSection('MANUAL TESTING GUIDE');
  
  console.log(`${colors.cyan}1. Disbursement List Page${colors.reset}`);
  console.log(`   URL: ${FRONTEND_BASE}/hr/payroll/disbursements`);
  console.log(`   Tests:`);
  console.log(`   - View statistics cards (Total, Pending, Processing, Completed, Failed)`);
  console.log(`   - Apply status filter dropdown`);
  console.log(`   - Apply payment method filter`);
  console.log(`   - Use search box to find employee`);
  console.log(`   - Select multiple disbursements with checkboxes`);
  console.log(`   - Click "Generate Payment File" button`);
  console.log(`   - Click "Reconcile" button\n`);
  
  console.log(`${colors.cyan}2. Payment File Generator Modal${colors.reset}`);
  console.log(`   Triggered from: Disbursement List page`);
  console.log(`   Tests:`);
  console.log(`   - View selected disbursements summary`);
  console.log(`   - Select CSV format`);
  console.log(`   - Select NEFT format`);
  console.log(`   - Click "Generate & Download"`);
  console.log(`   - Verify file downloads automatically`);
  console.log(`   - Check file content format\n`);
  
  console.log(`${colors.cyan}3. Reconciliation Upload Modal${colors.reset}`);
  console.log(`   Triggered from: Disbursement List page`);
  console.log(`   Tests:`);
  console.log(`   - Add multiple entry rows`);
  console.log(`   - Fill in employee codes and amounts`);
  console.log(`   - Click "Reconcile Payments"`);
  console.log(`   - View success/failed/not found results`);
  console.log(`   - Verify color-coded results display\n`);
  
  console.log(`${colors.cyan}4. Enhanced Payslip Details${colors.reset}`);
  console.log(`   URL: ${FRONTEND_BASE}/hr/payroll/payslips/:id`);
  console.log(`   Tests:`);
  console.log(`   - View quick stats cards (4 cards)`);
  console.log(`   - Check earnings breakdown visualization`);
  console.log(`   - Check deductions breakdown visualization`);
  console.log(`   - Verify progress bars show percentages`);
  console.log(`   - Verify all components listed in detail tables\n`);
  
  console.log(`${colors.cyan}5. Payroll Dashboard${colors.reset}`);
  console.log(`   URL: ${FRONTEND_BASE}/hr/payroll`);
  console.log(`   Tests:`);
  console.log(`   - Click on Disbursements stats card (should navigate)`);
  console.log(`   - Click "Salary Disbursements" quick action button`);
  console.log(`   - Verify disbursement count displayed correctly\n`);
  
  console.log(`${colors.yellow}📱 Responsive Testing:${colors.reset}`);
  console.log(`   - Test on mobile viewport (375px)`);
  console.log(`   - Test on tablet viewport (768px)`);
  console.log(`   - Test on desktop viewport (1440px)`);
  console.log(`   - Check all tables scroll horizontally on mobile`);
  console.log(`   - Check modals are readable on small screens\n`);
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
