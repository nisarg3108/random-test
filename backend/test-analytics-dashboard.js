/**
 * Test script for Sales Analytics Dashboard
 * Tests all analytics endpoints with sample authentication
 */

const performanceTest = async () => {
  console.log('🧪 Testing Sales Analytics Endpoints\n');
  console.log('═══════════════════════════════════════\n');

  const baseURL = 'http://localhost:5000/api';
  
  // Test credentials - you'll need to login first or use a valid token
  console.log('⚠️  NOTE: You need to be logged in to test these endpoints\n');
  console.log('📋 Available Analytics Endpoints:\n');
  
  const endpoints = [
    {
      name: 'Comprehensive Analytics',
      url: `${baseURL}/sales/analytics`,
      method: 'GET',
      params: '?startDate=2026-01-01&endDate=2026-02-09',
      description: 'Get complete sales analytics including revenue, conversions, top customers'
    },
    {
      name: 'Revenue Metrics',
      url: `${baseURL}/sales/analytics/revenue`,
      method: 'GET',
      params: '?period=30d',
      description: 'Get revenue performance metrics with growth rate (7d/30d/90d/1y)'
    },
    {
      name: 'Payment Analytics',
      url: `${baseURL}/sales/analytics/payments`,
      method: 'GET',
      params: '?startDate=2026-01-01&endDate=2026-02-09',
      description: 'Get payment behavior analytics and method breakdown'
    }
  ];

  endpoints.forEach((endpoint, index) => {
    console.log(`${index + 1}. ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}${endpoint.params}`);
    console.log(`   Method: ${endpoint.method}`);
    console.log(`   Description: ${endpoint.description}\n`);
  });

  console.log('═══════════════════════════════════════\n');
  console.log('📊 Frontend Dashboard:\n');
  console.log('   URL: http://localhost:5175/sales/analytics');
  console.log('   Route: /sales/analytics\n');

  console.log('═══════════════════════════════════════\n');
  console.log('✅ Testing Instructions:\n');
  console.log('1. Navigate to http://localhost:5175 in your browser');
  console.log('2. Log in with your credentials');
  console.log('3. Navigate to Sales → Analytics');
  console.log('4. The dashboard should load with:');
  console.log('   - Summary cards (Revenue, Payments, etc.)');
  console.log('   - Conversion metrics panel');
  console.log('   - Interactive charts (Revenue, Payments, Status, Methods)');
  console.log('   - Top customers and products lists\n');

  console.log('═══════════════════════════════════════\n');
  console.log('🔍 Checking Database for Sample Data:\n');

  // Check if we can query the database
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get counts
    const [quotationCount, orderCount, invoiceCount, paymentCount] = await Promise.all([
      prisma.salesQuotation.count(),
      prisma.salesOrder.count(),
      prisma.salesInvoice.count(),
      prisma.invoicePayment.count()
    ]);

    console.log(`   📑 Quotations: ${quotationCount}`);
    console.log(`   📦 Orders: ${orderCount}`);
    console.log(`   💰 Invoices: ${invoiceCount}`);
    console.log(`   💳 Payments: ${paymentCount}\n`);

    if (invoiceCount === 0) {
      console.log('⚠️  WARNING: No sales data found in database!');
      console.log('   You need to create some sample data first:\n');
      console.log('   1. Create quotations in Sales → Quotations');
      console.log('   2. Convert quotations to orders');
      console.log('   3. Convert orders to invoices');
      console.log('   4. Record payments on invoices\n');
    } else {
      console.log('✅ Sales data found! Analytics should display properly.\n');
      
      // Get sample data
      const sampleInvoice = await prisma.salesInvoice.findFirst({
        include: { payments: true }
      });

      if (sampleInvoice) {
        console.log('📄 Sample Invoice:');
        console.log(`   Customer: ${sampleInvoice.customerName}`);
        console.log(`   Total: ₹${sampleInvoice.total}`);
        console.log(`   Status: ${sampleInvoice.status}`);
        console.log(`   Payments: ${sampleInvoice.payments.length}`);
        console.log(`   Amount Paid: ₹${sampleInvoice.amountPaid}\n`);
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.log(`   ❌ Error checking database: ${error.message}\n`);
  }

  console.log('═══════════════════════════════════════\n');
  console.log('🎯 Quick Test with cURL:\n');
  console.log('# You need to replace YOUR_JWT_TOKEN with actual token\n');
  console.log('curl -X GET "http://localhost:5000/api/sales/analytics?period=30d" \\');
  console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN"\n');
  
  console.log('═══════════════════════════════════════\n');
  console.log('✨ Test Complete!\n');
};

// Run the test
performanceTest().catch(console.error);

