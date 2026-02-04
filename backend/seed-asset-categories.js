/**
 * Seed Script for Asset Management Module
 * 
 * This script creates default asset categories for the Asset Management module.
 * Run this after setting up the database to populate initial categories.
 * 
 * Usage: node backend/seed-asset-categories.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: 'Computer Equipment',
    code: 'COMP',
    description: 'Laptops, desktops, servers, and related computer hardware',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 20,
    defaultUsefulLife: 36, // 3 years
  },
  {
    name: 'Office Furniture',
    code: 'FURN',
    description: 'Desks, chairs, cabinets, and other office furniture',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 10,
    defaultUsefulLife: 84, // 7 years
  },
  {
    name: 'Vehicles',
    code: 'VEH',
    description: 'Company vehicles, trucks, and transportation equipment',
    defaultDepreciationMethod: 'DECLINING_BALANCE',
    defaultDepreciationRate: 25,
    defaultUsefulLife: 60, // 5 years
  },
  {
    name: 'Mobile Devices',
    code: 'MOB',
    description: 'Smartphones, tablets, and portable devices',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 33.33,
    defaultUsefulLife: 24, // 2 years
  },
  {
    name: 'Office Equipment',
    code: 'OFFC',
    description: 'Printers, scanners, copiers, and other office equipment',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 20,
    defaultUsefulLife: 60, // 5 years
  },
  {
    name: 'Networking Equipment',
    code: 'NET',
    description: 'Routers, switches, access points, and network infrastructure',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 20,
    defaultUsefulLife: 36, // 3 years
  },
  {
    name: 'Software Licenses',
    code: 'SOFT',
    description: 'Software licenses and digital assets',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 33.33,
    defaultUsefulLife: 36, // 3 years
  },
  {
    name: 'Manufacturing Equipment',
    code: 'MFG',
    description: 'Production machinery and manufacturing equipment',
    defaultDepreciationMethod: 'UNITS_OF_PRODUCTION',
    defaultDepreciationRate: 10,
    defaultUsefulLife: 120, // 10 years
  },
  {
    name: 'Tools & Equipment',
    code: 'TOOL',
    description: 'Hand tools, power tools, and small equipment',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 15,
    defaultUsefulLife: 60, // 5 years
  },
  {
    name: 'Audio/Visual Equipment',
    code: 'AV',
    description: 'Projectors, displays, cameras, and AV equipment',
    defaultDepreciationMethod: 'STRAIGHT_LINE',
    defaultDepreciationRate: 20,
    defaultUsefulLife: 48, // 4 years
  },
];

async function seedAssetCategories() {
  console.log('🌱 Seeding Asset Categories...\n');

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany();

    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }

    console.log(`Found ${tenants.length} tenant(s)\n`);

    for (const tenant of tenants) {
      console.log(`📦 Seeding categories for tenant: ${tenant.name} (${tenant.id})`);

      for (const category of defaultCategories) {
        try {
          // Check if category already exists
          const existing = await prisma.assetCategory.findFirst({
            where: {
              code: category.code,
              tenantId: tenant.id,
            },
          });

          if (existing) {
            console.log(`  ⏭️  Category "${category.name}" (${category.code}) already exists`);
            continue;
          }

          // Create the category
          await prisma.assetCategory.create({
            data: {
              ...category,
              tenantId: tenant.id,
            },
          });

          console.log(`  ✅ Created category: ${category.name} (${category.code})`);
        } catch (error) {
          console.error(`  ❌ Error creating category ${category.name}:`, error.message);
        }
      }

      console.log('');
    }

    console.log('✅ Asset categories seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedAssetCategories()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
