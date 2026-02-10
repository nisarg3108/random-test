// Script to create sample AP data for testing
// Run with: node scripts/create-sample-ap-data.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('🔍 Fetching tenant and vendor data...\n');

    // Get first tenant
    const tenant = await prisma.tenant.findFirst();

    if (!tenant) {
      console.error('❌ No tenant found! Please create a tenant first.');
      process.exit(1);
    }

    console.log(`✅ Using tenant: ${tenant.name} (${tenant.id})`);

    // Get vendors for this tenant
    let vendors = await prisma.vendor.findMany({
      where: { tenantId: tenant.id },
      take: 3
    });

    // Create sample vendors if none exist
    if (vendors.length === 0) {
      console.log('📦 No vendors found. Creating sample vendors...\n');

      const vendorCount = await prisma.vendor.count({
        where: { tenantId: tenant.id }
      });

      const vendor1 = await prisma.vendor.create({
        data: {
          tenantId: tenant.id,
          vendorCode: `VEN-${String(vendorCount + 1).padStart(4, '0')}`,
          name: 'Acme Office Supplies Inc.',
          contactPerson: 'John Smith',
          email: 'john@acmeoffice.com',
          phone: '+1-555-0101',
          address: '123 Business St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          postalCode: '10001',
          paymentTerms: 'NET30',
          creditLimit: 10000,
          status: 'ACTIVE',
          category: 'OFFICE_SUPPLIES'
        }
      });
      console.log(`   ✓ Created vendor: ${vendor1.name}`);

      const vendor2 = await prisma.vendor.create({
        data: {
          tenantId: tenant.id,
          vendorCode: `VEN-${String(vendorCount + 2).padStart(4, '0')}`,
          name: 'TechGear Solutions LLC',
          contactPerson: 'Sarah Johnson',
          email: 'sarah@techgear.com',
          phone: '+1-555-0202',
          address: '456 Innovation Blvd',
          city: 'San Francisco',
          state: 'CA',
          country: 'USA',
          postalCode: '94105',
          paymentTerms: 'NET60',
          creditLimit: 50000,
          status: 'ACTIVE',
          category: 'TECHNOLOGY'
        }
      });
      console.log(`   ✓ Created vendor: ${vendor2.name}`);

      const vendor3 = await prisma.vendor.create({
        data: {
          tenantId: tenant.id,
          vendorCode: `VEN-${String(vendorCount + 3).padStart(4, '0')}`,
          name: 'Modern Furniture Co.',
          contactPerson: 'Mike Davis',
          email: 'mike@modernfurniture.com',
          phone: '+1-555-0303',
          address: '789 Design Ave',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          postalCode: '60601',
          paymentTerms: 'NET45',
          creditLimit: 25000,
          status: 'ACTIVE',
          category: 'FURNITURE'
        }
      });
      console.log(`   ✓ Created vendor: ${vendor3.name}\n`);

      vendors = [vendor1, vendor2, vendor3];
    }

    console.log(`✅ Found ${vendors.length} vendors:`);
    vendors.forEach((v, i) => console.log(`   ${i + 1}. ${v.name} (${v.id})`));

    // Get a user for createdBy field
    const user = await prisma.user.findFirst({
      where: { tenantId: tenant.id }
    });

    if (!user) {
      console.error('❌ No user found for tenant!');
      process.exit(1);
    }

    console.log(`✅ Using user: ${user.name || user.email}\n`);

    console.log('📝 Creating sample bills...\n');

    // Get current bill count for numbering
    const billCount = await prisma.aPBill.count({
      where: { tenantId: tenant.id }
    });

    const startNum = billCount + 1;

    // Create 5 sample bills
    const bills = [];

    // Bill 1: Current bill (not due yet)
    const bill1 = await prisma.aPBill.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendors[0].id,
        billNumber: `BILL-${String(startNum).padStart(6, '0')}`,
        invoiceNumber: 'INV-2024-001',
        billDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-01'),
        subtotal: 500.00,
        taxAmount: 25.00,
        discountAmount: 0.00,
        shippingCost: 0.00,
        totalAmount: 525.00,
        paidAmount: 0.00,
        balanceAmount: 525.00,
        status: 'PENDING',
        approvalStatus: 'PENDING',
        items: [
          {
            description: 'Office Supplies',
            quantity: 10,
            unitPrice: 50,
            amount: 500
          }
        ],
        createdBy: user.id
      }
    });
    bills.push(bill1);
    console.log(`   ✓ Created: ${bill1.billNumber} - $${bill1.totalAmount} (Current)`);

    // Bill 2: Overdue bill
    const bill2 = await prisma.aPBill.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendors[1 % vendors.length].id,
        billNumber: `BILL-${String(startNum + 1).padStart(6, '0')}`,
        invoiceNumber: 'INV-2024-002',
        billDate: new Date('2025-12-01'),
        dueDate: new Date('2026-01-01'), // PAST DATE
        subtotal: 3000.00,
        taxAmount: 150.00,
        discountAmount: 0.00,
        shippingCost: 0.00,
        totalAmount: 3150.00,
        paidAmount: 0.00,
        balanceAmount: 3150.00,
        status: 'OVERDUE',
        approvalStatus: 'PENDING',
        items: [
          {
            description: 'Computers',
            quantity: 2,
            unitPrice: 1500,
            amount: 3000
          }
        ],
        createdBy: user.id
      }
    });
    bills.push(bill2);
    console.log(`   ✓ Created: ${bill2.billNumber} - $${bill2.totalAmount} (Overdue)`);

    // Bill 3: Approved bill
    const bill3 = await prisma.aPBill.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendors[2 % vendors.length].id,
        billNumber: `BILL-${String(startNum + 2).padStart(6, '0')}`,
        invoiceNumber: 'INV-2024-003',
        billDate: new Date('2026-02-01'),
        dueDate: new Date('2026-03-01'),
        subtotal: 1000.00,
        taxAmount: 50.00,
        discountAmount: 0.00,
        shippingCost: 0.00,
        totalAmount: 1050.00,
        paidAmount: 0.00,
        balanceAmount: 1050.00,
        status: 'APPROVED',
        approvalStatus: 'APPROVED',
        items: [
          {
            description: 'Furniture',
            quantity: 5,
            unitPrice: 200,
            amount: 1000
          }
        ],
        createdBy: user.id,
        approvedBy: user.id,
        approvedAt: new Date()
      }
    });
    bills.push(bill3);
    console.log(`   ✓ Created: ${bill3.billNumber} - $${bill3.totalAmount} (Approved)`);

    // Bill 4: Partially paid bill
    const bill4 = await prisma.aPBill.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendors[0].id,
        billNumber: `BILL-${String(startNum + 3).padStart(6, '0')}`,
        invoiceNumber: 'INV-2024-004',
        billDate: new Date('2026-01-15'),
        dueDate: new Date('2026-02-15'),
        subtotal: 2000.00,
        taxAmount: 100.00,
        discountAmount: 0.00,
        shippingCost: 50.00,
        totalAmount: 2150.00,
        paidAmount: 1000.00,
        balanceAmount: 1150.00,
        status: 'PARTIALLY_PAID',
        approvalStatus: 'APPROVED',
        items: [
          {
            description: 'Marketing Services',
            quantity: 1,
            unitPrice: 2000,
            amount: 2000
          }
        ],
        createdBy: user.id
      }
    });
    bills.push(bill4);
    console.log(`   ✓ Created: ${bill4.billNumber} - $${bill4.totalAmount} (Partially Paid)`);

    // Bill 5: 31-60 days overdue
    const bill5 = await prisma.aPBill.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendors[1 % vendors.length].id,
        billNumber: `BILL-${String(startNum + 4).padStart(6, '0')}`,
        invoiceNumber: 'INV-2024-005',
        billDate: new Date('2025-11-15'),
        dueDate: new Date('2025-12-15'), // 55 days overdue
        subtotal: 750.00,
        taxAmount: 37.50,
        discountAmount: 0.00,
        shippingCost: 0.00,
        totalAmount: 787.50,
        paidAmount: 0.00,
        balanceAmount: 787.50,
        status: 'OVERDUE',
        approvalStatus: 'APPROVED',
        items: [
          {
            description: 'Software License',
            quantity: 1,
            unitPrice: 750,
            amount: 750
          }
        ],
        createdBy: user.id
      }
    });
    bills.push(bill5);
    console.log(`   ✓ Created: ${bill5.billNumber} - $${bill5.totalAmount} (31-60 Days Overdue)\n`);

    console.log('💰 Creating sample payments...\n');

    // Get current payment count for numbering
    const paymentCount = await prisma.payment.count({
      where: { tenantId: tenant.id }
    });

    const payStartNum = paymentCount + 1;

    // Payment 1: Partial payment for Bill 4
    const payment1 = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendors[0].id,
        paymentNumber: `PAY-${String(payStartNum).padStart(6, '0')}`,
        paymentDate: new Date('2026-02-05'),
        amount: 1000.00,
        paymentMethod: 'CHECK',
        referenceNumber: 'CHK-12345',
        status: 'CLEARED',
        allocations: [
          {
            billId: bill4.id,
            billNumber: bill4.billNumber,
            allocatedAmount: 1000.00
          }
        ],
        createdBy: user.id
      }
    });
    console.log(`   ✓ Created: ${payment1.paymentNumber} - $${payment1.amount} (CHECK)`);

    // Payment 2: ACH payment (unallocated)
    const payment2 = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        vendorId: vendors[1 % vendors.length].id,
        paymentNumber: `PAY-${String(payStartNum + 1).padStart(6, '0')}`,
        paymentDate: new Date('2026-02-08'),
        amount: 1500.00,
        paymentMethod: 'ACH',
        referenceNumber: 'ACH-67890',
        bankAccount: 'Business Checking ***1234',
        status: 'PENDING',
        allocations: [],
        createdBy: user.id
      }
    });
    console.log(`   ✓ Created: ${payment2.paymentNumber} - $${payment2.amount} (ACH)\n`);

    console.log('📊 Summary:\n');
    console.log(`   Total Bills Created: ${bills.length}`);
    console.log(`   Total Amount: $${bills.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}`);
    console.log(`   Outstanding: $${bills.reduce((sum, b) => sum + b.balanceAmount, 0).toFixed(2)}`);
    console.log(`   Total Payments: 2`);
    console.log(`   Payment Amount: $2,500.00\n`);

    console.log('✅ Sample data created successfully!\n');
    console.log('🔗 View your data at:');
    console.log('   • AP Bills: http://localhost:5173/ap/bills');
    console.log('   • AP Payments: http://localhost:5173/ap/payments');
    console.log('   • AP Aging: http://localhost:5173/ap/aging\n');

    console.log('💡 For pagination testing (50+ records):');
    console.log('   Run this script multiple times, or');
    console.log('   Create bills manually in the UI\n');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
