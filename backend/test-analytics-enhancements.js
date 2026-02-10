// Test script for new analytics enhancements
// Run with: node backend/test-analytics-enhancements.js

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testExportEndpoints() {
  console.log('\n📊 Testing Export Endpoints...\n');
  
  // Test PDF export
  try {
    console.log('1. Testing PDF export...');
    const pdfRes = await fetch(`${API_URL}/api/sales/analytics/export/pdf`, { headers });
    if (pdfRes.ok) {
      console.log('   ✅ PDF export endpoint working');
      console.log(`   File size: ${(await pdfRes.buffer()).length} bytes`);
    } else {
      console.log(`   ❌ PDF export failed: ${pdfRes.status}`);
    }
  } catch (error) {
    console.log(`   ❌ PDF export error: ${error.message}`);
  }

  // Test CSV export
  try {
    console.log('2. Testing CSV export...');
    const csvRes = await fetch(`${API_URL}/api/sales/analytics/export/csv?type=summary`, { headers });
    if (csvRes.ok) {
      const csvData = await csvRes.text();
      console.log('   ✅ CSV export endpoint working');
      console.log(`   Rows: ${csvData.split('\n').length}`);
    } else {
      console.log(`   ❌ CSV export failed: ${csvRes.status}`);
    }
  } catch (error) {
    console.log(`   ❌ CSV export error: ${error.message}`);
  }

  // Test Excel export
  try {
    console.log('3. Testing Excel export...');
    const excelRes = await fetch(`${API_URL}/api/sales/analytics/export/excel`, { headers });
    if (excelRes.ok) {
      console.log('   ✅ Excel export endpoint working');
      console.log(`   File size: ${(await excelRes.buffer()).length} bytes`);
    } else {
      console.log(`   ❌ Excel export failed: ${excelRes.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Excel export error: ${error.message}`);
  }
}

async function testForecastEndpoint() {
  console.log('\n🔮 Testing Forecast Endpoint...\n');
  
  try {
    console.log('Testing revenue forecast...');
    const res = await fetch(`${API_URL}/api/sales/analytics/forecast?method=linear&periodsAhead=30`, { headers });
    
    if (res.ok) {
      const data = await res.json();
      console.log('   ✅ Forecast endpoint working');
      console.log(`   Historical points: ${data.historical?.length || 0}`);
      console.log(`   Forecast points: ${data.forecast?.length || 0}`);
      console.log(`   Trend: ${data.trend}`);
      console.log(`   Accuracy: ${data.accuracy?.interpretation}`);
      if (data.seasonality?.detected) {
        console.log(`   Seasonality: ${data.seasonality.strength} ${data.seasonality.pattern}`);
      }
    } else {
      const error = await res.text();
      console.log(`   ❌ Forecast failed: ${res.status}`);
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Forecast error: ${error.message}`);
  }
}

async function testEmailEndpoint() {
  console.log('\n📧 Testing Email Endpoint...\n');
  
  try {
    console.log('Testing email report (dry run - no actual email)...');
    // Don't send real emails in test
    console.log('   ⚠️  Skipping actual email send in test mode');
    console.log('   To test email:');
    console.log('   POST /api/sales/analytics/email');
    console.log('   Body: { recipients: ["email@example.com"], format: "pdf" }');
  } catch (error) {
    console.log(`   ❌ Email test error: ${error.message}`);
  }
}

async function checkDependencies() {
  console.log('\n📦 Checking Dependencies...\n');
  
  const backendDeps = ['pdfkit', 'json2csv', 'node-cron', 'exceljs', 'nodemailer'];
  
  for (const dep of backendDeps) {
    try {
      await import(dep);
      console.log(`   ✅ ${dep} installed`);
    } catch (error) {
      console.log(`   ❌ ${dep} missing - run: npm install ${dep}`);
    }
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('   Sales Analytics Enhancements - Test Suite   ');
  console.log('═══════════════════════════════════════════════');

  await checkDependencies();
  
  if (TEST_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('\n⚠️  WARNING: Replace TEST_TOKEN with your actual JWT token');
    console.log('   To get a token:');
    console.log('   1. Login to the app');
    console.log('   2. Open DevTools → Application → LocalStorage');
    console.log('   3. Copy the token value');
    console.log('   4. Update TEST_TOKEN in this file\n');
    return;
  }

  await testExportEndpoints();
  await testForecastEndpoint();
  await testEmailEndpoint();

  console.log('\n═══════════════════════════════════════════════');
  console.log('   Test Suite Complete   ');
  console.log('═══════════════════════════════════════════════\n');
}

runTests();
