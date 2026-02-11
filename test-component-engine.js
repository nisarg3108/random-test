/**
 * Test Salary Component Engine
 * Verifies dynamic formula calculations are working
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'apitest@test.com',
  password: 'Test@1234'
};

let authToken = '';

async function login() {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
  authToken = response.data.token;
  return true;
}

async function testComponentEngine() {
  console.log('\n🧪 Testing Salary Component Engine');
  console.log('='.repeat(70));

  await login();

  // 1. Get salary components
  console.log('\n📋 Step 1: Fetching salary components...');
  const componentsRes = await axios.get(`${API_BASE_URL}/payroll/components`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  const components = componentsRes.data;
  console.log(`✅ Found ${components.length} components`);
  
  const activeAllowances = components.filter(c => c.type === 'ALLOWANCE' && c.isActive);
  const activeDeductions = components.filter(c => c.type === 'DEDUCTION' && c.isActive);
  
  console.log(`   💵 Allowances: ${activeAllowances.length}`);
  activeAllowances.forEach(c => {
    const calc = c.calculationType === 'FIXED' ? `₹${c.value}` : 
                 c.calculationType === 'PERCENTAGE_OF_BASIC' ? `${c.value}% of Basic` :
                 c.calculationType === 'PERCENTAGE_OF_GROSS' ? `${c.value}% of Gross` : 'Formula';
    console.log(`      - ${c.name} (${c.code}): ${calc}`);
  });

  console.log(`   💸 Deductions: ${activeDeductions.length}`);
  activeDeductions.forEach(c => {
    const calc = c.calculationType === 'FIXED' ? `₹${c.value}` : 
                 c.calculationType === 'PERCENTAGE_OF_BASIC' ? `${c.value}% of Basic` :
                 c.calculationType === 'PERCENTAGE_OF_GROSS' ? `${c.value}% of Gross` : 'Formula';
    console.log(`      - ${c.name} (${c.code}): ${calc}`);
  });

  // 2. Create a small test cycle
  console.log('\n💰 Step 2: Creating test payroll cycle...');
  const cycleRes = await axios.post(`${API_BASE_URL}/payroll/cycles`, {
    name: 'Component Engine Test',
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-28T23:59:59.999Z',
    paymentDate: '2026-03-05T00:00:00.000Z'
  }, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  const cycle = cycleRes.data;
  console.log(`✅ Cycle created: ${cycle.id}`);

  // 3. Generate payslips
  console.log('\n🧾 Step 3: Generating payslips with component engine...');
  const payslipsRes = await axios.post(
    `${API_BASE_URL}/payroll/cycles/${cycle.id}/generate-payslips`,
    {},
    { headers: { Authorization: `Bearer ${authToken}` } }
  );

  console.log('✅ Payslips generated');

  // 4. Get detailed payslip
  console.log('\n📄 Step 4: Analyzing component calculations...');
  const cycleDetailRes = await axios.get(`${API_BASE_URL}/payroll/cycles/${cycle.id}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  if (!cycleDetailRes.data.cycle || !cycleDetailRes.data.cycle.payslips || cycleDetailRes.data.cycle.payslips.length === 0) {
    console.log('⚠️  No payslips found in cycle');
    console.log('Response:', JSON.stringify(cycleDetailRes.data, null, 2));
    return;
  }

  const payslip = cycleDetailRes.data.cycle.payslips[0];
  
  console.log('\n' + '='.repeat(70));
  console.log('🔍 DETAILED COMPONENT ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Employee: ${payslip.employee.name}`);
  console.log(`Working Days: ${payslip.workingDays}`);
  console.log(`Present Days: ${payslip.presentDays}`);
  
  const basicMonthly = payslip.basicSalary / payslip.presentDays * 30;
  console.log(`\nBasic Salary (Monthly): ₹${Math.round(basicMonthly).toLocaleString()}`);
  console.log(`Basic Salary (Pro-rated): ₹${Math.round(payslip.basicSalary).toLocaleString()}`);
  
  console.log('\n💵 ALLOWANCES (Calculated by Component Engine):');
  console.log('-'.repeat(70));
  
  let expectedAllowancesTotal = 0;
  const allowances = payslip.allowances || {};
  
  Object.entries(allowances).forEach(([code, value]) => {
    const component = components.find(c => c.code === code);
    if (component) {
      let expectedValue;
      if (component.calculationType === 'FIXED') {
        expectedValue = (component.value / 30) * payslip.presentDays;
      } else if (component.calculationType === 'PERCENTAGE_OF_BASIC') {
        expectedValue = (payslip.basicSalary * component.value / 100);
      }
      
      const match = Math.abs(value - expectedValue) < 1 ? '✅' : '⚠️';
      console.log(`   ${code}: ₹${Math.round(value).toLocaleString()} ${match}`);
      console.log(`      Formula: ${component.calculationType === 'FIXED' ? 
        `(₹${component.value}/30) × ${payslip.presentDays}` :
        `${component.value}% of ₹${Math.round(payslip.basicSalary).toLocaleString()}`}`);
      console.log(`      Expected: ₹${Math.round(expectedValue).toLocaleString()}`);
      
      expectedAllowancesTotal += expectedValue;
    }
  });
  
  console.log(`   ${'─'.repeat(66)}`);
  console.log(`   Total Allowances: ₹${Math.round(Object.values(allowances).reduce((sum, v) => sum + v, 0)).toLocaleString()}`);
  
  console.log('\n💸 DEDUCTIONS (Calculated by Component Engine):');
  console.log('-'.repeat(70));
  
  const deductions = payslip.otherDeductions || {};
  
  Object.entries(deductions).forEach(([code, value]) => {
    const component = components.find(c => c.code === code);
    if (component) {
      let expectedValue;
      if (component.calculationType === 'FIXED') {
        expectedValue = (component.value / 30) * payslip.presentDays;
      } else if (component.calculationType === 'PERCENTAGE_OF_BASIC') {
        expectedValue = (payslip.basicSalary * component.value / 100);
      } else if (component.calculationType === 'PERCENTAGE_OF_GROSS') {
        expectedValue = (payslip.grossSalary * component.value / 100);
      }
      
      const match = Math.abs(value - expectedValue) < 1 ? '✅' : '⚠️';
      console.log(`   ${code}: ₹${Math.round(value).toLocaleString()} ${match}`);
      console.log(`      Formula: ${component.calculationType === 'FIXED' ? 
        `(₹${component.value}/30) × ${payslip.presentDays}` :
        component.calculationType === 'PERCENTAGE_OF_GROSS' ?
        `${component.value}% of ₹${Math.round(payslip.grossSalary).toLocaleString()}` :
        `${component.value}% of ₹${Math.round(payslip.basicSalary).toLocaleString()}`}`);
      console.log(`      Expected: ₹${Math.round(expectedValue).toLocaleString()}`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 CALCULATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Basic: ₹${Math.round(payslip.basicSalary).toLocaleString()}`);
  console.log(`Allowances: ₹${Math.round(Object.values(allowances).reduce((sum, v) => sum + v, 0)).toLocaleString()}`);
  console.log(`Overtime: ₹${Math.round(payslip.overtime).toLocaleString()}`);
  console.log(`${'─'.repeat(66)}`);
  console.log(`Gross: ₹${Math.round(payslip.grossSalary).toLocaleString()}`);
  console.log(`Deductions: ₹${Math.round(payslip.totalDeductions).toLocaleString()}`);
  console.log(`${'─'.repeat(66)}`);
  console.log(`Net Salary: ₹${Math.round(payslip.netSalary).toLocaleString()}`);
  
  console.log('\n✅ Component Engine Test Complete!\n');
}

testComponentEngine().catch(console.error);
