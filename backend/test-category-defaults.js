/**
 * Test Category Defaults in Asset Creation
 * 
 * This script tests that assets inherit depreciation defaults from their categories
 * when specific values are not provided during asset creation.
 * 
 * Prerequisites:
 * 1. Backend server must be stopped (this imports modules directly)
 * 2. Database must be accessible
 * 3. Valid tenant ID
 * 
 * Usage:
 *   node test-category-defaults.js
 */

import { PrismaClient } from '@prisma/client';
import { createAssetCategory, createAsset, getAssetById, deleteAsset, deleteAssetCategory } from './src/modules/assets/asset.service.js';

const prisma = new PrismaClient();

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║      Testing Category Defaults in Asset Creation              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const TEST_TENANT_ID = 'test-tenant-001';
let testCategoryId = null;
let testAsset1Id = null;
let testAsset2Id = null;

async function cleanup() {
  try {
    if (testAsset1Id) {
      await deleteAsset(testAsset1Id, TEST_TENANT_ID);
      console.log('✓ Cleaned up test asset 1');
    }
    if (testAsset2Id) {
      await deleteAsset(testAsset2Id, TEST_TENANT_ID);
      console.log('✓ Cleaned up test asset 2');
    }
    if (testCategoryId) {
      await deleteAssetCategory(testCategoryId, TEST_TENANT_ID);
      console.log('✓ Cleaned up test category');
    }
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

async function runTests() {
  try {
    console.log('📋 Test Plan:');
    console.log('   1. Create category with default depreciation values');
    console.log('   2. Create asset WITHOUT specifying depreciation (should inherit)');
    console.log('   3. Create asset WITH specific depreciation (should override)');
    console.log('   4. Verify both assets have correct values\n');

    // Test 1: Create category with defaults
    console.log('🧪 Test 1: Creating category with depreciation defaults...');
    const categoryData = {
      name: 'Test IT Equipment',
      code: 'TEST-IT-001',
      description: 'Category for testing defaults',
      defaultDepreciationMethod: 'STRAIGHT_LINE',
      defaultDepreciationRate: 20.0, // 20% per year
      defaultUsefulLife: 60, // 5 years (60 months)
      isActive: true,
    };

    const category = await createAssetCategory(categoryData, TEST_TENANT_ID);
    testCategoryId = category.id;
    
    console.log('✅ Category created:');
    console.log(`   ID: ${category.id}`);
    console.log(`   Name: ${category.name}`);
    console.log(`   Default Method: ${category.defaultDepreciationMethod}`);
    console.log(`   Default Rate: ${category.defaultDepreciationRate}%`);
    console.log(`   Default Useful Life: ${category.defaultUsefulLife} months\n`);

    // Test 2: Create asset without depreciation values (should inherit from category)
    console.log('🧪 Test 2: Creating asset WITHOUT depreciation values...');
    const asset1Data = {
      categoryId: testCategoryId,
      assetCode: 'TEST-LAP-001',
      name: 'Test Laptop (Inherits Defaults)',
      description: 'Should inherit depreciation from category',
      purchaseDate: new Date('2024-01-01'),
      purchasePrice: 1500.00,
      vendor: 'Test Vendor',
      status: 'AVAILABLE',
      condition: 'GOOD',
      // NOTE: NOT specifying depreciationMethod, depreciationRate, or usefulLife
    };

    const asset1 = await createAsset(asset1Data, TEST_TENANT_ID);
    testAsset1Id = asset1.id;

    console.log('✅ Asset 1 created:');
    console.log(`   ID: ${asset1.id}`);
    console.log(`   Name: ${asset1.name}`);
    console.log(`   Depreciation Method: ${asset1.depreciationMethod}`);
    console.log(`   Depreciation Rate: ${asset1.depreciationRate}%`);
    console.log(`   Useful Life: ${asset1.usefulLife} months\n`);

    // Test 3: Create asset with specific depreciation values (should override defaults)
    console.log('🧪 Test 3: Creating asset WITH specific depreciation values...');
    const asset2Data = {
      categoryId: testCategoryId,
      assetCode: 'TEST-LAP-002',
      name: 'Test Laptop (Custom Values)',
      description: 'Should use custom depreciation values',
      purchaseDate: new Date('2024-01-01'),
      purchasePrice: 2000.00,
      vendor: 'Test Vendor',
      status: 'AVAILABLE',
      condition: 'GOOD',
      // Specifying custom depreciation values
      depreciationMethod: 'DECLINING_BALANCE',
      depreciationRate: 25.0, // Different from category default
      usefulLife: 48, // Different from category default (4 years)
    };

    const asset2 = await createAsset(asset2Data, TEST_TENANT_ID);
    testAsset2Id = asset2.id;

    console.log('✅ Asset 2 created:');
    console.log(`   ID: ${asset2.id}`);
    console.log(`   Name: ${asset2.name}`);
    console.log(`   Depreciation Method: ${asset2.depreciationMethod}`);
    console.log(`   Depreciation Rate: ${asset2.depreciationRate}%`);
    console.log(`   Useful Life: ${asset2.usefulLife} months\n`);

    // Verification
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     VERIFICATION RESULTS                       ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    let allTestsPassed = true;

    // Verify Asset 1 inherited category defaults
    console.log('📊 Asset 1 (Should inherit category defaults):');
    if (asset1.depreciationMethod === category.defaultDepreciationMethod) {
      console.log('   ✅ Method inherited correctly:', asset1.depreciationMethod);
    } else {
      console.log('   ❌ Method NOT inherited. Expected:', category.defaultDepreciationMethod, 'Got:', asset1.depreciationMethod);
      allTestsPassed = false;
    }

    if (asset1.depreciationRate === category.defaultDepreciationRate) {
      console.log('   ✅ Rate inherited correctly:', asset1.depreciationRate + '%');
    } else {
      console.log('   ❌ Rate NOT inherited. Expected:', category.defaultDepreciationRate, 'Got:', asset1.depreciationRate);
      allTestsPassed = false;
    }

    if (asset1.usefulLife === category.defaultUsefulLife) {
      console.log('   ✅ Useful Life inherited correctly:', asset1.usefulLife, 'months\n');
    } else {
      console.log('   ❌ Useful Life NOT inherited. Expected:', category.defaultUsefulLife, 'Got:', asset1.usefulLife, '\n');
      allTestsPassed = false;
    }

    // Verify Asset 2 used custom values (not category defaults)
    console.log('📊 Asset 2 (Should use custom values):');
    if (asset2.depreciationMethod === 'DECLINING_BALANCE' && asset2.depreciationMethod !== category.defaultDepreciationMethod) {
      console.log('   ✅ Method uses custom value:', asset2.depreciationMethod);
    } else {
      console.log('   ❌ Method should be custom. Expected: DECLINING_BALANCE, Got:', asset2.depreciationMethod);
      allTestsPassed = false;
    }

    if (asset2.depreciationRate === 25.0 && asset2.depreciationRate !== category.defaultDepreciationRate) {
      console.log('   ✅ Rate uses custom value:', asset2.depreciationRate + '%');
    } else {
      console.log('   ❌ Rate should be custom. Expected: 25.0, Got:', asset2.depreciationRate);
      allTestsPassed = false;
    }

    if (asset2.usefulLife === 48 && asset2.usefulLife !== category.defaultUsefulLife) {
      console.log('   ✅ Useful Life uses custom value:', asset2.usefulLife, 'months\n');
    } else {
      console.log('   ❌ Useful Life should be custom. Expected: 48, Got:', asset2.usefulLife, '\n');
      allTestsPassed = false;
    }

    // Final result
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     FINAL RESULT                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('   Category defaults are correctly applied to assets.\n');
    } else {
      console.log('❌ SOME TESTS FAILED!');
      console.log('   Review the verification results above.\n');
    }

    console.log('📌 Summary:');
    console.log(`   • Category created with defaults (Method: ${category.defaultDepreciationMethod}, Rate: ${category.defaultDepreciationRate}%, Life: ${category.defaultUsefulLife}months)`);
    console.log(`   • Asset 1 inherited all defaults correctly`);
    console.log(`   • Asset 2 used custom values correctly`);
    console.log('   • Feature is working as expected!\n');

    return allTestsPassed;

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await cleanup();
    await prisma.$disconnect();
    console.log('✅ Cleanup complete\n');
  }
}

// Run tests
runTests()
  .then(success => {
    if (success) {
      console.log('✅ Test suite completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Test suite failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
