/**
 * Accounts Payable (AP) Module Test Suite
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n💳 ACCOUNTS PAYABLE MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let billId, paymentId;

    // Test 1: Create Bill
    try {
      const billData = {
        vendorName: `Test Vendor ${Date.now()}`,
        billNumber: `BILL${Date.now()}`,
        billDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        amount: 10000,
        status: 'PENDING'
      };
      const response = await apiCall('POST', '/ap/bills', billData);
      billId = response.data?.id || response.id;
      logTest('Create Bill', 'pass', `- ID: ${billId}, Amount: ₹10000`);
    } catch (error) {
      logTest('Create Bill', 'fail', `- ${error.message}`);
    }

    // Test 2: Get All Bills
    try {
      const response = await apiCall('GET', '/ap/bills');
      const bills = response.data || response;
      if (!billId && bills.length > 0) billId = bills[0].id;
      logTest('Get All Bills', 'pass', `- Found ${bills.length} bills`);
    } catch (error) {
      logTest('Get All Bills', 'fail', `- ${error.message}`);
    }

    // Test 3: Get Overdue Bills
    try {
      const response = await apiCall('GET', '/ap/bills/overdue');
      const overdue = response.data || response;
      logTest('Get Overdue Bills', 'pass', `- Found ${overdue.length} overdue bills`);
    } catch (error) {
      logTest('Get Overdue Bills', 'fail', `- ${error.message}`);
    }

    // Test 4: Record Payment
    if (billId) {
      try {
        const paymentData = {
          billId,
          amount: 5000,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'BANK_TRANSFER',
          reference: `PAY${Date.now()}`
        };
        const response = await apiCall('POST', '/ap/payments', paymentData);
        paymentId = response.data?.id || response.id;
        logTest('Record Payment', 'pass', `- Payment ID: ${paymentId}, Amount: ₹5000`);
      } catch (error) {
        logTest('Record Payment', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Record Payment', 'skip', '- No bill ID');
    }

    // Test 5: Get AP Dashboard
    try {
      const response = await apiCall('GET', '/ap/dashboard');
      const dashboard = response.data || response;
      logTest('Get AP Dashboard', 'pass', 
        `- Total Payable: ₹${dashboard.totalPayable || 0}`);
    } catch (error) {
      logTest('Get AP Dashboard', 'fail', `- ${error.message}`);
    }

    // Test 6: Get Aging Report
    try {
      const response = await apiCall('GET', '/ap/aging-report');
      const aging = response.data || response;
      logTest('Get Aging Report', 'pass', 
        `- Current: ₹${aging.current || 0}, Overdue: ₹${aging.overdue || 0}`);
    } catch (error) {
      logTest('Get Aging Report', 'fail', `- ${error.message}`);
    }

    // Test 7: Export AP Report
    try {
      await apiCall('GET', '/ap/export/pdf');
      logTest('Export AP Report', 'pass', '- PDF generated');
    } catch (error) {
      logTest('Export AP Report', 'fail', `- ${error.message}`);
    }
  }
};
