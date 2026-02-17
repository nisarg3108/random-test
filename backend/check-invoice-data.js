import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkInvoiceData() {
  console.log('====================================');
  console.log('INVOICE DATA CHECK');
  console.log('====================================\n');

  try {
    // Check admin users
    console.log('1. Checking Admin Users:');
    console.log('------------------------');
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true
      }
    });

    if (adminUsers.length === 0) {
      console.log('❌ NO ADMIN USERS FOUND');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email || '❌ NO EMAIL SET'}`);
        console.log(`   - Tenant ID: ${user.tenantId}`);
        console.log('');
      });
    }

    // Check recent payments
    console.log('\n2. Checking Recent Payments:');
    console.log('----------------------------');
    const payments = await prisma.subscriptionPayment.findMany({
      where: {
        status: 'SUCCEEDED'
      },
      include: {
        subscription: {
          include: {
            tenant: {
              include: {
                users: {
                  where: { role: 'ADMIN' }
                }
              }
            },
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (payments.length === 0) {
      console.log('❌ NO SUCCESSFUL PAYMENTS FOUND');
      console.log('   You need to complete a payment to test invoice emails.');
    } else {
      console.log(`✅ Found ${payments.length} successful payment(s):\n`);
      payments.forEach((payment, index) => {
        const adminEmail = payment.subscription?.tenant?.users?.[0]?.email;
        console.log(`Payment ${index + 1}:`);
        console.log(`   - Payment ID: ${payment.id}`);
        console.log(`   - Amount: ${payment.currency} ${payment.amount}`);
        console.log(`   - Date: ${payment.createdAt.toISOString()}`);
        console.log(`   - Tenant ID: ${payment.subscription?.tenantId}`);
        console.log(`   - Admin Email: ${adminEmail || '❌ NO ADMIN EMAIL'}`);
        console.log(`   - Invoice File: ${payment.invoiceUrl || '❌ NOT GENERATED'}`);
        console.log('');
      });
    }

    // Summary
    console.log('\n====================================');
    console.log('SUMMARY');
    console.log('====================================');
    
    const hasAdminWithEmail = adminUsers.some(u => u.email);
    const hasPayments = payments.length > 0;
    const hasPaymentsWithEmail = payments.some(
      p => p.subscription?.tenant?.users?.[0]?.email
    );

    if (hasAdminWithEmail && hasPayments && hasPaymentsWithEmail) {
      console.log('✅ Everything looks good!');
      console.log('\nTo test invoice email:');
      console.log('1. Go to Billing → Invoices & Receipts');
      console.log(`2. Click "Email" button on payment ID: ${payments[0].id}`);
      console.log('3. Check backend logs for detailed output');
      console.log(`4. Check email inbox: ${payments[0].subscription.tenant.users[0].email}`);
    } else {
      console.log('❌ Issues found:');
      if (!hasAdminWithEmail) {
        console.log('   - Admin user needs email address');
        console.log('   - Run: UPDATE "User" SET email=\'testbro378@gmail.com\' WHERE role=\'ADMIN\';');
      }
      if (!hasPayments) {
        console.log('   - No successful payments found');
        console.log('   - Complete a payment through the UI to test invoices');
      }
      if (hasPayments && !hasPaymentsWithEmail) {
        console.log('   - Payments exist but admin has no email');
      }
    }
    console.log('====================================');

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoiceData();
