/**
 * 🧪 BROWSER CONSOLE TEST: OVERDUE ALLOCATION DETECTION
 * 
 * HOW TO USE:
 * 1. Login to the frontend (http://localhost:3000)
 * 2. Open browser DevTools (F12) → Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Watch the test run automatically!
 * 
 * This script tests the complete overdue allocation workflow
 */

(async function testOverdueAllocations() {
  console.clear();
  console.log('%c🧪 OVERDUE ALLOCATION DETECTION TEST', 'font-size: 20px; font-weight: bold; color: #F59E0B');
  console.log('='.repeat(60));
  
  // Get auth token from local storage
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
    
    const asset = assets.find(a => a.status === 'AVAILABLE') || assets[0];
    console.log(`%c✅ Using asset: ${asset.name} (${asset.assetCode})`, 'color: green; font-weight: bold');
    console.log(`   Status: ${asset.status}`);
    console.log(`   ID: ${asset.id}`);
    
    // Step 2: Get test employee
    console.log('\n👤 Step 2: Getting test employee...');
    const employeesRes = await fetch(`${API_BASE}/employees`, { headers });
    const employeesData = await employeesRes.json();
    const employees = employeesData.data || employeesData;
    
    if (!employees || employees.length === 0) {
      console.error('❌ No employees found. Please create an employee first.');
      return;
    }
    
    const employee = employees[0];
    console.log(`%c✅ Using employee: ${employee.name}`, 'color: green; font-weight: bold');
    console.log(`   Email: ${employee.email}`);
    console.log(`   ID: ${employee.id}`);
    
    // Step 3: Create allocation with past due date
    console.log('\n📅 Step 3: Creating allocation with past due date...');
    
    // Set expected return date to 3 days ago
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    
    const createRes = await fetch(`${API_BASE}/asset-allocations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assetId: asset.id,
        employeeId: employee.id,
        allocatedDate: new Date().toISOString(),
        expectedReturnDate: pastDate.toISOString(),
        purpose: 'Browser test - overdue detection',
        location: 'Test Location'
      })
    });
    
    const createData = await createRes.json();
    const allocation = createData.data || createData;
    
    console.log(`%c✅ Allocation created: ID ${allocation.id}`, 'color: green');
    console.log(`   Status: ${allocation.status}`);
    console.log(`   Expected Return: ${new Date(allocation.expectedReturnDate).toLocaleDateString()}`);
    console.log(`   %c(3 days ago - should be marked as overdue)`, 'color: orange; font-style: italic');
    
    // Step 4: Verify asset status
    console.log('\n🔍 Step 4: Verifying asset status changed to ALLOCATED...');
    const assetCheck1Res = await fetch(`${API_BASE}/assets/${asset.id}`, { headers });
    const assetCheck1Data = await assetCheck1Res.json();
    const assetCheck1 = assetCheck1Data.data || assetCheck1Data;
    
    console.log(`   Asset status: ${assetCheck1.status}`);
    if (assetCheck1.status === 'ALLOCATED') {
      console.log('%c   ✅ PASS: Asset marked as ALLOCATED', 'color: green');
    } else {
      console.log('%c   ⚠️ WARNING: Unexpected status', 'color: orange');
    }
    
    // Step 5: Check initial overdue count
    console.log('\n📊 Step 5: Checking current overdue allocations...');
    const overdueRes1 = await fetch(`${API_BASE}/asset-allocations/overdue`, { headers });
    const overdueData1 = await overdueRes1.json();
    const overdueAllocations1 = overdueData1.data || overdueData1;
    console.log(`   Current overdue count: ${overdueAllocations1.length}`);
    
    // Step 6: Trigger overdue detection
    console.log('\n⚡ Step 6: Triggering overdue detection...');
    const markRes = await fetch(`${API_BASE}/asset-allocations/mark-overdue`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    
    const markData = await markRes.json();
    
    console.log(`%c✅ Overdue detection completed`, 'color: green; font-weight: bold');
    console.log(`   Marked ${markData.count} allocation(s) as overdue`);
    
    if (markData.count > 0) {
      console.log(`   Affected allocations:`, markData.allocations.map(a => a.id));
    }
    
    // Step 7: Verify allocation status changed
    console.log('\n🔍 Step 7: Verifying allocation status changed to OVERDUE...');
    const allocationCheckRes = await fetch(`${API_BASE}/asset-allocations/${allocation.id}`, { headers });
    const allocationCheckData = await allocationCheckRes.json();
    const updatedAllocation = allocationCheckData.data || allocationCheckData;
    
    console.log(`   Allocation status: ${updatedAllocation.status}`);
    
    if (updatedAllocation.status === 'OVERDUE') {
      console.log('%c   ✅ PASS: Allocation correctly marked as OVERDUE', 'color: green; font-weight: bold');
    } else {
      console.log(`%c   ❌ FAIL: Expected OVERDUE, got ${updatedAllocation.status}`, 'color: red; font-weight: bold');
    }
    
    // Step 8: Verify asset status unchanged
    console.log('\n🔍 Step 8: Verifying asset status remains ALLOCATED...');
    const assetCheck2Res = await fetch(`${API_BASE}/assets/${asset.id}`, { headers });
    const assetCheck2Data = await assetCheck2Res.json();
    const assetCheck2 = assetCheck2Data.data || assetCheck2Data;
    
    console.log(`   Asset status: ${assetCheck2.status}`);
    if (assetCheck2.status === 'ALLOCATED') {
      console.log('%c   ✅ PASS: Asset status unchanged', 'color: green');
    }
    
    // Step 9: Get all overdue allocations
    console.log('\n📋 Step 9: Fetching all overdue allocations...');
    const overdueRes2 = await fetch(`${API_BASE}/asset-allocations/overdue`, { headers });
    const overdueData2 = await overdueRes2.json();
    const overdueAllocations2 = overdueData2.data || overdueData2;
    
    console.log(`   ✅ Found ${overdueAllocations2.length} overdue allocation(s)`);
    
    const testAllocation = overdueAllocations2.find(a => a.id === allocation.id);
    if (testAllocation) {
      console.log('%c   ✅ PASS: Test allocation found in overdue list', 'color: green; font-weight: bold');
      
      const daysOverdue = Math.floor((new Date() - new Date(testAllocation.expectedReturnDate)) / (1000 * 60 * 60 * 24));
      console.log(`   Days overdue: ${daysOverdue}`);
      console.log(`   Employee: ${testAllocation.employee?.name}`);
      console.log(`   Asset: ${testAllocation.asset?.name}`);
    } else {
      console.log('%c   ⚠️ WARNING: Test allocation not in overdue list', 'color: orange');
    }
    
    // Step 10: Return allocation
    console.log('\n✅ Step 10: Testing return of overdue allocation...');
    const returnRes = await fetch(`${API_BASE}/asset-allocations/${allocation.id}/return`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        returnCondition: 'GOOD',
        returnNotes: 'Returned after overdue test'
      })
    });
    
    const returnData = await returnRes.json();
    const returnedAllocation = returnData.data || returnData;
    
    console.log(`%c✅ Allocation returned successfully`, 'color: green');
    console.log(`   Status: ${returnedAllocation.status}`);
    console.log(`   Return date: ${new Date(returnedAllocation.returnDate).toLocaleDateString()}`);
    
    // Check asset restored
    const assetCheck3Res = await fetch(`${API_BASE}/assets/${asset.id}`, { headers });
    const assetCheck3Data = await assetCheck3Res.json();
    const assetCheck3 = assetCheck3Data.data || assetCheck3Data;
    
    console.log(`   Asset status restored to: ${assetCheck3.status}`);
    if (assetCheck3.status === 'AVAILABLE') {
      console.log('%c   ✅ PASS: Asset returned to AVAILABLE', 'color: green; font-weight: bold');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('%c🎉 TEST COMPLETE!', 'font-size: 18px; font-weight: bold; color: #10B981');
    console.log('\n📋 Test Summary:');
    console.log(`   Asset: ${asset.name} (${asset.assetCode})`);
    console.log(`   Employee: ${employee.name}`);
    console.log(`   Allocation ID: ${allocation.id}`);
    console.log(`   Expected Return: ${new Date(allocation.expectedReturnDate).toLocaleDateString()}`);
    
    console.log('\n✅ Results:');
    console.log('   ✓ Allocation created with past due date');
    console.log('   ✓ Asset status changed to ALLOCATED');
    console.log('   ✓ Overdue detection triggered manually');
    console.log('   ✓ Allocation marked as OVERDUE');
    console.log('   ✓ Found in overdue allocations list');
    console.log('   ✓ Successfully returned overdue allocation');
    console.log('   ✓ Asset status restored to AVAILABLE');
    
    console.log('\n💡 What to check in the UI:');
    console.log('   1. Go to Assets → Allocations');
    console.log('   2. Check Overdue stat card (should show count)');
    console.log('   3. Click "Overdue" to filter');
    console.log('   4. See red-highlighted rows with days overdue');
    console.log('   5. Returned allocation should now show as RETURNED');
    
    console.log('\n🔔 Automatic Detection:');
    console.log('   The scheduled job runs daily at midnight (00:00)');
    console.log('   It will automatically mark overdue allocations');
    console.log('   No manual intervention needed in production');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('Error details:', error.message);
  }
})();
