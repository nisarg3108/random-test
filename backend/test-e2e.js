import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test credentials (update with actual admin credentials)
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'password123'
};

let adminToken = '';

async function login() {
  console.log('🔐 Logging in as ADMIN...');
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CREDENTIALS)
  });
  
  const data = await response.json();
  
  if (response.ok) {
    adminToken = data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.error('❌ Login failed:', data);
    return false;
  }
}

async function createInventoryItem() {
  console.log('\n📦 Step 1: Creating inventory item...');
  
  const itemData = {
    name: 'Test Item',
    sku: `TEST-${Date.now()}`,
    price: 99.99,
    quantity: 10,
    description: 'Test item for approval workflow'
  };
  
  const response = await fetch(`${BASE_URL}/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(itemData)
  });
  
  const data = await response.json();
  
  if (response.status === 202) {
    console.log('✅ Approval required response received');
    console.log('📋 Response:', JSON.stringify(data, null, 2));
    return data.workflowId;
  } else if (response.status === 201) {
    console.log('⚠️  Item created immediately (no workflow configured)');
    console.log('📋 Response:', JSON.stringify(data, null, 2));
    return null;
  } else {
    console.error('❌ Failed to create item:', data);
    return null;
  }
}

async function getPendingApprovals() {
  console.log('\n🔍 Step 2: Getting pending approvals...');
  console.log('💡 Check Prisma Studio → Approval table for:');
  console.log('   - status = "PENDING"');
  console.log('   - Copy the approvalId for next step');
  console.log('\n⏳ Waiting 5 seconds for you to check...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Return a placeholder - user needs to get this from Prisma Studio
  return 'COPY_FROM_PRISMA_STUDIO';
}

async function approveWorkflow(approvalId) {
  console.log('\n✅ Step 3: Approving workflow...');
  
  if (approvalId === 'COPY_FROM_PRISMA_STUDIO') {
    console.log('⚠️  Please replace with actual approvalId from Prisma Studio');
    console.log('📝 Example request:');
    console.log(`
POST ${BASE_URL}/workflows/approve
Authorization: Bearer ${adminToken}

{
  "approvalId": "actual-approval-id-here"
}
    `);
    return;
  }
  
  const response = await fetch(`${BASE_URL}/workflows/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ approvalId })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log('✅ Approval successful');
    console.log('📋 Response:', JSON.stringify(data, null, 2));
  } else {
    console.error('❌ Approval failed:', data);
  }
}

async function runE2ETest() {
  console.log('🚀 Starting End-to-End Inventory Approval Test\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) return;
  
  // Step 2: Create inventory item
  const workflowId = await createInventoryItem();
  
  // Step 3: Get pending approvals
  const approvalId = await getPendingApprovals();
  
  // Step 4: Approve workflow
  await approveWorkflow(approvalId);
  
  console.log('\n🎉 End-to-End test completed!');
  console.log('\n📝 Manual steps required:');
  console.log('1. Open Prisma Studio: npx prisma studio');
  console.log('2. Go to Approval table');
  console.log('3. Find record with status = "PENDING"');
  console.log('4. Copy the approvalId');
  console.log('5. Run approval request with actual approvalId');
}

// Run the test
runE2ETest().catch(console.error);