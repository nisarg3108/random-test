/**
 * Assets Module Test Suite
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n🏢 ASSETS MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let assetId, allocationId, maintenanceId;

    // Test 1: Create Asset
    try {
      const assetData = {
        name: `Test Asset ${Date.now()}`,
        assetCode: `AST${Date.now()}`,
        category: 'EQUIPMENT',
        purchaseDate: new Date().toISOString(),
        purchasePrice: 50000,
        status: 'AVAILABLE'
      };
      const response = await apiCall('POST', '/assets', assetData);
      assetId = response.data?.id || response.id;
      logTest('Create Asset', 'pass', `- ID: ${assetId}`);
    } catch (error) {
      logTest('Create Asset', 'fail', `- ${error.message}`);
    }

    // Test 2: Get All Assets
    try {
      const response = await apiCall('GET', '/assets');
      const assets = response.data || response;
      if (!assetId && assets.length > 0) assetId = assets[0].id;
      logTest('Get All Assets', 'pass', `- Found ${assets.length} assets`);
    } catch (error) {
      logTest('Get All Assets', 'fail', `- ${error.message}`);
    }

    // Test 3: Allocate Asset
    if (assetId) {
      try {
        const allocationData = {
          assetId,
          employeeId: 1,
          allocatedDate: new Date().toISOString(),
          expectedReturnDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          purpose: 'Test allocation'
        };
        const response = await apiCall('POST', '/assets/allocations', allocationData);
        allocationId = response.data?.id || response.id;
        logTest('Allocate Asset', 'pass', `- Allocation ID: ${allocationId}`);
      } catch (error) {
        logTest('Allocate Asset', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Allocate Asset', 'skip', '- No asset ID');
    }

    // Test 4: Get Asset Allocations
    try {
      const response = await apiCall('GET', '/assets/allocations');
      const allocations = response.data || response;
      logTest('Get Asset Allocations', 'pass', `- Found ${allocations.length} allocations`);
    } catch (error) {
      logTest('Get Asset Allocations', 'fail', `- ${error.message}`);
    }

    // Test 5: Return Asset
    if (allocationId) {
      try {
        const returnData = {
          returnDate: new Date().toISOString(),
          condition: 'GOOD',
          notes: 'Returned in good condition'
        };
        await apiCall('PATCH', `/assets/allocations/${allocationId}/return`, returnData);
        logTest('Return Asset', 'pass', '- Asset returned successfully');
      } catch (error) {
        logTest('Return Asset', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Return Asset', 'skip', '- No allocation ID');
    }

    // Test 6: Create Maintenance Record
    if (assetId) {
      try {
        const maintenanceData = {
          assetId,
          type: 'PREVENTIVE',
          scheduledDate: new Date().toISOString(),
          description: 'Regular maintenance',
          cost: 1000,
          status: 'SCHEDULED'
        };
        const response = await apiCall('POST', '/assets/maintenance', maintenanceData);
        maintenanceId = response.data?.id || response.id;
        logTest('Create Maintenance Record', 'pass', `- ID: ${maintenanceId}`);
      } catch (error) {
        logTest('Create Maintenance Record', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Maintenance Record', 'skip', '- No asset ID');
    }

    // Test 7: Calculate Depreciation
    if (assetId) {
      try {
        const response = await apiCall('GET', `/assets/${assetId}/depreciation`);
        const depreciation = response.data || response;
        logTest('Calculate Depreciation', 'pass', 
          `- Current Value: ₹${depreciation.currentValue || 0}`);
      } catch (error) {
        logTest('Calculate Depreciation', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Calculate Depreciation', 'skip', '- No asset ID');
    }

    // Test 8: Get Asset Dashboard
    try {
      const response = await apiCall('GET', '/assets/dashboard');
      const dashboard = response.data || response;
      logTest('Get Asset Dashboard', 'pass', 
        `- Total Assets: ${dashboard.totalAssets || 0}`);
    } catch (error) {
      logTest('Get Asset Dashboard', 'fail', `- ${error.message}`);
    }
  }
};
