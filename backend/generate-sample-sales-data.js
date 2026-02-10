/**
 * Generate Sample Sales Data for Testing Analytics Dashboard
 * Creates realistic sales data including quotations, orders, invoices, and payments
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateSampleData = async () => {
  console.log('🌱 Generating Sample Sales Data for Analytics Dashboard\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get the first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenant found! Please create a tenant first.');
      return;
    }
    
    const tenantId = tenant.id;
    console.log(`✅ Using tenant: ${tenant.name} (${tenantId})\n`);

    // Sample customers
    const customers = [
      { name: 'ABC Corporation', email: 'contact@abc.com' },
      { name: 'XYZ Industries', email: 'info@xyz.com' },
      { name: 'Tech Solutions Ltd', email: 'hello@techsolutions.com' },
      { name: 'Global Enterprises', email: 'sales@global.com' },
      { name: 'Innovation Hub', email: 'contact@innovation.com' }
    ];

    // Sample products/services
    const products = [
      { description: 'Web Development Services', unitPrice: 5000, tax: 18 },
      { description: 'Mobile App Development', unitPrice: 8000, tax: 18 },
      { description: 'UI/UX Design', unitPrice: 3000, tax: 18 },
      { description: 'Cloud Hosting (Annual)', unitPrice: 1200, tax: 18 },
      { description: 'Technical Support', unitPrice: 800, tax: 18 },
      { description: 'SEO Optimization', unitPrice: 2500, tax: 18 },
      { description: 'Content Writing', unitPrice: 1500, tax: 18 }
    ];

    const paymentMethods = ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'UPI'];
    const statuses = {
      quotation: ['ACCEPTED', 'SENT', 'DRAFT'],
      order: ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'PROCESSING'],
      invoice: ['PAID', 'PARTIALLY_PAID', 'SENT', 'DRAFT']
    };

    // Generate data for the last 60 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 60);

    console.log('📝 Creating Quotations...\n');
    const quotations = [];
    for (let i = 0; i < 20; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const createdAt = new Date(startDate.getTime() + Math.random() * (today - startDate));
      
      // Generate 1-3 line items
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;
      let totalTax = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0;
        
        const lineSubtotal = quantity * product.unitPrice;
        const lineTax = lineSubtotal * (product.tax / 100);
        const lineDiscount = lineSubtotal * (discount / 100);
        
        subtotal += lineSubtotal;
        totalTax += lineTax;
        
        items.push({
          description: product.description,
          quantity,
          unitPrice: product.unitPrice,
          taxPercent: product.tax,
          discountPercent: discount
        });
      }
      
      const total = subtotal + totalTax;
      const status = statuses.quotation[Math.floor(Math.random() * statuses.quotation.length)];
      
      const quotation = await prisma.salesQuotation.create({
        data: {
          tenantId,
          customerName: customer.name,
          customerEmail: customer.email,
          title: `${customer.name} - ${items[0].description}${items.length > 1 ? ' + more' : ''}`,
          description: `Quotation for ${customer.name} including ${itemCount} item(s)`,
          items,
          subtotal,
          tax: totalTax,
          discount: 0,
          total,
          status,
          validUntil: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
          createdAt,
          updatedAt: createdAt
        }
      });
      
      quotations.push(quotation);
      console.log(`   ✓ Quotation ${i + 1}: ${customer.name} - ₹${total.toFixed(2)} (${status})`);
    }

    console.log(`\n✅ Created ${quotations.length} quotations\n`);

    // Create orders from accepted quotations
    console.log('📦 Creating Orders...\n');
    const acceptedQuotations = quotations.filter(q => q.status === 'ACCEPTED');
    const orders = [];
    
    for (let i = 0; i < acceptedQuotations.length; i++) {
      const quot = acceptedQuotations[i];
      const status = statuses.order[Math.floor(Math.random() * statuses.order.length)];
      const createdAt = new Date(quot.createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
      
      const order = await prisma.salesOrder.create({
        data: {
          tenantId,
          orderNumber: `O-${Date.now()}-${i}`,
          customerName: quot.customerName,
          customerEmail: quot.customerEmail,
          items: quot.items,
          subtotal: quot.subtotal,
          tax: quot.tax,
          discount: quot.discount,
          total: quot.total,
          status,
          notes: `Order from quotation for ${quot.customerName}`,
          createdAt,
          updatedAt: createdAt
        }
      });
      
      orders.push(order);
      console.log(`   ✓ Order ${i + 1}: ${quot.customerName} - ₹${order.total.toFixed(2)} (${status})`);
    }

    console.log(`\n✅ Created ${orders.length} orders\n`);

    // Create invoices from confirmed/delivered orders
    console.log('💰 Creating Invoices...\n');
    const eligibleOrders = orders.filter(o => ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(o.status));
    const invoices = [];
    
    for (let i = 0; i < eligibleOrders.length; i++) {
      const order = eligibleOrders[i];
      const status = statuses.invoice[Math.floor(Math.random() * statuses.invoice.length)];
      const createdAt = new Date(order.createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
      const issueDate = createdAt;
      const dueDate = new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const invoice = await prisma.salesInvoice.create({
        data: {
          tenantId,
          invoiceNumber: `INV-${Date.now()}-${i}`,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          discount: order.discount,
          total: order.total,
          amountPaid: 0,
          status: 'DRAFT',
          issueDate,
          dueDate,
          createdAt,
          updatedAt: createdAt
        }
      });
      
      invoices.push(invoice);
      console.log(`   ✓ Invoice ${i + 1}: ${order.customerName} - ₹${invoice.total.toFixed(2)}`);
    }

    console.log(`\n✅ Created ${invoices.length} invoices\n`);

    // Create payments for invoices
    console.log('💳 Creating Payments...\n');
    let totalPayments = 0;
    
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      
      // 70% chance of having at least one payment
      if (Math.random() > 0.3) {
        const numPayments = Math.random() > 0.5 ? 1 : 2; // 1 or 2 payments
        let remainingAmount = parseFloat(invoice.total);
        let totalPaid = 0;
        
        for (let j = 0; j < numPayments && remainingAmount > 0; j++) {
          const isLastPayment = j === numPayments - 1 || numPayments === 1;
          const paymentAmount = isLastPayment 
            ? remainingAmount 
            : parseFloat((remainingAmount * (Math.random() * 0.5 + 0.3)).toFixed(2));
          
          const paymentDate = new Date(
            invoice.issueDate.getTime() + Math.random() * 20 * 24 * 60 * 60 * 1000
          );
          
          const payment = await prisma.invoicePayment.create({
            data: {
              tenantId,
              invoiceId: invoice.id,
              amount: paymentAmount,
              paymentDate,
              paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
              referenceNumber: `TXN-${Date.now()}-${j}`,
              notes: `Payment ${j + 1} for invoice ${invoice.invoiceNumber}`
            }
          });
          
          remainingAmount -= paymentAmount;
          totalPaid += paymentAmount;
          totalPayments++;
          
          console.log(`   ✓ Payment ${totalPayments}: ₹${paymentAmount.toFixed(2)} for ${invoice.customerName}`);
        }
        
        // Update invoice status and amountPaid
        let newStatus = 'DRAFT';
        if (totalPaid >= parseFloat(invoice.total)) {
          newStatus = 'PAID';
        } else if (totalPaid > 0) {
          newStatus = 'PARTIALLY_PAID';
        }
        
        await prisma.salesInvoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: totalPaid,
            status: newStatus
          }
        });
      }
    }

    console.log(`\n✅ Created ${totalPayments} payments\n`);

    // Print summary
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📊 Summary of Generated Data:\n');
    
    const [quotationCount, orderCount, invoiceCount, paymentCount] = await Promise.all([
      prisma.salesQuotation.count({ where: { tenantId } }),
      prisma.salesOrder.count({ where: { tenantId } }),
      prisma.salesInvoice.count({ where: { tenantId } }),
      prisma.invoicePayment.count({ where: { tenantId } })
    ]);

    const invoiceStats = await prisma.salesInvoice.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true
    });

    console.log(`   📑 Total Quotations: ${quotationCount}`);
    console.log(`   📦 Total Orders: ${orderCount}`);
    console.log(`   💰 Total Invoices: ${invoiceCount}`);
    console.log(`   💳 Total Payments: ${paymentCount}\n`);

    console.log('   Invoice Status Breakdown:');
    invoiceStats.forEach(stat => {
      console.log(`      ${stat.status}: ${stat._count}`);
    });

    const totalRevenue = await prisma.salesInvoice.aggregate({
      where: { tenantId },
      _sum: { total: true, amountPaid: true }
    });

    console.log(`\n   💵 Total Revenue: ₹${totalRevenue._sum.total?.toFixed(2) || 0}`);
    console.log(`   💰 Total Collected: ₹${totalRevenue._sum.amountPaid?.toFixed(2) || 0}`);
    console.log(`   📊 Collection Rate: ${((totalRevenue._sum.amountPaid / totalRevenue._sum.total) * 100).toFixed(2)}%\n`);

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ Sample data generation complete!\n');
    console.log('🎯 Next Steps:\n');
    console.log('   1. Open http://localhost:5175 in your browser');
    console.log('   2. Log in with your credentials');
    console.log('   3. Navigate to Sales → Analytics');
    console.log('   4. Explore the dashboard with real data!\n');

  } catch (error) {
    console.error('❌ Error generating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run the generator
generateSampleData();
