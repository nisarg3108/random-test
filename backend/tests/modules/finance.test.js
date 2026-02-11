/**
 * Finance Module Test Suite
 * Tests: Expense Claims, Categories, Accounting, Journal Entries
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n💵 FINANCE MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let categoryId, expenseClaimId, journalEntryId, accountId;

    // Test 1: Get Expense Categories
    try {
      const response = await apiCall('GET', '/expense-categories');
      const categories = response.data || response;
      if (categories.length > 0) categoryId = categories[0].id;
      logTest('Get Expense Categories', 'pass', `- Found ${categories.length} categories`);
    } catch (error) {
      logTest('Get Expense Categories', 'fail', `- ${error.message}`);
    }

    // Test 2: Create Expense Category
    try {
      const categoryData = {
        name: `Test Category ${Date.now()}`,
        code: `TC${Date.now()}`,
        description: 'Test expense category',
        isActive: true
      };
      const response = await apiCall('POST', '/expense-categories', categoryData);
      categoryId = response.data?.id || response.id;
      logTest('Create Expense Category', 'pass', `- ID: ${categoryId}`);
    } catch (error) {
      logTest('Create Expense Category', 'fail', `- ${error.message}`);
    }

    // Test 3: Create Expense Claim
    if (categoryId) {
      try {
        const claimData = {
          categoryId,
          amount: 1000,
          description: 'Test expense claim',
          expenseDate: new Date().toISOString(),
          status: 'PENDING'
        };
        const response = await apiCall('POST', '/expense-claims', claimData);
        expenseClaimId = response.data?.id || response.id;
        logTest('Create Expense Claim', 'pass', `- ID: ${expenseClaimId}, Amount: ₹1000`);
      } catch (error) {
        logTest('Create Expense Claim', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Expense Claim', 'skip', '- No category ID');
    }

    // Test 4: Get Expense Claims
    try {
      const response = await apiCall('GET', '/expense-claims');
      const claims = response.data || response;
      logTest('Get Expense Claims', 'pass', `- Found ${claims.length} claims`);
    } catch (error) {
      logTest('Get Expense Claims', 'fail', `- ${error.message}`);
    }

    // Test 5: Approve Expense Claim
    if (expenseClaimId) {
      try {
        await apiCall('PATCH', `/expense-claims/${expenseClaimId}/approve`);
        logTest('Approve Expense Claim', 'pass', '- Status updated to APPROVED');
      } catch (error) {
        logTest('Approve Expense Claim', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Approve Expense Claim', 'skip', '- No expense claim ID');
    }

    // Test 6: Get Chart of Accounts
    try {
      const response = await apiCall('GET', '/accounting/chart-of-accounts');
      const accounts = response.data || response;
      if (accounts.length > 0) accountId = accounts[0].id;
      logTest('Get Chart of Accounts', 'pass', `- Found ${accounts.length} accounts`);
    } catch (error) {
      logTest('Get Chart of Accounts', 'fail', `- ${error.message}`);
    }

    // Test 7: Create Account
    try {
      const accountData = {
        code: `ACC${Date.now()}`,
        name: `Test Account ${Date.now()}`,
        type: 'ASSET',
        category: 'CURRENT_ASSET',
        isActive: true
      };
      const response = await apiCall('POST', '/accounting/accounts', accountData);
      accountId = response.data?.id || response.id;
      logTest('Create Account', 'pass', `- ID: ${accountId}`);
    } catch (error) {
      logTest('Create Account', 'fail', `- ${error.message}`);
    }

    // Test 8: Create Journal Entry
    if (accountId) {
      try {
        const journalData = {
          date: new Date().toISOString(),
          reference: `JE${Date.now()}`,
          description: 'Test journal entry',
          entries: [
            { accountId, debit: 1000, credit: 0 },
            { accountId, debit: 0, credit: 1000 }
          ]
        };
        const response = await apiCall('POST', '/accounting/journal-entries', journalData);
        journalEntryId = response.data?.id || response.id;
        logTest('Create Journal Entry', 'pass', `- ID: ${journalEntryId}`);
      } catch (error) {
        logTest('Create Journal Entry', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Journal Entry', 'skip', '- No account ID');
    }

    // Test 9: Get Journal Entries
    try {
      const response = await apiCall('GET', '/accounting/journal-entries');
      const entries = response.data || response;
      logTest('Get Journal Entries', 'pass', `- Found ${entries.length} entries`);
    } catch (error) {
      logTest('Get Journal Entries', 'fail', `- ${error.message}`);
    }

    // Test 10: Get Finance Dashboard
    try {
      const response = await apiCall('GET', '/finance/dashboard');
      const dashboard = response.data || response;
      logTest('Get Finance Dashboard', 'pass', 
        `- Total Expenses: ₹${dashboard.totalExpenses || 0}`);
    } catch (error) {
      logTest('Get Finance Dashboard', 'fail', `- ${error.message}`);
    }

    // Test 11: Get Balance Sheet
    try {
      const response = await apiCall('GET', '/accounting/balance-sheet');
      const balanceSheet = response.data || response;
      logTest('Get Balance Sheet', 'pass', 
        `- Assets: ₹${balanceSheet.totalAssets || 0}`);
    } catch (error) {
      logTest('Get Balance Sheet', 'fail', `- ${error.message}`);
    }

    // Test 12: Get Profit & Loss
    try {
      const response = await apiCall('GET', '/accounting/profit-loss');
      const pl = response.data || response;
      logTest('Get Profit & Loss', 'pass', 
        `- Revenue: ₹${pl.totalRevenue || 0}, Expenses: ₹${pl.totalExpenses || 0}`);
    } catch (error) {
      logTest('Get Profit & Loss', 'fail', `- ${error.message}`);
    }

    // Test 13: Export Expense Report
    try {
      await apiCall('GET', '/expense-claims/export/pdf');
      logTest('Export Expense Report', 'pass', '- PDF generated');
    } catch (error) {
      logTest('Export Expense Report', 'fail', `- ${error.message}`);
    }

    // Test 14: Get Pending Approvals
    try {
      const response = await apiCall('GET', '/expense-claims?status=PENDING');
      const pending = response.data || response;
      logTest('Get Pending Approvals', 'pass', `- Found ${pending.length} pending claims`);
    } catch (error) {
      logTest('Get Pending Approvals', 'fail', `- ${error.message}`);
    }
  }
};
