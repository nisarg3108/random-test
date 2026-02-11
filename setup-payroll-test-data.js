/**
 * Setup Payroll Test Data
 * 
 * This script creates comprehensive test data for payroll attendance integration:
 * - Adds salary structures to employees
 * - Creates attendance records with various scenarios
 * - Sets up realistic test data for February 2026
 */

import prisma from './backend/src/config/db.js';

async function setupTestData() {
  try {
    console.log('\n🔧 Setting up Payroll Test Data');
    console.log('='.repeat(60));

    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found!');
      return;
    }
    const tenantId = tenant.id;

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { 
        tenantId,
        status: 'ACTIVE'
      },
      include: {
        salaryStructure: true
      }
    });

    console.log(`\n📋 Found ${employees.length} active employees\n`);

    // Define test date range (February 2026)
    const startDate = new Date('2026-02-01');
    const endDate = new Date('2026-02-28');

    // Test scenarios for different employees
    const scenarios = [
      {
        name: 'Full Attendance + Overtime',
        basicSalary: 60000,
        allowances: { hra: 24000, transport: 5000, medical: 2000, bonus: 4000 },
        deductions: { pf: 7200, insurance: 1500 },
        attendance: {
          presentDays: 26,
          absentDays: 0,
          leaveDays: 2,
          overtimeHours: 10
        }
      },
      {
        name: 'Partial Attendance',
        basicSalary: 50000,
        allowances: { hra: 20000, transport: 4000, medical: 1500, bonus: 3000 },
        deductions: { pf: 6000, insurance: 1200 },
        attendance: {
          presentDays: 18,
          absentDays: 8,
          leaveDays: 2,
          overtimeHours: 0
        }
      },
      {
        name: 'With Half Days',
        basicSalary: 55000,
        allowances: { hra: 22000, transport: 4500, medical: 2000, bonus: 3500 },
        deductions: { pf: 6600, insurance: 1300 },
        attendance: {
          presentDays: 22,
          absentDays: 2,
          leaveDays: 1,
          halfDays: 3,
          overtimeHours: 5
        }
      },
      {
        name: 'High Overtime',
        basicSalary: 70000,
        allowances: { hra: 28000, transport: 6000, medical: 2500, bonus: 5000 },
        deductions: { pf: 8400, insurance: 1800 },
        attendance: {
          presentDays: 24,
          absentDays: 1,
          leaveDays: 3,
          overtimeHours: 20
        }
      },
      {
        name: 'Perfect Attendance',
        basicSalary: 45000,
        allowances: { hra: 18000, transport: 3500, medical: 1500, bonus: 2500 },
        deductions: { pf: 5400, insurance: 1000 },
        attendance: {
          presentDays: 28,
          absentDays: 0,
          leaveDays: 0,
          overtimeHours: 0
        }
      },
      {
        name: 'No Attendance Records',
        basicSalary: 40000,
        allowances: { hra: 16000, transport: 3000, medical: 1200, bonus: 2000 },
        deductions: { pf: 4800, insurance: 900 },
        attendance: null // Will test backward compatibility
      }
    ];

    let employeeIndex = 0;

    for (const employee of employees) {
      if (employeeIndex >= scenarios.length) break;

      const scenario = scenarios[employeeIndex];
      console.log(`\n📊 Setting up: ${employee.name} - ${scenario.name}`);
      console.log('-'.repeat(60));

      // Create or update salary structure
      // Calculate net salary
      const allowancesTotal = Object.values(scenario.allowances).reduce((a, b) => a + b, 0);
      const deductionsTotal = Object.values(scenario.deductions).reduce((a, b) => a + b, 0);
      const netSalary = scenario.basicSalary + allowancesTotal - deductionsTotal;
      
      let salaryStructure;
      if (employee.salaryStructure) {
        salaryStructure = await prisma.salaryStructure.update({
          where: { id: employee.salaryStructure.id },
          data: {
            basicSalary: scenario.basicSalary,
            allowances: scenario.allowances,
            deductions: scenario.deductions,
            netSalary: netSalary,
            effectiveFrom: new Date('2026-01-01')
          }
        });
        console.log('   ✅ Updated existing salary structure');
      } else {
        salaryStructure = await prisma.salaryStructure.create({
          data: {
            tenantId,
            employeeId: employee.id,
            basicSalary: scenario.basicSalary,
            allowances: scenario.allowances,
            deductions: scenario.deductions,
            netSalary: netSalary,
            effectiveFrom: new Date('2026-01-01')
          }
        });
        console.log('   ✅ Created new salary structure');
      }

      console.log(`   💰 Basic: ₹${scenario.basicSalary.toLocaleString()}`);
      console.log(`   💵 Total Allowances: ₹${Object.values(scenario.allowances).reduce((a, b) => a + b, 0).toLocaleString()}`);
      console.log(`   📉 Total Deductions: ₹${Object.values(scenario.deductions).reduce((a, b) => a + b, 0).toLocaleString()}`);

      // Create attendance records if scenario has attendance data
      if (scenario.attendance) {
        // Delete existing attendance for February 2026
        await prisma.attendance.deleteMany({
          where: {
            employeeId: employee.id,
            tenantId,
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const records = [];
        let currentDate = new Date(startDate);
        let daysProcessed = 0;
        const { presentDays, absentDays, leaveDays, halfDays = 0, overtimeHours } = scenario.attendance;
        
        // Calculate distribution
        const totalDays = presentDays + absentDays + leaveDays + (halfDays * 0.5);
        const overtimePerDay = overtimeHours / (presentDays || 1);

        while (currentDate <= endDate) {
          // Skip Sundays
          if (currentDate.getDay() === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          let status;
          let overtime = 0;

          // Distribute attendance based on scenario
          if (daysProcessed < presentDays) {
            status = daysProcessed % 10 === 0 ? 'WORK_FROM_HOME' : 'PRESENT';
            overtime = overtimePerDay;
          } else if (daysProcessed < presentDays + halfDays) {
            status = 'HALF_DAY';
            overtime = overtimePerDay / 2;
          } else if (daysProcessed < presentDays + halfDays + leaveDays) {
            status = 'LEAVE';
          } else if (daysProcessed < presentDays + halfDays + leaveDays + absentDays) {
            status = 'ABSENT';
          } else {
            status = 'PRESENT';
          }

          const record = {
            tenantId,
            employeeId: employee.id,
            date: new Date(currentDate),
            checkIn: status === 'PRESENT' || status === 'WORK_FROM_HOME' ? new Date(currentDate.setHours(9, 0, 0)) : null,
            checkOut: status === 'PRESENT' || status === 'WORK_FROM_HOME' ? new Date(currentDate.setHours(18, 0, 0)) : null,
            status,
            overtimeHours: overtime,
            notes: `Test data - ${scenario.name}`
          };

          records.push(record);
          daysProcessed++;
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Bulk create attendance records
        await prisma.attendance.createMany({
          data: records
        });

        console.log(`   📅 Created ${records.length} attendance records`);
        console.log(`   ✅ Present: ${presentDays}, Absent: ${absentDays}, Leave: ${leaveDays}${halfDays ? `, Half-days: ${halfDays}` : ''}`);
        console.log(`   ⏰ Total Overtime: ${overtimeHours} hours`);
      } else {
        console.log('   📅 No attendance records (testing backward compatibility)');
      }

      employeeIndex++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test data setup completed successfully!');
    console.log('='.repeat(60));

    // Display summary
    console.log('\n📊 TEST SCENARIOS CREATED:');
    console.log('-'.repeat(60));
    for (let i = 0; i < Math.min(employees.length, scenarios.length); i++) {
      const emp = employees[i];
      const scenario = scenarios[i];
      console.log(`${i + 1}. ${emp.name} (${emp.employeeCode})`);
      console.log(`   Scenario: ${scenario.name}`);
      console.log(`   Basic: ₹${scenario.basicSalary.toLocaleString()}`);
      if (scenario.attendance) {
        console.log(`   Attendance: ${scenario.attendance.presentDays}P / ${scenario.attendance.absentDays}A / ${scenario.attendance.leaveDays}L / ${scenario.attendance.overtimeHours}OT`);
      } else {
        console.log(`   Attendance: None (backward compatibility test)`);
      }
      console.log('');
    }

    console.log('💡 Next Steps:');
    console.log('   1. Run: node test-payroll-attendance.js apitest@test.com Test@1234');
    console.log('   2. Check payslip calculations for each scenario');
    console.log('   3. Verify attendance integration is working correctly\n');

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
