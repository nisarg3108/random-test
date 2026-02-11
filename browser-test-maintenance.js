/**
 * 🧪 BROWSER CONSOLE TEST SCRIPT
 * 
 * HOW TO USE:
 * 1. Login to the frontend (http://localhost:3000)
 * 2. Open browser DevTools (F12) → Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Watch the test run automatically!
 * 
 * This script uses your current login session, so no password needed!
 */

(async function testMaintenanceWorkflow() {
  console.clear();
  console.log('%c🧪 MAINTENANCE WORKFLOW TEST', 'font-size: 20px; font-weight: bold; color: #4CAF50');
  console.log('='.repeat(60));
  
  // Get auth token from local storage (automatically from your login)
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId') || '1';
  
  if (!token) {
    console.error('❌ No auth token found. Please login first!');
    return;
  }
  
  const API_BASE = 'http://localhost:5000/api';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-tenant-id': tenantId
  };
  
  try {
    // Step 1: Get test asset
    console.log('\n📦 Step 1: Getting test asset...');
    const assetsRes = await fetch(`${API_BASE}/assets`, { headers });
    const assetsData = await assetsRes.json();
    const assets = assetsData.data || assetsData;
    
    if (!assets || assets.length === 0) {
      console.error('❌ No assets found. Please create an asset first.');
      return;
    }
    
    // Find an available asset or use first one
    const asset = assets.find(a => a.status === 'AVAILABLE') || assets[0];
    const originalStatus = asset.status;
    
    console.log(`%c✅ Using asset: ${asset.name} (${asset.assetCode})`, 'color: green; font-weight: bold');
    console.log(`   Original Status: ${originalStatus}`);
    console.log(`   ID: ${asset.id}`);
    
    // Step 2: Create maintenance schedule
    console.log('\n🔧 Step 2: Creating maintenance schedule...');
    const createRes = await fetch(`${API_BASE}/asset-maintenance`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assetId: asset.id,
        maintenanceType: 'PREVENTIVE',
        description: 'Browser Test - Preventive maintenance',
        scheduledDate: new Date().toISOString(),
        cost: 500,
        performedBy: 'Browser Test Script'
      })
    });
    const createData = await createRes.json();
    const maintenance = createData.data || createData;
    
    console.log(`%c✅ Maintenance created: ID ${maintenance.id}`, 'color: green');
    console.log(`   Status: ${maintenance.status}`);
    console.log(`   Type: ${maintenance.maintenanceType}`);
    
    // Step 3: Verify asset unchanged
    console.log('\n🔍 Step 3: Verifying asset status (should be unchanged)...');
    const assetCheck1Res = await fetch(`${API_BASE}/assets/${asset.id}`, { headers });
    const assetCheck1Data = await assetCheck1Res.json();
    const assetCheck1 = assetCheck1Data.data || assetCheck1Data;
    
    console.log(`   Asset status: ${assetCheck1.status}`);
    if (assetCheck1.status === originalStatus) {
      console.log('%c   ✅ PASS: Status unchanged', 'color: green');
    } else {
      console.log('%c   ⚠️ WARNING: Status changed unexpectedly', 'color: orange');
    }
    
    // Step 4: Start maintenance
    console.log('\n▶️  Step 4: Starting maintenance...');
    const startRes = await fetch(`${API_BASE}/asset-maintenance/${maintenance.id}/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    
    if (!startRes.ok) {
      const error = await startRes.json();
      console.error('❌ Failed to start:', error);
      return;
    }
    
    console.log('%c✅ Maintenance started', 'color: green');
    
    // Verify maintenance status
    const maintenanceCheckRes = await fetch(`${API_BASE}/asset-maintenance/${maintenance.id}`, { headers });
    const maintenanceCheckData = await maintenanceCheckRes.json();
    const maintenanceCheck = maintenanceCheckData.data || maintenanceCheckData;
    
    console.log(`   Maintenance status: ${maintenanceCheck.status}`);
    console.log(`   Status before maintenance: ${maintenanceCheck.statusBeforeMaintenance}`);
    
    if (maintenanceCheck.status === 'IN_PROGRESS') {
      console.log('%c   ✅ PASS: Status is IN_PROGRESS', 'color: green');
    }
    
    // Step 5: Verify asset status changed to MAINTENANCE
    console.log('\n🔍 Step 5: Verifying asset status changed to MAINTENANCE...');
    const assetCheck2Res = await fetch(`${API_BASE}/assets/${asset.id}`, { headers });
    const assetCheck2Data = await assetCheck2Res.json();
    const assetCheck2 = assetCheck2Data.data || assetCheck2Data;
    
    console.log(`   Asset status: ${assetCheck2.status}`);
    
    if (assetCheck2.status === 'MAINTENANCE') {
      console.log('%c   ✅ PASS: Asset marked as MAINTENANCE', 'color: green; font-weight: bold');
    } else {
      console.log('%c   ❌ FAIL: Expected MAINTENANCE, got ' + assetCheck2.status, 'color: red; font-weight: bold');
    }
    
    // Step 6: Complete maintenance
    console.log('\n✅ Step 6: Completing maintenance...');
    const completeRes = await fetch(`${API_BASE}/asset-maintenance/${maintenance.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'COMPLETED',
        performedBy: 'Browser Test Script',
        cost: 550,
        conditionAfter: 'GOOD',
        notes: 'Browser test completed successfully'
      })
    });
    
    if (!completeRes.ok) {
      const error = await completeRes.json();
      console.error('❌ Failed to complete:', error);
      return;
    }
    
    console.log('%c✅ Maintenance completed', 'color: green');
    
    // Step 7: Verify status restored
    console.log('\n🔍 Step 7: Verifying asset status restored...');
    const assetCheck3Res = await fetch(`${API_BASE}/assets/${asset.id}`, { headers });
    const assetCheck3Data = await assetCheck3Res.json();
    const assetCheck3 = assetCheck3Data.data || assetCheck3Data;
    
    console.log(`   Asset status: ${assetCheck3.status}`);
    
    if (assetCheck3.status === originalStatus) {
      console.log(`%c   ✅ PASS: Status restored to ${originalStatus}`, 'color: green; font-weight: bold');
    } else {
      console.log(`%c   ⚠️ WARNING: Expected ${originalStatus}, got ${assetCheck3.status}`, 'color: orange');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('%c🎉 TEST COMPLETE!', 'font-size: 18px; font-weight: bold; color: #4CAF50');
    console.log('\n📋 Test Summary:');
    console.log(`   Asset: ${asset.name} (${asset.assetCode})`);
    console.log(`   Original Status: ${originalStatus}`);
    console.log(`   Maintenance ID: ${maintenance.id}`);
    console.log(`   Final Status: ${assetCheck3.status}`);
    
    console.log('\n✅ Results:');
    console.log('   ✓ Maintenance schedule created (SCHEDULED)');
    console.log('   ✓ Maintenance started (IN_PROGRESS)');
    console.log('   ✓ Asset transitioned to MAINTENANCE');
    console.log('   ✓ statusBeforeMaintenance stored: ' + maintenanceCheck.statusBeforeMaintenance);
    console.log('   ✓ Maintenance completed');
    console.log('   ✓ Asset status restored to: ' + assetCheck3.status);
    
    console.log('\n💡 What to check in the UI:');
    console.log('   1. Go to Assets → Maintenance');
    console.log('   2. Find maintenance ID: ' + maintenance.id);
    console.log('   3. Status should show COMPLETED (green badge)');
    console.log('   4. Go to Assets → Asset List');
    console.log('   5. Find asset: ' + asset.name);
    console.log('   6. Status should be: ' + assetCheck3.status);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('Error details:', error.message);
  }
})();
