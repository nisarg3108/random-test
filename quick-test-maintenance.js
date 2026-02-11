/**
 * Quick Test: Fresh Asset Maintenance Workflow
 * Creates a new asset with AVAILABLE status and tests full lifecycle
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const TENANT_ID = '1';

const TEST_USER = {
  email: 'admin@example.com',
  password: 'password123'
};

let config = {
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID
  }
};

async function authenticate() {
  const response = await axios.post(`${API_BASE}/auth/login`, TEST_USER);
  config.headers['Authorization'] = `Bearer ${response.data.token}`;
  return response.data.token;
}

async function quickTest() {
  console.log('🚀 QUICK TEST: Fresh Asset Maintenance Workflow\n');
  
  await authenticate();
  
  // Get category
  const catRes = await axios.get(`${API_BASE}/assets/categories`, config);
  const categories = catRes.data.data || catRes.data;
  const categoryId = categories[0].id;
  
  // Create fresh AVAILABLE asset
  console.log('📦 Creating fresh AVAILABLE asset...');
  const assetRes = await axios.post(`${API_BASE}/assets`, {
    name: 'Fresh Test Asset',
    assetCode: 'FRESH-' + Date.now(),
    categoryId,
    description: 'Fresh asset for clean test',
    purchaseDate: new Date().toISOString(),
    purchasePrice: 5000,
    status: 'AVAILABLE',
    location: 'Warehouse',
    condition: 'EXCELLENT'
  }, config);
  const asset = assetRes.data.data || assetRes.data;
  console.log(`✅ Created: ${asset.name} - Status: ${asset.status}\n`);
  
  // Create maintenance
  console.log('🔧 Creating maintenance...');
  const mainRes = await axios.post(`${API_BASE}/asset-maintenance`, {
    assetId: asset.id,
    maintenanceType: 'PREVENTIVE',
    description: 'Routine maintenance',
    scheduledDate: new Date().toISOString(),
    cost: 200,
    performedBy: 'Technician'
  }, config);
  const maintenance = mainRes.data.data || mainRes.data;
  console.log(`✅ Maintenance created: ${maintenance.status}\n`);
  
  // Start maintenance
  console.log('▶️  Starting maintenance...');
  await axios.post(`${API_BASE}/asset-maintenance/${maintenance.id}/start`, {}, config);
  
  const checkRes1 = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
  const assetAfterStart = checkRes1.data.data || checkRes1.data;
  console.log(`   Asset status after start: ${assetAfterStart.status}`);
  
  if (assetAfterStart.status === 'MAINTENANCE') {
    console.log('   ✅ PASS: Changed AVAILABLE → MAINTENANCE\n');
  } else {
    console.log('   ❌ FAIL: Status should be MAINTENANCE\n');
  }
  
  // Complete maintenance
  console.log('✅ Completing maintenance...');
  await axios.post(`${API_BASE}/asset-maintenance/${maintenance.id}/complete`, {
    performedBy: 'Technician',
    cost: 220,
    conditionAfter: 'EXCELLENT',
    notes: 'All good'
  }, config);
  
  const checkRes2 = await axios.get(`${API_BASE}/assets/${asset.id}`, config);
  const assetAfterComplete = checkRes2.data.data || checkRes2.data;
  console.log(`   Asset status after complete: ${assetAfterComplete.status}`);
  
  if (assetAfterComplete.status === 'AVAILABLE') {
    console.log('   ✅ PASS: Restored MAINTENANCE → AVAILABLE\n');
  } else {
    console.log('   ❌ FAIL: Status should be AVAILABLE\n');
  }
  
  console.log('🎉 TEST COMPLETE!');
  console.log(`\nAsset ID: ${asset.id}`);
  console.log(`Maintenance ID: ${maintenance.id}`);
}

quickTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  });
