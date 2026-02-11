/**
 * Sales Module Test Suite
 * Tests: Quotations, Orders, Invoices, Payments, Analytics
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n💼 SALES MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let customerId, quotationId, orderId, invoiceId, paymentId;

    // Get customer
    try {
      const response = await apiCall('GET', '/crm/customers');
      const customers = response.data || response;
      if (customers.length > 0) customerId = customers[0].id;
    } catch (error) {}

    // Test 1: Create Quotation
    if (customerId) {
      try {
        const quotationData = {
          customerId,
          items: [{ name: 'Test Item', quantity: 10, unitPrice: 100 }],
          validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: 'DRAFT'
        };
        const response = await apiCall('POST', '/sales/quotations', quotationData);
        quotationId = response.data?.id || response.id;
        logTest('Create Quotation', 'pass', `- ID: ${quotationId}`);
      } catch (error) {
        logTest('Create Quotation', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Quotation', 'skip', '- No customer ID');
    }

    // Test 2: Convert Quotation to Order
    if (quotationId) {
      try {
        const response = await apiCall('POST', `/sales/quotations/${quotationId}/convert`);
        orderId = response.data?.orderId || response.orderId;
        logTest('Convert Quotation to Order', 'pass', `- Order ID: ${orderId}`);
      } catch (error) {
        logTest('Convert Quotation to Order', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Convert Quotation to Order', 'skip', '- No quotation ID');
    }

    // Test 3: Get Sales Orders
    try {
      const response = await apiCall('GET', '/sales/orders');
      const orders = response.data || response;
      if (!orderId && orders.length > 0) orderId = orders[0].id;
      logTest('Get Sales Orders', 'pass', `- Found ${orders.length} orders`);
    } catch (error) {
      logTest('Get Sales Orders', 'fail', `- ${error.message}`);
    }

    // Test 4: Create Invoice from Order
    if (orderId) {
      try {
        const response = await apiCall('POST', `/sales/orders/${orderId}/invoice`);
        invoiceId = response.data?.id || response.id;
        logTest('Create Invoice from Order', 'pass', `- Invoice ID: ${invoiceId}`);
      } catch (error) {
        logTest('Create Invoice from Order', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Create Invoice from Order', 'skip', '- No order ID');
    }

    // Test 5: Get Invoices
    try {
      const response = await apiCall('GET', '/sales/invoices');
      const invoices = response.data || response;
      if (!invoiceId && invoices.length > 0) invoiceId = invoices[0].id;
      logTest('Get Invoices', 'pass', `- Found ${invoices.length} invoices`);
    } catch (error) {
      logTest('Get Invoices', 'fail', `- ${error.message}`);
    }

    // Test 6: Record Payment
    if (invoiceId) {
      try {
        const paymentData = {
          invoiceId,
          amount: 1000,
          paymentDate: new Date().toISOString(),
          paymentMethod: 'BANK_TRANSFER',
          reference: `PAY${Date.now()}`
        };
        const response = await apiCall('POST', '/sales/payments', paymentData);
        paymentId = response.data?.id || response.id;
        logTest('Record Payment', 'pass', `- Payment ID: ${paymentId}, Amount: ₹1000`);
      } catch (error) {
        logTest('Record Payment', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Record Payment', 'skip', '- No invoice ID');
    }

    // Test 7: Get Sales Analytics
    try {
      const response = await apiCall('GET', '/sales/analytics');
      const analytics = response.data || response;
      logTest('Get Sales Analytics', 'pass', 
        `- Total Revenue: ₹${analytics.totalRevenue || 0}`);
    } catch (error) {
      logTest('Get Sales Analytics', 'fail', `- ${error.message}`);
    }

    // Test 8: Get Conversion Metrics
    try {
      const response = await apiCall('GET', '/sales/analytics/conversion');
      const metrics = response.data || response;
      logTest('Get Conversion Metrics', 'pass', 
        `- Conversion Rate: ${metrics.conversionRate || 0}%`);
    } catch (error) {
      logTest('Get Conversion Metrics', 'fail', `- ${error.message}`);
    }

    // Test 9: Export Sales Report
    try {
      await apiCall('GET', '/sales/export/pdf');
      logTest('Export Sales Report', 'pass', '- PDF generated');
    } catch (error) {
      logTest('Export Sales Report', 'fail', `- ${error.message}`);
    }

    // Test 10: Get Pending Invoices
    try {
      const response = await apiCall('GET', '/sales/invoices?status=PENDING');
      const pending = response.data || response;
      logTest('Get Pending Invoices', 'pass', `- Found ${pending.length} pending invoices`);
    } catch (error) {
      logTest('Get Pending Invoices', 'fail', `- ${error.message}`);
    }
  }
};
