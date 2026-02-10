// Quick test for export service
import exportService from './src/services/export.service.js';

const testData = {
  summary: {
    totalRevenue: 218654,
    paidRevenue: 144432,
    pendingRevenue: 74222,
    overdueRevenue: 0,
    totalPayments: 6,
    totalInvoices: 7,
    totalOrders: 7,
    totalQuotations: 40
  },
  conversionMetrics: {
    quotationConversionRate: '20.00',
    orderConversionRate: '100.00',
    acceptedQuotations: 8,
    totalQuotations: 40,
    confirmedOrders: 7,
    totalOrders: 7
  },
  topCustomers: [
    { name: 'ABC Corporation', revenue: 50000 },
    { name: 'XYZ Industries', revenue: 45000 }
  ],
  topProducts: [
    { description: 'Web Development', quantity: 100, revenue: 100000, count: 5 },
    { description: 'Mobile App', quantity: 50, revenue: 80000, count: 3 }
  ],
  revenueTimeSeries: [
    { date: '2026-02-01', revenue: 15000 },
    { date: '2026-02-02', revenue: 18000 }
  ],
  paymentsTimeSeries: [
    { date: '2026-02-01', amount: 12000 },
    { date: '2026-02-02', amount: 15000 }
  ]
};

async function testPDF() {
  console.log('Testing PDF generation...');
  try {
    const pdfBuffer = await exportService.generatePDF(testData);
    console.log('✅ PDF generated successfully');
    console.log(`   Size: ${pdfBuffer.length} bytes`);
  } catch (error) {
    console.error('❌ PDF generation failed:', error.message);
    console.error(error.stack);
  }
}

async function testCSV() {
  console.log('\nTesting CSV generation...');
  try {
    const csv = await exportService.generateCSV(testData, 'summary');
    console.log('✅ CSV generated successfully');
    console.log(`   Length: ${csv.length} characters`);
  } catch (error) {
    console.error('❌ CSV generation failed:', error.message);
  }
}

async function testExcel() {
  console.log('\nTesting Excel generation...');
  try {
    const excelBuffer = await exportService.generateExcel(testData);
    console.log('✅ Excel generated successfully');
    console.log(`   Size: ${excelBuffer.length} bytes`);
  } catch (error) {
    console.error('❌ Excel generation failed:', error.message);
  }
}

async function runTests() {
  await testPDF();
  await testCSV();
  await testExcel();
  console.log('\nAll tests complete!');
}

runTests();
