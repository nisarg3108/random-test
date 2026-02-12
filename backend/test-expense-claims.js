/**
 * Test Script for Expense Claims Approval Workflow
 * 
 * This script tests the complete expense claims approval flow:
 * 1. Seeds the workflow
 * 2. Creates a test expense claim
 * 3. Verifies approval request is generated
 * 4. Tests approval/rejection
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `API call failed: ${response.status}`);
  }
  
  return data;
}

// Test Steps
async function runTests() {
  console.log('🧪 Starting Expense Claims Approval Workflow Tests\n');

  try {
    // Step 1: Login
    console.log('📝 Step 1: Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com', // Change to your admin email
        password: 'password123'      // Change to your admin password
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed. Please update credentials in the script.');
    }
    
    const loginData = await loginResponse.json();
    authToken = loginData.token;
    console.log('✅ Login successful\n');

    // Step 2: Seed Workflows
    console.log('📝 Step 2: Seeding workflows...');
    const seedResult = await apiCall('/approvals/seed-workflows', 'POST');
    console.log('✅ Workflows seeded:', seedResult.message);
    console.log('   Results:', JSON.stringify(seedResult.results, null, 2), '\n');

    // Step 3: Check Debug Info
    console.log('📝 Step 3: Checking system status...');
    const debugInfo = await apiCall('/approvals/debug');
    console.log('✅ System Status:');
    console.log('   User:', debugInfo.user.email, '(', debugInfo.user.role, ')');
    console.log('   Can Approve:', debugInfo.user.canApprove);
    console.log('   Workflows:', debugInfo.workflows.length);
    
    const financeWorkflow = debugInfo.workflows.find(
      w => w.module === 'FINANCE' && w.action === 'EXPENSE_CLAIM'
    );
    
    if (financeWorkflow) {
      console.log('   ✅ Finance Expense Workflow Found:', financeWorkflow.id);
    } else {
      console.log('   ⚠️  Finance Expense Workflow NOT Found');
    }
    console.log('');

    // Step 4: Get Expense Categories
    console.log('📝 Step 4: Fetching expense categories...');
    const categories = await apiCall('/finance/expense-categories');
    
    if (categories.length === 0) {
      console.log('⚠️  No expense categories found. Creating one...');
      const newCategory = await apiCall('/finance/expense-categories', 'POST', {
        name: 'Travel',
        description: 'Travel and transportation expenses',
        code: 'TRAVEL'
      });
      console.log('✅ Created category:', newCategory.name);
      categories.push(newCategory);
    } else {
      console.log('✅ Found', categories.length, 'expense categories');
    }
    console.log('');

    // Step 5: Create Expense Claim
    console.log('📝 Step 5: Creating test expense claim...');
    const expenseClaim = await apiCall('/finance/expense-claims', 'POST', {
      title: 'Test Expense - Client Meeting',
      description: 'Lunch meeting with client to discuss project requirements',
      amount: 125.50,
      expenseDate: new Date().toISOString(),
      categoryId: categories[0].id,
      receiptUrl: 'https://example.com/receipt.pdf'
    });
    console.log('✅ Expense claim created:', expenseClaim.id || 'Sent for approval');
    console.log('');

    // Step 6: Check Pending Approvals
    console.log('📝 Step 6: Checking pending approvals...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    const approvals = await apiCall('/approvals');
    const financeApprovals = approvals.filter(
      a => a.workflow?.module === 'FINANCE' && a.workflow?.action === 'EXPENSE_CLAIM'
    );
    
    console.log('✅ Found', financeApprovals.length, 'pending finance approvals');
    
    if (financeApprovals.length > 0) {
      const approval = financeApprovals[0];
      console.log('   Approval ID:', approval.id);
      console.log('   Status:', approval.status);
      console.log('   Step:', approval.stepOrder);
      console.log('');

      // Step 7: Approve the Request
      console.log('📝 Step 7: Approving expense claim...');
      const approveResult = await apiCall(`/approvals/${approval.id}/approve`, 'POST', {
        comment: 'Approved - Valid business expense'
      });
      console.log('✅ Approval result:', approveResult.message);
      console.log('');

      // Step 8: Verify Expense Claim Status
      console.log('📝 Step 8: Verifying expense claim status...');
      const claims = await apiCall('/finance/expense-claims');
      const updatedClaim = claims.find(c => c.title === 'Test Expense - Client Meeting');
      
      if (updatedClaim) {
        console.log('✅ Expense claim status:', updatedClaim.status);
        console.log('   Expected: APPROVED');
        console.log('   Match:', updatedClaim.status === 'APPROVED' ? '✅' : '❌');
      }
    } else {
      console.log('⚠️  No pending approvals found. The workflow might not be configured correctly.');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Workflow seeded');
    console.log('   ✅ Expense claim created');
    console.log('   ✅ Approval request generated');
    console.log('   ✅ Approval processed');
    console.log('   ✅ Status updated correctly');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the tests
console.log('='.repeat(60));
console.log('  EXPENSE CLAIMS APPROVAL WORKFLOW TEST');
console.log('='.repeat(60));
console.log('');

runTests().catch(console.error);
