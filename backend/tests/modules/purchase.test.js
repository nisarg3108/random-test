/**
 * Purchase Module Test Suite
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n🛒 PURCHASE MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let vendorId, poId, receiptId;

    // Test 1: Create Vendor
    try {
      const vendorData = {
        name: `Test Vendor ${Date.now()}`,
        email: `vendor${Date.now()}@test.com`,
        phone: '1234567890',
        address: 'Test Address'
      };
      const response = await apiCall('POST', '/purchase/vendors', vendorData);
      vendorId = response.data?.id || response.id;
      logTest('Create Vendor', 'pass', `- ID: ${vendorId}`);
    } catch (error) {
      logTest('Create Vendor', 'fail', `- ${error.message}`);
    }

    // Test 2: Create Purchase Order
    if (vendorId) {
      try {
        const poData = {
          vendorId,
          items: [{ name: 'Test Item', quantity: 50, unitPrice: 50 }],
          expectedDelivery: new Date(Date.now() + 7 * 86400000).toISOString(),
          status: 'DRAFT'
        };
        const response = await apiCall('POST', '/purchase/orders', poData);
        poId = response.data?.id || response.id;
        logTest('Create Purchase Order', 'pass', `- ID: ${poId}`);
      } catch (error) {
        logTest('Create Purchase Order', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Purchase Order', 'skip', '- No vendor ID');
    }

    // Test 3: Get Purchase Orders
    try {
      const response = await apiCall('GET', '/purchase/orders');
      const orders = response.data || response;
      logTest('Get Purchase Orders', 'pass', `- Found ${orders.length} orders`);
    } catch (error) {
      logTest('Get Purchase Orders', 'fail', `- ${error.message}`);
    }

    // Test 4: Create Goods Receipt
    if (poId) {
      try {
        const receiptData = {
          purchaseOrderId: poId,
          receivedDate: new Date().toISOString(),
          items: [{ itemId: 1, quantityReceived: 50 }]
        };
        const response = await apiCall('POST', '/purchase/receipts', receiptData);
        receiptId = response.data?.id || response.id;
        logTest('Create Goods Receipt', 'pass', `- ID: ${receiptId}`);
      } catch (error) {
        logTest('Create Goods Receipt', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Goods Receipt', 'skip', '- No PO ID');
    }

    // Test 5: Get Purchase Analytics
    try {
      const response = await apiCall('GET', '/purchase/analytics');
      const analytics = response.data || response;
      logTest('Get Purchase Analytics', 'pass', 
        `- Total Spend: ₹${analytics.totalSpend || 0}`);
    } catch (error) {
      logTest('Get Purchase Analytics', 'fail', `- ${error.message}`);
    }
  }
};
