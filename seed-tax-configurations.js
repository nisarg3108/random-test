/**
 * Seed Tax Configurations
 * Creates standard Indian tax configurations for FY 2025-26
 */

import prisma from './backend/src/config/db.js';

async function seedTaxConfigurations() {
  try {
    console.log('\n💰 Seeding Tax Configurations');
    console.log('='.repeat(70));

    // Get tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found!');
      return;
    }
    const tenantId = tenant.id;

    const taxConfigurations = [
      // INCOME TAX - New Regime (FY 2025-26)
      {
        tenantId,
        name: 'Income Tax - New Regime (FY 2025-26)',
        taxType: 'INCOME_TAX',
        slabs: [
          { min: 0, max: 300000, rate: 0, description: 'Up to ₹3L - No tax' },
          { min: 300001, max: 700000, rate: 5, description: '₹3L to ₹7L - 5%' },
          { min: 700001, max: 1000000, rate: 10, description: '₹7L to ₹10L - 10%' },
          { min: 1000001, max: 1200000, rate: 15, description: '₹10L to ₹12L - 15%' },
          { min: 1200001, max: 1500000, rate: 20, description: '₹12L to ₹15L - 20%' },
          { min: 1500001, max: null, rate: 30, description: 'Above ₹15L - 30%' }
        ],
        deductionRules: {
          standardDeduction: 50000,
          cess: 4, // 4% Health and Education Cess
          surcharge: {
            threshold: 5000000,
            rate: 10
          }
        },
        effectiveFrom: new Date('2025-04-01'),
        effectiveTo: new Date('2026-03-31'),
        isActive: true
      },

      // INCOME TAX - Old Regime (FY 2025-26)
      {
        tenantId,
        name: 'Income Tax - Old Regime (FY 2025-26)',
        taxType: 'INCOME_TAX_OLD',
        slabs: [
          { min: 0, max: 250000, rate: 0, description: 'Up to ₹2.5L - No tax' },
          { min: 250001, max: 500000, rate: 5, description: '₹2.5L to ₹5L - 5%' },
          { min: 500001, max: 1000000, rate: 20, description: '₹5L to ₹10L - 20%' },
          { min: 1000001, max: null, rate: 30, description: 'Above ₹10L - 30%' }
        ],
        deductionRules: {
          section80C: 150000,
          section80D: 25000,
          standardDeduction: 50000,
          hra: 'calculated',
          cess: 4,
          surcharge: {
            threshold: 5000000,
            rate: 10
          }
        },
        effectiveFrom: new Date('2025-04-01'),
        effectiveTo: new Date('2026-03-31'),
        isActive: false // Most employees prefer new regime
      },

      // PROFESSIONAL TAX - Maharashtra (Example)
      {
        tenantId,
        name: 'Professional Tax - Maharashtra',
        taxType: 'PROFESSIONAL_TAX',
        slabs: [
          { min: 0, max: 7500, rate: 0, description: 'Up to ₹7,500/month - No tax' },
          { min: 7501, max: 10000, rate: 175, description: '₹7,501 to ₹10,000/month - ₹175/month' },
          { min: 10001, max: null, rate: 200, description: 'Above ₹10,000/month - ₹200/month (₹2,500/year max)' }
        ],
        deductionRules: {
          maxAnnual: 2500,
          february: 300 // February has ₹300 instead of regular amount
        },
        effectiveFrom: new Date('2025-04-01'),
        effectiveTo: null,
        isActive: true
      },

      // TDS ON SALARY
      {
        tenantId,
        name: 'TDS on Salary (Section 192)',
        taxType: 'TDS',
        slabs: [
          { min: 0, max: 250000, rate: 0, description: 'No TDS up to ₹2.5L' },
          { min: 250001, max: 500000, rate: 5, description: '5% TDS' },
          { min: 500001, max: 1000000, rate: 20, description: '20% TDS' },
          { min: 1000001, max: null, rate: 30, description: '30% TDS' }
        ],
        deductionRules: {
          cess: 4,
          threshold: 250000
        },
        effectiveFrom: new Date('2025-04-01'),
        effectiveTo: null,
        isActive: true
      }
    ];

    console.log(`\n📝 Creating ${taxConfigurations.length} tax configurations...\n`);

    let created = 0;
    let updated = 0;

    for (const config of taxConfigurations) {
      try {
        // Check if configuration exists
        const existing = await prisma.taxConfiguration.findFirst({
          where: {
            tenantId: config.tenantId,
            taxType: config.taxType,
            name: config.name
          }
        });

        if (existing) {
          // Update existing
          await prisma.taxConfiguration.update({
            where: { id: existing.id },
            data: {
              slabs: config.slabs,
              deductionRules: config.deductionRules,
              effectiveFrom: config.effectiveFrom,
              effectiveTo: config.effectiveTo,
              isActive: config.isActive
            }
          });
          console.log(`   ✅ ${config.name} - Updated`);
          updated++;
        } else {
          // Create new
          await prisma.taxConfiguration.create({ data: config });
          console.log(`   ✅ ${config.name} - Created`);
          created++;
        }
      } catch (error) {
        console.log(`   ❌ ${config.name} - Error: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ Tax Configurations Seeding Complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log('='.repeat(70));

    // Display summary
    console.log('\n📊 TAX CONFIGURATION SUMMARY:');
    console.log('-'.repeat(70));

    for (const config of taxConfigurations) {
      console.log(`\n💵 ${config.name} (${config.isActive ? 'ACTIVE' : 'INACTIVE'})`);
      console.log(`   Type: ${config.taxType}`);
      console.log(`   Effective: ${config.effectiveFrom.toLocaleDateString()} to ${config.effectiveTo ? config.effectiveTo.toLocaleDateString() : 'Ongoing'}`);
      console.log(`   Tax Slabs:`);
      
      config.slabs.forEach((slab, index) => {
        const minFormatted = slab.min.toLocaleString('en-IN');
        const maxFormatted = slab.max ? slab.max.toLocaleString('en-IN') : '∞';
        const rateDisplay = config.taxType === 'PROFESSIONAL_TAX' && typeof slab.rate === 'number' && slab.rate > 50
          ? `₹${slab.rate}`
          : `${slab.rate}%`;
        
        console.log(`      ${index + 1}. ₹${minFormatted} - ₹${maxFormatted}: ${rateDisplay}`);
        if (slab.description) {
          console.log(`         ${slab.description}`);
        }
      });
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Tax configurations are now available in the system');
    console.log('   2. Payroll will use "INCOME_TAX" type by default');
    console.log('   3. Use API to manage tax configurations');
    console.log('   4. Create frontend UI for tax management\n');

  } catch (error) {
    console.error('❌ Error seeding tax configurations:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

seedTaxConfigurations();
