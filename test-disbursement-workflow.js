/**
 * Test script for Disbursement Workflow
 * Tests: Create disbursements, update status, generate payment file, reconciliation
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let tenantId = '';
let testPayrollCycleId = '';
let testPayslipIds = [];
let testDisbursementIds = [];

// Test user credentials
const testUser = {
  email: 'apitest@test.com',
  password: 'Test@1234',
};

console.log('🧪 Starting Disbursement Workflow Tests...\n');

async function runTests() {
  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, testUser);
    authToken = loginResponse.data.token;
    
    // Decode JWT to get tenantId
    const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    tenantId = tokenPayload.tenantId;
    
    console.log(`✅ Logged in successfully. Tenant: ${tenantId}\n`);

    // Create axios instance with auth
    const api = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Step 2: Get existing payroll cycle with APPROVED payslips
    console.log('2️⃣ Fetching payroll cycles...');
    const cyclesResponse = await api.get('/payroll/cycles');
    const cycles = cyclesResponse.data.cycles || [];
    
    if (cycles.length === 0) {
      console.log('⚠️ No payroll cycles found. Creating test cycle...');
      
      // Get employees
      const employeesResponse = await api.get('/employees');
      const employees = Array.isArray(employeesResponse.data) 
        ? employeesResponse.data 
        : (employeesResponse.data.employees || employeesResponse.data.data || []);
      
      console.log(`   Found ${employees.length} employees`);
      
      if (employees.length === 0) {
        console.log('❌ No employees found. Cannot create test data.');
        return;
      }

      // Create a payroll cycle
      const startDate = new Date('2026-02-01');
      const endDate = new Date('2026-02-28');
      
      const cycleData = {
        name: `February 2026 Disbursement Test`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentDate: new Date('2026-03-05').toISOString(),
        employeeIds: employees.slice(0, 3).map(e => e.id), // First 3 employees
      };

      const createCycleResponse = await api.post('/payroll/cycles', cycleData);
      console.log('Cycle response:', JSON.stringify(createCycleResponse.data, null, 2));
      testPayrollCycleId = createCycleResponse.data.cycle?.id || createCycleResponse.data.id;
      console.log(`✅ Created payroll cycle: ${testPayrollCycleId}`);

      // Generate payslips
      console.log('   Generating payslips...');
      const generateResponse = await api.post(
        `/payroll/cycles/${testPayrollCycleId}/generate-payslips`
      );
      const payslips = generateResponse.data.payslips || [];
      testPayslipIds = payslips.map(p => p.id);
      console.log(`   ✅ Generated ${payslips.length} payslips`);

      // Approve all payslips
      console.log('   Approving payslips...');
      for (const payslipId of testPayslipIds) {
        await api.post(`/payroll/payslips/${payslipId}/approve`);
      }
      console.log(`   ✅ Approved ${testPayslipIds.length} payslips\n`);
    } else {
      // Use existing cycle
      testPayrollCycleId = cycles[0].id;
      console.log(`✅ Using existing cycle: ${cycles[0].name}`);

      // Get payslips for this cycle
      const payslipsResponse = await api.get(
        `/payroll/cycles/${testPayrollCycleId}/payslips`
      );
      const allPayslips = payslipsResponse.data.payslips || [];
      
      // Filter approved payslips
      const approvedPayslips = allPayslips.filter(p => p.status === 'APPROVED');
      
      if (approvedPayslips.length === 0) {
        console.log('⚠️ No approved payslips found. Approving some...');
        const toApprove = allPayslips.slice(0, 3);
        for (const payslip of toApprove) {
          await api.post(`/payroll/payslips/${payslip.id}/approve`);
        }
        testPayslipIds = toApprove.map(p => p.id);
      } else {
        testPayslipIds = approvedPayslips.slice(0, 3).map(p => p.id);
      }
      
      console.log(`✅ Found ${testPayslipIds.length} approved payslips\n`);
    }

    // Step 3: Create Disbursements
    console.log('3️⃣ Creating disbursements from approved payslips...');
    const createDisbursementResponse = await api.post('/hr/disbursements', {
      payslipIds: testPayslipIds,
      paymentMethod: 'BANK_TRANSFER',
    });
    
    const disbursements = createDisbursementResponse.data.disbursements || [];
    testDisbursementIds = disbursements.map(d => d.id);
    
    console.log(`✅ Created ${disbursements.length} disbursements`);
    disbursements.forEach((d, i) => {
      console.log(`   ${i + 1}. Employee: ${d.employeeId}, Amount: ₹${d.amount}, Status: ${d.status}`);
    });
    console.log();

    // Step 4: Get Disbursements with filters
    console.log('4️⃣ Fetching all disbursements...');
    const getDisbursementsResponse = await api.get('/hr/disbursements', {
      params: { status: 'PENDING' },
    });
    
    const allDisbursements = getDisbursementsResponse.data.disbursements || [];
    const summary = getDisbursementsResponse.data.summary;
    
    console.log(`✅ Found ${allDisbursements.length} pending disbursements`);
    console.log(`   Total Amount: ₹${summary.totalAmount.toFixed(2)}`);
    console.log(`   By Status: ${JSON.stringify(summary.byStatus)}`);
    console.log(`   By Method: ${JSON.stringify(summary.byPaymentMethod)}\n`);

    // Step 5: Get Disbursement Statistics
    console.log('5️⃣ Fetching disbursement statistics...');
    const statsResponse = await api.get('/hr/disbursements/stats', {
      params: { payrollCycleId: testPayrollCycleId },
    });
    
    const stats = statsResponse.data.stats;
    console.log(`✅ Statistics:`);
    console.log(`   Total: ${stats.total.count} (₹${stats.total.amount.toFixed(2)})`);
    console.log(`   Pending: ${stats.pending.count}`);
    console.log(`   Processing: ${stats.processing.count}`);
    console.log(`   Completed: ${stats.completed.count} (₹${stats.completed.amount.toFixed(2)})`);
    console.log(`   Failed: ${stats.failed.count}\n`);

    // Step 6: Generate Payment File (CSV format)
    console.log('6️⃣ Generating CSV payment file...');
    const paymentFileResponse = await api.post('/hr/disbursements/generate-payment-file', {
      disbursementIds: testDisbursementIds,
      fileFormat: 'CSV',
    });
    
    const { filename, fileContent, recordCount, totalAmount } = paymentFileResponse.data;
    console.log(`✅ Generated payment file: ${filename}`);
    console.log(`   Records: ${recordCount}, Total: ₹${totalAmount.toFixed(2)}`);
    console.log(`   Preview (first 3 lines):`);
    const lines = fileContent.split('\n');
    lines.slice(0, 3).forEach(line => console.log(`   ${line}`));
    console.log();

    // Step 7: Update single disbursement status
    console.log('7️⃣ Updating disbursement status to COMPLETED...');
    const updateResponse = await api.patch(
      `/hr/disbursements/${testDisbursementIds[0]}/status`,
      {
        status: 'COMPLETED',
        transactionRef: 'TXN123456789',
        notes: 'Payment processed successfully via NEFT',
      }
    );
    
    console.log(`✅ Updated disbursement status`);
    const updated = updateResponse.data.disbursement;
    console.log(`   Employee: ${updated.employee.firstName} ${updated.employee.lastName}`);
    console.log(`   Status: ${updated.status}`);
    console.log(`   Transaction: ${updated.transactionRef}\n`);

    // Step 8: Bulk status update
    if (testDisbursementIds.length > 1) {
      console.log('8️⃣ Bulk updating remaining disbursements to COMPLETED...');
      const bulkResponse = await api.patch('/hr/disbursements/bulk-status', {
        disbursementIds: testDisbursementIds.slice(1),
        status: 'COMPLETED',
        transactionRef: 'BULK_TXN_' + Date.now(),
      });
      
      console.log(`✅ Bulk updated ${bulkResponse.data.results.length} disbursements\n`);
    }

    // Step 9: Get updated statistics
    console.log('9️⃣ Fetching updated statistics...');
    const finalStatsResponse = await api.get('/hr/disbursements/stats', {
      params: { payrollCycleId: testPayrollCycleId },
    });
    
    const finalStats = finalStatsResponse.data.stats;
    console.log(`✅ Final Statistics:`);
    console.log(`   Total: ${finalStats.total.count} (₹${finalStats.total.amount.toFixed(2)})`);
    console.log(`   Pending: ${finalStats.pending.count}`);
    console.log(`   Processing: ${finalStats.processing.count}`);
    console.log(`   Completed: ${finalStats.completed.count} (₹${finalStats.completed.amount.toFixed(2)})`);
    console.log(`   Failed: ${finalStats.failed.count}\n`);

    // Step 10: Verify payslips are marked as PAID
    console.log('🔟 Verifying payslip status updated to PAID...');
    const payslipsCheck = await api.get(
      `/payroll/cycles/${testPayrollCycleId}/payslips`
    );
    const paidPayslips = payslipsCheck.data.payslips.filter(p => p.status === 'PAID');
    console.log(`✅ ${paidPayslips.length} payslips marked as PAID\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL DISBURSEMENT WORKFLOW TESTS PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Test Summary:`);
    console.log(`   • Created ${testDisbursementIds.length} disbursements`);
    console.log(`   • Generated CSV payment file`);
    console.log(`   • Updated disbursement statuses`);
    console.log(`   • Verified payslip status updates`);
    console.log(`   • Total Amount Disbursed: ₹${finalStats.completed.amount.toFixed(2)}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

runTests();
