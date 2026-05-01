#!/usr/bin/env node

/**
 * Verification script for comprehensive test data seeding
 * 
 * Usage:
 *   node backend/verify-test-data.js
 * 
 * This script checks that all 15 categories have been properly seeded
 * with the expected data volumes and relationships.
 */

import prisma from './src/config/db.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  ok: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  fail: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}\n${msg}\n${colors.blue}${'='.repeat(50)}${colors.reset}`)
};

async function verifyCategory(name, checkFn) {
  try {
    const result = await checkFn();
    if (result.passed) {
      log.ok(`${name}: ${result.message}`);
      return { category: name, status: 'PASS', details: result.message };
    } else {
      log.fail(`${name}: ${result.message}`);
      return { category: name, status: 'FAIL', details: result.message };
    }
  } catch (error) {
    log.fail(`${name}: Error - ${error.message}`);
    return { category: name, status: 'ERROR', details: error.message };
  }
}

async function runVerification() {
  log.section('Test Data Verification - 15 Categories');

  const results = [];

  // 1. Departments & Employees
  results.push(await verifyCategory(
    '1. Departments & Employees',
    async () => {
      const depts = await prisma.department.findMany();
      const emps = await prisma.employee.findMany();
      const passed = depts.length >= 4 && emps.length >= 20;
      return {
        passed,
        message: `${depts.length} departments, ${emps.length} employees (need ≥4 depts, ≥20 emps)`
      };
    }
  ));

  // 2. Payroll
  results.push(await verifyCategory(
    '2. Payroll Data',
    async () => {
      const cycles = await prisma.payrollCycle.findMany();
      const slips = await prisma.payslip.findMany();
      const passed = cycles.length >= 1 && slips.length >= 4;
      return {
        passed,
        message: `${cycles.length} cycles, ${slips.length} slips (need ≥1 cycle, ≥4 slips)`
      };
    }
  ));

  // 3. Attendance & Time Tracking
  results.push(await verifyCategory(
    '3. Attendance & Time Tracking',
    async () => {
      const attendance = await prisma.attendance.findMany();
      const timeTracking = await prisma.timeTracking.findMany();
      const passed = attendance.length >= 5 && timeTracking.length >= 1;
      return {
        passed,
        message: `${attendance.length} attendance, ${timeTracking.length} time tracking (need ≥5 attendance)`
      };
    }
  ));

  // 4. Leave Requests
  results.push(await verifyCategory(
    '4. Leave Requests',
    async () => {
      const leaveTypes = await prisma.leaveType.findMany();
      const requests = await prisma.leaveRequest.findMany();
      const passed = leaveTypes.length >= 1 && requests.length >= 1;
      return {
        passed,
        message: `${leaveTypes.length} leave types, ${requests.length} requests`
      };
    }
  ));

  // 5. Finance Approvals
  results.push(await verifyCategory(
    '5. Finance Approvals',
    async () => {
      const approvals = await prisma.approval.findMany();
      const passed = approvals.length >= 7;
      return {
        passed,
        message: `${approvals.length} approval records (need ≥7)`
      };
    }
  ));

  // 6. Reports & Analytics
  results.push(await verifyCategory(
    '6. Reports & Analytics',
    async () => {
      const reports = await prisma.attendanceReport.findMany();
      const passed = reports.length >= 1;
      return {
        passed,
        message: `${reports.length} reports generated`
      };
    }
  ));

  // 7. Goods Receipts
  results.push(await verifyCategory(
    '7. Goods Receipts',
    async () => {
      const grs = await prisma.goodsReceipt.findMany();
      const passed = grs.length >= 3;
      return {
        passed,
        message: `${grs.length} goods receipt records (need ≥3)`
      };
    }
  ));

  // 8. Warehouse Dispatch
  results.push(await verifyCategory(
    '8. Warehouse Dispatch',
    async () => {
      const movements = await prisma.stockMovement.findMany({ where: { type: 'OUT' } });
      const passed = movements.length >= 3;
      return {
        passed,
        message: `${movements.length} outbound stock movements (need ≥3)`
      };
    }
  ));

  // 9. Sales Analytics
  results.push(await verifyCategory(
    '9. Sales Analytics',
    async () => {
      const customers = await prisma.customer.findMany();
      const orders = await prisma.salesOrder.findMany();
      const passed = customers.length >= 1 && orders.length >= 1;
      return {
        passed,
        message: `${customers.length} customers, ${orders.length} sales orders`
      };
    }
  ));

  // 10. Vendors
  results.push(await verifyCategory(
    '10. Vendors with Data',
    async () => {
      const vendors = await prisma.vendor.findMany();
      const evals = await prisma.supplierEvaluation.findMany();
      const passed = vendors.length >= 4 && evals.length >= 4;
      return {
        passed,
        message: `${vendors.length} vendors, ${evals.length} evaluations (need ≥4 each)`
      };
    }
  ));

  // 11. Project Management
  results.push(await verifyCategory(
    '11. Project Management',
    async () => {
      const projects = await prisma.project.findMany();
      const milestones = await prisma.projectMilestone.findMany();
      const passed = projects.length >= 2 && milestones.length >= 4;
      return {
        passed,
        message: `${projects.length} projects, ${milestones.length} milestones (need ≥2 proj, ≥4 milestones)`
      };
    }
  ));

  // 12. Project Tasks
  results.push(await verifyCategory(
    '12. Project Tasks',
    async () => {
      const tasks = await prisma.projectTask.findMany();
      const passed = tasks.length >= 4;
      return {
        passed,
        message: `${tasks.length} project tasks (need ≥4)`
      };
    }
  ));

  // 13. Reports Recent
  results.push(await verifyCategory(
    '13. Reports & Recent Reports',
    async () => {
      const reports = await prisma.report.findMany();
      const passed = reports.length >= 1;
      return {
        passed,
        message: `${reports.length} reports in system`
      };
    }
  ));

  // 14. Asset Management
  results.push(await verifyCategory(
    '14. Asset Management Dashboard',
    async () => {
      const assets = await prisma.asset.findMany();
      const passed = assets.length >= 2;
      return {
        passed,
        message: `${assets.length} assets (need ≥2)`
      };
    }
  ));

  // 15. Document Management
  results.push(await verifyCategory(
    '15. Document Management',
    async () => {
      const documents = await prisma.document.findMany();
      const folders = await prisma.document.findMany({ where: { type: 'FOLDER' } });
      const files = await prisma.document.findMany({ where: { type: 'FILE' } });
      const passed = documents.length >= 15 && folders.length >= 5;
      return {
        passed,
        message: `${documents.length} documents (${folders.length} folders, ${files.length} files)`
      };
    }
  ));

  // Summary
  log.section('Summary');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\nResults: ${passed}/${total} categories verified (${percentage}%)\n`);

  if (percentage === 100) {
    log.ok(`All test data verified successfully!`);
    console.log(`\n${colors.green}✨ Ready for testing!${colors.reset}\n`);
  } else if (percentage >= 80) {
    log.warn(`Most categories verified. Check failures above.`);
  } else {
    log.fail(`Several categories need attention. See failures above.`);
  }

  const failedCount = results.filter(r => r.status !== 'PASS').length;
  if (failedCount > 0) {
    console.log(`\nFailed categories: ${failedCount}`);
    results.filter(r => r.status !== 'PASS').forEach(r => {
      console.log(`  • ${r.category}: ${r.details}`);
    });
  }

  console.log();
  process.exit(percentage === 100 ? 0 : 1);
}

runVerification().catch(error => {
  log.fail(`Verification failed: ${error.message}`);
  console.log(error);
  process.exit(1);
});
