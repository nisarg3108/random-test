/**
 * Seed Salary Components
 * Creates common salary components with formulas for testing
 */

import prisma from './backend/src/config/db.js';

async function seedSalaryComponents() {
  try {
    console.log('\n💰 Seeding Salary Components');
    console.log('='.repeat(60));

    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found!');
      return;
    }
    const tenantId = tenant.id;

    // Common salary components
    const components = [
      // ALLOWANCES
      {
        tenantId,
        name: 'House Rent Allowance',
        code: 'HRA',
        type: 'ALLOWANCE',
        calculationType: 'PERCENTAGE_OF_BASIC',
        value: 40,
        isTaxable: true,
        description: '40% of Basic Salary for house rent'
      },
      {
        tenantId,
        name: 'Transport Allowance',
        code: 'TRANSPORT',
        type: 'ALLOWANCE',
        calculationType: 'FIXED',
        value: 5000,
        isTaxable: true,
        description: 'Fixed monthly transport allowance'
      },
      {
        tenantId,
        name: 'Medical Allowance',
        code: 'MEDICAL',
        type: 'ALLOWANCE',
        calculationType: 'FIXED',
        value: 2000,
        isTaxable: false,
        description: 'Fixed monthly medical allowance (tax exempt)'
      },
      {
        tenantId,
        name: 'Special Allowance',
        code: 'SPECIAL',
        type: 'ALLOWANCE',
        calculationType: 'PERCENTAGE_OF_BASIC',
        value: 10,
        isTaxable: true,
        description: '10% of Basic Salary as special allowance'
      },
      {
        tenantId,
        name: 'Dearness Allowance',
        code: 'DA',
        type: 'ALLOWANCE',
        calculationType: 'PERCENTAGE_OF_BASIC',
        value: 15,
        isTaxable: true,
        description: '15% of Basic Salary to offset inflation'
      },
      {
        tenantId,
        name: 'Food Allowance',
        code: 'FOOD',
        type: 'ALLOWANCE',
        calculationType: 'FIXED',
        value: 3000,
        isTaxable: true,
        description: 'Fixed monthly food allowance'
      },

      // DEDUCTIONS
      {
        tenantId,
        name: 'Provident Fund',
        code: 'PF',
        type: 'DEDUCTION',
        calculationType: 'PERCENTAGE_OF_BASIC',
        value: 12,
        isTaxable: false,
        description: '12% of Basic Salary for PF contribution'
      },
      {
        tenantId,
        name: 'Employee State Insurance',
        code: 'ESI',
        type: 'DEDUCTION',
        calculationType: 'PERCENTAGE_OF_GROSS',
        value: 0.75,
        isTaxable: false,
        description: '0.75% of Gross Salary for ESI (if applicable)'
      },
      {
        tenantId,
        name: 'Professional Tax',
        code: 'PTAX',
        type: 'DEDUCTION',
        calculationType: 'FIXED',
        value: 200,
        isTaxable: false,
        description: 'Fixed professional tax (varies by state)'
      },
      {
        tenantId,
        name: 'Insurance Premium',
        code: 'INSURANCE',
        type: 'DEDUCTION',
        calculationType: 'FIXED',
        value: 1500,
        isTaxable: false,
        description: 'Monthly insurance premium deduction'
      },
      {
        tenantId,
        name: 'Loan Deduction',
        code: 'LOAN',
        type: 'DEDUCTION',
        calculationType: 'FIXED',
        value: 0,
        isTaxable: false,
        description: 'Monthly loan repayment (if applicable)',
        isActive: false // Disabled by default, enable per employee
      },

      // BONUSES
      {
        tenantId,
        name: 'Performance Bonus',
        code: 'PERFORMANCE_BONUS',
        type: 'BONUS',
        calculationType: 'PERCENTAGE_OF_BASIC',
        value: 10,
        isTaxable: true,
        description: '10% of Basic Salary as performance incentive',
        isActive: false // Can be enabled for specific cycles
      },
      {
        tenantId,
        name: 'Festival Bonus',
        code: 'FESTIVAL_BONUS',
        type: 'BONUS',
        calculationType: 'FIXED',
        value: 5000,
        isTaxable: true,
        description: 'Fixed festival bonus',
        isActive: false // Enable during festival months
      }
    ];

    console.log(`\n📝 Creating ${components.length} salary components...\n`);

    let created = 0;
    let skipped = 0;

    for (const component of components) {
      try {
        // Check if component already exists
        const existing = await prisma.salaryComponent.findUnique({
          where: {
            tenantId_code: {
              tenantId: component.tenantId,
              code: component.code
            }
          }
        });

        if (existing) {
          console.log(`   ⚠️  ${component.name} (${component.code}) - Already exists`);
          skipped++;
        } else {
          await prisma.salaryComponent.create({ data: component });
          console.log(`   ✅ ${component.name} (${component.code}) - Created`);
          created++;
        }
      } catch (error) {
        console.log(`   ❌ ${component.name} (${component.code}) - Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Salary Components Seeding Complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('='.repeat(60));

    // Display summary
    console.log('\n📊 COMPONENT SUMMARY:');
    console.log('-'.repeat(60));

    const allowances = components.filter(c => c.type === 'ALLOWANCE' && c.isActive !== false);
    const deductions = components.filter(c => c.type === 'DEDUCTION' && c.isActive !== false);
    const bonuses = components.filter(c => c.type === 'BONUS');

    console.log(`\n💵 ALLOWANCES (${allowances.length} active):`);
    allowances.forEach(c => {
      const calc = c.calculationType === 'FIXED' ? `₹${c.value}` : `${c.value}% of Basic`;
      console.log(`   - ${c.name} (${c.code}): ${calc}`);
    });

    console.log(`\n💸 DEDUCTIONS (${deductions.length} active):`);
    deductions.forEach(c => {
      const calc = c.calculationType === 'FIXED' ? `₹${c.value}` : 
                   c.calculationType === 'PERCENTAGE_OF_GROSS' ? `${c.value}% of Gross` : `${c.value}% of Basic`;
      console.log(`   - ${c.name} (${c.code}): ${calc}`);
    });

    console.log(`\n🎁 BONUSES (optional, currently inactive):`);
    bonuses.forEach(c => {
      const calc = c.calculationType === 'FIXED' ? `₹${c.value}` : `${c.value}% of Basic`;
      console.log(`   - ${c.name} (${c.code}): ${calc}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('   1. Components are now managed dynamically');
    console.log('   2. Run payroll test to see formula-based calculations');
    console.log('   3. Use API to activate/deactivate components');
    console.log('   4. Create custom components with FORMULA type\n');

  } catch (error) {
    console.error('❌ Error seeding salary components:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

seedSalaryComponents();
