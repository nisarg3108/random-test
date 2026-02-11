/**
 * Inventory Module Test Suite
 * Tests: Items, Stock Movements, Warehouses, Stock Levels
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n📦 INVENTORY MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let itemId, warehouseId, movementId;

    // Test 1: Get All Items
    try {
      const response = await apiCall('GET', '/inventory/items');
      const items = response.data || response;
      if (items.length > 0) itemId = items[0].id;
      logTest('Get All Items', 'pass', `- Found ${items.length} items`);
    } catch (error) {
      logTest('Get All Items', 'fail', `- ${error.message}`);
    }

    // Test 2: Create Item
    try {
      const itemData = {
        name: `Test Item ${Date.now()}`,
        sku: `SKU${Date.now()}`,
        description: 'Test inventory item',
        unitPrice: 100,
        reorderLevel: 10,
        category: 'TEST'
      };
      const response = await apiCall('POST', '/inventory/items', itemData);
      itemId = response.data?.id || response.id;
      logTest('Create Item', 'pass', `- ID: ${itemId}, SKU: ${itemData.sku}`);
    } catch (error) {
      logTest('Create Item', 'fail', `- ${error.message}`);
    }

    // Test 3: Get Item Details
    if (itemId) {
      try {
        const response = await apiCall('GET', `/inventory/items/${itemId}`);
        const item = response.data || response;
        logTest('Get Item Details', 'pass', `- ${item.name}, Stock: ${item.quantity || 0}`);
      } catch (error) {
        logTest('Get Item Details', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Get Item Details', 'skip', '- No item ID');
    }

    // Test 4: Get Warehouses
    try {
      const response = await apiCall('GET', '/inventory/warehouses');
      const warehouses = response.data || response;
      if (warehouses.length > 0) warehouseId = warehouses[0].id;
      logTest('Get Warehouses', 'pass', `- Found ${warehouses.length} warehouses`);
    } catch (error) {
      logTest('Get Warehouses', 'fail', `- ${error.message}`);
    }

    // Test 5: Create Warehouse
    try {
      const warehouseData = {
        name: `Test Warehouse ${Date.now()}`,
        code: `WH${Date.now()}`,
        location: 'Test Location',
        capacity: 1000
      };
      const response = await apiCall('POST', '/inventory/warehouses', warehouseData);
      warehouseId = response.data?.id || response.id;
      logTest('Create Warehouse', 'pass', `- ID: ${warehouseId}`);
    } catch (error) {
      logTest('Create Warehouse', 'fail', `- ${error.message}`);
    }

    // Test 6: Create Stock Movement (IN)
    if (itemId && warehouseId) {
      try {
        const movementData = {
          itemId,
          warehouseId,
          type: 'IN',
          quantity: 100,
          reference: `REF${Date.now()}`,
          notes: 'Test stock in'
        };
        const response = await apiCall('POST', '/inventory/stock-movements', movementData);
        movementId = response.data?.id || response.id;
        logTest('Create Stock Movement (IN)', 'pass', `- ID: ${movementId}, Qty: 100`);
      } catch (error) {
        logTest('Create Stock Movement (IN)', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Stock Movement (IN)', 'skip', '- Missing item or warehouse');
    }

    // Test 7: Create Stock Movement (OUT)
    if (itemId && warehouseId) {
      try {
        const movementData = {
          itemId,
          warehouseId,
          type: 'OUT',
          quantity: 10,
          reference: `REF${Date.now()}`,
          notes: 'Test stock out'
        };
        await apiCall('POST', '/inventory/stock-movements', movementData);
        logTest('Create Stock Movement (OUT)', 'pass', '- Qty: 10');
      } catch (error) {
        logTest('Create Stock Movement (OUT)', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Stock Movement (OUT)', 'skip', '- Missing item or warehouse');
    }

    // Test 8: Get Stock Movements
    try {
      const response = await apiCall('GET', '/inventory/stock-movements');
      const movements = response.data || response;
      logTest('Get Stock Movements', 'pass', `- Found ${movements.length} movements`);
    } catch (error) {
      logTest('Get Stock Movements', 'fail', `- ${error.message}`);
    }

    // Test 9: Get Low Stock Items
    try {
      const response = await apiCall('GET', '/inventory/items/low-stock');
      const lowStock = response.data || response;
      logTest('Get Low Stock Items', 'pass', `- Found ${lowStock.length} items`);
    } catch (error) {
      logTest('Get Low Stock Items', 'fail', `- ${error.message}`);
    }

    // Test 10: Get Stock Valuation
    try {
      const response = await apiCall('GET', '/inventory/valuation');
      const valuation = response.data || response;
      logTest('Get Stock Valuation', 'pass', `- Total Value: ₹${valuation.totalValue || 0}`);
    } catch (error) {
      logTest('Get Stock Valuation', 'fail', `- ${error.message}`);
    }

    // Test 11: Update Item
    if (itemId) {
      try {
        const updateData = { unitPrice: 150 };
        await apiCall('PATCH', `/inventory/items/${itemId}`, updateData);
        logTest('Update Item', 'pass', '- Price updated to ₹150');
      } catch (error) {
        logTest('Update Item', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Update Item', 'skip', '- No item ID');
    }

    // Test 12: Export Inventory Report
    try {
      await apiCall('GET', '/inventory/export/csv');
      logTest('Export Inventory Report', 'pass', '- CSV generated');
    } catch (error) {
      logTest('Export Inventory Report', 'fail', `- ${error.message}`);
    }
  }
};
