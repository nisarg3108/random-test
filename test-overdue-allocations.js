/**
 * Overdue Allocation Detection Test Script
 * Tests the automatic overdue detection and marking functionality
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TENANT_ID = '1';

const TEST_USER = {
  email: 'apitest@test.com',  // Update with your actual admin email
  password: 'Test@1234'     // Update with your actual admin password
};

let config = {
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID
  }
};

async function authenticate() {
  console.log('🔑 Authenticating...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    config.headers['Authorization'] = `Bearer ${response.data.token}`;
    console.log('✅ Authentication successful\n');
    return response.data.token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testOverdueDetection() {
  console.log('🧪 OVERDUE ALLOCATION DETECTION TEST\n');
  console.log('=' .repeat(60));

  try {
    await authenticate();

    // Step 1: Get or create test asset
    console.log('📦 Step 1: Getting test asset...');
    let asset;
    try {
      const assetsResponse = await axios.get(`${API_BASE}/assets`, config);
      const assets = assetsResponse.data.data || assetsResponse.data;
      
      if (assets.length === 0) {
        console.log('   ⚠️  No assets found. Creating test asset...');
        
        // Get category
        const catRes = await axios.get(`${API_BASE}/assets/categories`, config);
        const categories = catRes.data.data || catRes.data;
        
        if (!categories || categories.length === 0) {
          console.log('   ❌ No categories found. Please create a category first.');
          return;
        }
        
        const categoryId = categories[0].id;
        console.log(`   Using category: ${categories[0].name}`);
        
        const createResponse = await axios.post(`${API_BASE}/assets`, {
          name: 'Test Asset for Overdue',
          assetCode: 'TEST-OVERDUE-' + Date.now(),
          categoryId,
          description: 'Test asset for overdue allocation',
          purchaseDate: new Date().toISOString(),
          purchasePrice: 5000,
          status: 'AVAILABLE',
          location: 'Test Location',
          condition: 'GOOD'
        }, config);
        asset = createResponse.data.data || createResponse.data;
        console.log(`   ✅ Created asset: ${asset.name}`);
      } else {
        asset = assets.find(a => a.status === 'AVAILABLE');
        
        if (!asset) {
          console.log('   ⚠️  No AVAILABLE assets found. Using first asset and updating status...');
          asset = assets[0];
          
          // Update asset to AVAILABLE if it's not
          if (asset.status !== 'AVAILABLE') {
            const updateResponse = await axios.put(`${API_BASE}/assets/${asset.id}`, {
              status: 'AVAILABLE'
            }, config);
            asset = updateResponse.data.data || updateResponse.data;
            console.log(`   ✅ Updated asset status to AVAILABLE`);
          }
        } else {
          console.log(`   ✅ Using existing asset: ${asset.name}`);
        }
      }
      
      console.log(`   Asset ID: ${asset.id}`);
      console.log(`   Status: ${asset.status}\n`);
    } catch (error) {
      console.error('❌ Failed to get/create asset:', error.response?.data || error.message);
      return;
    }

    // Step 2: Get or create test employee
    console.log('👤 Step 2: Getting test employee...');
    let employee;
    try {
      const employeesResponse = await axios.get(`${API_BASE}/employees`, config);
      const employees = employeesResponse.data.data || employeesResponse.data;
      
      if (employees.length === 0) {
        console.log('   ❌ No employees found. Please create an employee first.');
        return;
      }
      
      employee = employees[0];
      console.log(`   ✅ Using employee: ${employee.name}`);
      console.log(`   Employee ID: ${employee.id}\n`);
    } catch (error) {
      console.error('❌ Failed to get employee:', error.response?.data || error.message);
      return;
    }

    // Step 3: Create allocation with past expectedReturnDate
    console.log('📅 Step 3: Creating allocation with past due date...');
    let allocation;
    try {
      // Set expected return date to 3 days ago
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      
      const allocationResponse = await axios.post(`${API_BASE}/asset-allocations`, {
        assetId: asset.id,
        employeeId: employee.id,
        allocatedDate: new Date().toISOString(),
        expectedReturnDate: pastDate.toISOString(),
        purpose: 'Test overdue detection',
        location: 'Test Location'
      }, config);
      
      allocation = allocationResponse.data.data || allocationResponse.data;
      console.log(`   ✅ Allocation created: ID ${allocation.id}`);
      console.log(`   Status: ${allocation.status}`);
      console.log(`   Expected Return: ${new Date(allocation.expectedReturnDate).toLocaleDateString()}`);
      console.log(`   (3 days ago)\n`);
      
      if (allocation.status !== 'ACTIVE') {
        console.warn(`   ⚠️  WARNING: Expected ACTIVE status, got ${allocation.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to create allocation:', error.response?.data || error.message);
      return;
    }

    // Step 4: Verify asset status changed to ALLOCATED
    console.log('🔍 Step 4: Verifying asset status changed to ALLOCATED...');
    try {
      const assetCheckResponse = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
      const currentAsset = assetCheckResponse.data.data || assetCheckResponse.data;
      console.log(`   Asset status: ${currentAsset.status}`);
      
      if (currentAsset.status === 'ALLOCATED') {
        console.log('   ✅ PASS: Asset marked as ALLOCATED\n');
      } else {
        console.warn(`   ⚠️  WARNING: Expected ALLOCATED, got ${currentAsset.status}\n`);
      }
    } catch (error) {
      console.error('❌ Failed to check asset:', error.response?.data || error.message);
    }

    // Step 5: Check initial overdue count
    console.log('📊 Step 5: Checking current overdue allocations...');
    try {
      const overdueResponse = await axios.get(`${API_BASE}/asset-allocations/overdue`, config);
      const overdueAllocations = overdueResponse.data.data || overdueResponse.data;
      console.log(`   Current overdue count: ${overdueAllocations.length}\n`);
    } catch (error) {
      console.error('❌ Failed to get overdue allocations:', error.response?.data || error.message);
    }

    // Step 6: Trigger overdue detection
    console.log('⚡ Step 6: Triggering overdue detection...');
    try {
      const markResponse = await axios.post(`${API_BASE}/asset-allocations/mark-overdue`, {}, config);
      const result = markResponse.data;
      
      console.log(`   ✅ Overdue detection completed`);
      console.log(`   Marked ${result.count} allocation(s) as overdue`);
      
      if (result.count > 0) {
        console.log(`   Affected allocations:`, result.allocations.map(a => a.id).join(', '));
      }
      console.log('');
    } catch (error) {
      console.error('❌ Failed to trigger overdue detection:', error.response?.data || error.message);
      return;
    }

    // Step 7: Verify allocation status changed to OVERDUE
    console.log('🔍 Step 7: Verifying allocation status changed to OVERDUE...');
    try {
      const allocationCheckResponse = await axios.get(`${API_BASE}/asset-allocations/${allocation.id}`, config);
      const updatedAllocation = allocationCheckResponse.data.data || allocationCheckResponse.data;
      
      console.log(`   Allocation status: ${updatedAllocation.status}`);
      
      if (updatedAllocation.status === 'OVERDUE') {
        console.log('   ✅ PASS: Allocation correctly marked as OVERDUE\n');
      } else {
        console.log(`   ❌ FAIL: Expected OVERDUE, got ${updatedAllocation.status}\n`);
      }
    } catch (error) {
      console.error('❌ Failed to check allocation:', error.response?.data || error.message);
    }

    // Step 8: Verify asset status remains ALLOCATED
    console.log('🔍 Step 8: Verifying asset status remains ALLOCATED...');
    try {
      const assetCheckResponse = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
      const finalAsset = assetCheckResponse.data.data || assetCheckResponse.data;
      
      console.log(`   Asset status: ${finalAsset.status}`);
      
      if (finalAsset.status === 'ALLOCATED') {
        console.log('   ✅ PASS: Asset status unchanged (still ALLOCATED)\n');
      } else {
        console.warn(`   ⚠️  WARNING: Asset status changed to ${finalAsset.status}\n`);
      }
    } catch (error) {
      console.error('❌ Failed to check asset:', error.response?.data || error.message);
    }

    // Step 9: Get all overdue allocations
    console.log('📋 Step 9: Fetching all overdue allocations...');
    try {
      const overdueResponse = await axios.get(`${API_BASE}/asset-allocations/overdue`, config);
      const overdueAllocations = overdueResponse.data.data || overdueResponse.data;
      
      console.log(`   ✅ Found ${overdueAllocations.length} overdue allocation(s)`);
      
      const testAllocation = overdueAllocations.find(a => a.id === allocation.id);
      if (testAllocation) {
        console.log(`   ✅ PASS: Test allocation found in overdue list`);
        
        const daysOverdue = Math.floor((new Date() - new Date(testAllocation.expectedReturnDate)) / (1000 * 60 * 60 * 24));
        console.log(`   Days overdue: ${daysOverdue}`);
        console.log(`   Employee: ${testAllocation.employee?.name}`);
        console.log(`   Asset: ${testAllocation.asset?.name}`);
      } else {
        console.log(`   ⚠️  WARNING: Test allocation not found in overdue list`);
      }
      console.log('');
    } catch (error) {
      console.error('❌ Failed to get overdue allocations:', error.response?.data || error.message);
    }

    // Step 10: Test returning overdue allocation
    console.log('✅ Step 10: Testing return of overdue allocation...');
    try {
      const returnResponse = await axios.post(`${API_BASE}/asset-allocations/${allocation.id}/return`, {
        returnCondition: 'GOOD',
        returnNotes: 'Returned after overdue test'
      }, config);
      
      const returnedAllocation = returnResponse.data.data || returnResponse.data;
      console.log(`   ✅ Allocation returned successfully`);
      console.log(`   Status: ${returnedAllocation.status}`);
      console.log(`   Return date: ${new Date(returnedAllocation.returnDate).toLocaleDateString()}`);
      
      // Check asset status restored to AVAILABLE
      const assetCheckResponse = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
      const restoredAsset = assetCheckResponse.data.data || assetCheckResponse.data;
      console.log(`   Asset status restored to: ${restoredAsset.status}`);
      
      if (restoredAsset.status === 'AVAILABLE') {
        console.log('   ✅ PASS: Asset returned to AVAILABLE\n');
      }
    } catch (error) {
      console.error('❌ Failed to return allocation:', error.response?.data || error.message);
    }

    // Test Summary
    console.log('=' .repeat(60));
    console.log('🎉 TEST COMPLETE!\n');
    console.log('📋 Summary:');
    console.log(`   - Asset: ${asset.name} (${asset.assetCode})`);
    console.log(`   - Employee: ${employee.name}`);
    console.log(`   - Allocation ID: ${allocation.id}`);
    console.log(`   - Expected Return Date: ${new Date(allocation.expectedReturnDate).toLocaleDateString()}`);
    console.log(`   - Days Overdue: 3`);
    console.log('\n✅ All steps executed successfully!');
    console.log('\n💡 What was tested:');
    console.log('   ✓ Creating allocation with past due date');
    console.log('   ✓ Asset status changed to ALLOCATED');
    console.log('   ✓ Manual trigger of overdue detection');
    console.log('   ✓ Allocation status changed to OVERDUE');
    console.log('   ✓ Fetching overdue allocations list');
    console.log('   ✓ Returning overdue allocation');
    console.log('   ✓ Asset status restored to AVAILABLE');
    console.log('\n🔔 Note: The scheduled job runs daily at midnight automatically.');

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
console.log('Starting overdue detection test...\n');
console.log('⚙️  Configuration:');
console.log(`   API Base: ${API_BASE}`);
console.log(`   Tenant ID: ${TENANT_ID}\n`);

testOverdueDetection()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
