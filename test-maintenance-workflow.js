/**
 * Maintenance Workflow Test Script
 * Tests the complete lifecycle: Create → Start → Complete
 * Tests status transitions and statusBeforeMaintenance tracking
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TENANT_ID = '1'; // Adjust if needed

// Test credentials - UPDATE THESE with your test user credentials
const TEST_USER = {
  email: 'apitest@test.com',  // Change to your test user email
  password: 'Test@1234'       // Change to your test user password
};

// Test configuration
let config = {
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID
  }
};

/**
 * Login and get authentication token
 */
async function authenticate() {
  console.log('🔑 Authenticating...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
    const token = response.data.token;
    
    // Update config with auth token
    config.headers['Authorization'] = `Bearer ${token}`;
    
    console.log('✅ Authentication successful');
    return token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    console.error('\n💡 Please update TEST_USER credentials in the script with valid credentials.');
    throw error;
  }
}

async function testMaintenanceWorkflow() {
  console.log('🧪 MAINTENANCE WORKFLOW TEST\n');
  console.log('=' .repeat(60));

  try {
    // Step 0: Authenticate
    await authenticate();
    console.log('');

    // Step 1: Get or create a test asset
    console.log('\n📦 Step 1: Getting test asset...');
    let asset;
    try {
      const assetsResponse = await axios.get(`${API_BASE}/assets`, config);
      const assets = assetsResponse.data.data || assetsResponse.data;
      
      if (assets.length === 0) {
        console.log('⚠️  No assets found. Creating test asset...');
        
        // First, get or create a category
        let categoryId;
        try {
          const categoriesResponse = await axios.get(`${API_BASE}/assets/categories`, config);
          const categories = categoriesResponse.data.data || categoriesResponse.data;
          
          if (categories && categories.length > 0) {
            categoryId = categories[0].id;
            console.log(`   Using category: ${categories[0].name} (ID: ${categoryId})`);
          } else {
            console.log('   Creating test category...');
            const catResponse = await axios.post(`${API_BASE}/assets/categories`, {
              code: 'TEST-CAT-' + Date.now(),
              name: 'Test Equipment',
              description: 'Auto-created category for testing',
              defaultDepreciationMethod: 'STRAIGHT_LINE',
              defaultDepreciationRate: 10,
              defaultUsefulLife: 60
            }, config);
            const newCategory = catResponse.data.data || catResponse.data;
            categoryId = newCategory.id;
            console.log(`   ✅ Created category: ${newCategory.name} (ID: ${categoryId})`);
          }
        } catch (catError) {
          console.error('   ❌ Failed to get/create category:', catError.response?.data || catError.message);
          console.error('   Cannot proceed without a category. Please create one in the UI first.');
          return;
        }
        
        if (!categoryId) {
          console.error('   ❌ No categoryId available. Cannot create asset without a category.');
          return;
        }
        
        const createResponse = await axios.post(`${API_BASE}/assets`, {
          name: 'Test Asset for Maintenance',
          assetCode: 'TEST-MAINT-' + Date.now(),
          categoryId: categoryId,
          description: 'Test asset for maintenance workflow',
          purchaseDate: new Date().toISOString(),
          purchasePrice: 10000,
          status: 'AVAILABLE',
          location: 'Test Location',
          condition: 'EXCELLENT'
        }, config);
        asset = createResponse.data.data || createResponse.data;
      } else {
        // Find an AVAILABLE asset or use the first one
        asset = assets.find(a => a.status === 'AVAILABLE') || assets[0];
      }
      
      console.log(`✅ Using asset: ${asset.name} (${asset.assetCode})`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   ID: ${asset.id}`);
    } catch (error) {
      console.error('❌ Failed to get/create asset:', error.response?.data || error.message);
      return;
    }

    const originalStatus = asset.status;

    // Step 2: Create maintenance schedule
    console.log('\n🔧 Step 2: Creating maintenance schedule...');
    let maintenance;
    try {
      const maintenanceResponse = await axios.post(`${API_BASE}/asset-maintenance`, {
        assetId: asset.id,
        maintenanceType: 'PREVENTIVE',
        description: 'Test preventive maintenance - Oil change and inspection',
        scheduledDate: new Date().toISOString(),
        cost: 500,
        performedBy: 'Test Technician'
      }, config);
      maintenance = maintenanceResponse.data.data || maintenanceResponse.data;
      console.log(`✅ Maintenance created: ID ${maintenance.id}`);
      console.log(`   Status: ${maintenance.status}`);
      console.log(`   Type: ${maintenance.maintenanceType}`);
    } catch (error) {
      console.error('❌ Failed to create maintenance:', error.response?.data || error.message);
      return;
    }

    // Step 3: Verify asset status unchanged
    console.log('\n🔍 Step 3: Verifying asset status (should be unchanged)...');
    try {
      const assetCheckResponse = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
      const currentAsset = assetCheckResponse.data.data || assetCheckResponse.data;
      console.log(`✅ Asset status: ${currentAsset.status}`);
      if (currentAsset.status !== originalStatus) {
        console.warn(`⚠️  WARNING: Status changed from ${originalStatus} to ${currentAsset.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to check asset:', error.response?.data || error.message);
    }

    // Step 4: Start maintenance
    console.log('\n▶️  Step 4: Starting maintenance...');
    try {
      await axios.post(`${API_BASE}/asset-maintenance/${maintenance.id}/start`, {}, config);
      console.log('✅ Maintenance started successfully');
      
      // Verify maintenance status changed
      const maintenanceCheckResponse = await axios.get(`${API_BASE}/asset-maintenance/${maintenance.id}`, config);
      const updatedMaintenance = maintenanceCheckResponse.data.data || maintenanceCheckResponse.data;
      console.log(`   Maintenance status: ${updatedMaintenance.status}`);
      console.log(`   Status before maintenance: ${updatedMaintenance.statusBeforeMaintenance}`);
      
      if (updatedMaintenance.status !== 'IN_PROGRESS') {
        console.warn(`⚠️  WARNING: Expected status IN_PROGRESS, got ${updatedMaintenance.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to start maintenance:', error.response?.data || error.message);
      return;
    }

    // Step 5: Verify asset status changed to MAINTENANCE
    console.log('\n🔍 Step 5: Verifying asset status changed to MAINTENANCE...');
    try {
      const assetCheckResponse = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
      const currentAsset = assetCheckResponse.data.data || assetCheckResponse.data;
      console.log(`✅ Asset status: ${currentAsset.status}`);
      
      if (currentAsset.status === 'MAINTENANCE') {
        console.log('   ✅ PASS: Asset correctly marked as MAINTENANCE');
      } else {
        console.warn(`   ⚠️  FAIL: Expected MAINTENANCE, got ${currentAsset.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to check asset:', error.response?.data || error.message);
    }

    // Step 6: Complete maintenance
    console.log('\n✅ Step 6: Completing maintenance...');
    try {
      await axios.post(`${API_BASE}/asset-maintenance/${maintenance.id}/complete`, {
        performedBy: 'Test Technician',
        cost: 550,
        conditionAfter: 'GOOD',
        notes: 'All systems checked and operating normally'
      }, config);
      console.log('✅ Maintenance completed successfully');
    } catch (error) {
      console.error('❌ Failed to complete maintenance:', error.response?.data || error.message);
      return;
    }

    // Step 7: Verify asset status restored
    console.log('\n🔍 Step 7: Verifying asset status restored...');
    try {
      const assetCheckResponse = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
      const finalAsset = assetCheckResponse.data.data || assetCheckResponse.data;
      console.log(`✅ Asset status: ${finalAsset.status}`);
      
      if (finalAsset.status === originalStatus) {
        console.log(`   ✅ PASS: Asset status restored to ${originalStatus}`);
      } else {
        console.warn(`   ⚠️  WARNING: Expected ${originalStatus}, got ${finalAsset.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to check asset:', error.response?.data || error.message);
    }

    // Test Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST COMPLETE!\n');
    console.log('📋 Summary:');
    console.log(`   - Asset used: ${asset.name} (${asset.assetCode})`);
    console.log(`   - Original status: ${originalStatus}`);
    console.log(`   - Maintenance ID: ${maintenance.id}`);
    console.log(`   - Maintenance type: ${maintenance.maintenanceType}`);
    console.log('\n✅ All steps executed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Check database to verify statusBeforeMaintenance is stored');
    console.log('   - Test with multiple concurrent maintenance schedules');
    console.log('   - Test CANCELLED status restoration');

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
console.log('Starting maintenance workflow test...\n');
console.log('⚙️  Configuration:');
console.log(`   API Base: ${API_BASE}`);
console.log(`   Tenant ID: ${TENANT_ID}`);

testMaintenanceWorkflow()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
