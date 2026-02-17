import { PrismaClient } from '@prisma/client';
import * as invoiceService from './src/modules/subscription/invoice.service.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testInvoiceEmail() {
  console.log('====================================');
  console.log('INVOICE EMAIL TEST');
  console.log('====================================\n');

  try {
    // Get the most recent successful payment
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { status: 'SUCCEEDED' },
      include: {
        subscription: {
          include: {
            plan: true,
            tenant: {
              include: {
                users: {
                  where: { role: 'ADMIN' },
                  take: 1
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!payment) {
      console.error('❌ No successful payments found');
      process.exit(1);
    }

    console.log('Payment found:');
    console.log('  - Payment ID:', payment.id);
    console.log('  - Amount:', payment.currency, payment.amount);
    console.log('  - Tenant ID:', payment.subscription.tenantId);
    
    const adminEmail = payment.subscription?.tenant?.users?.[0]?.email;
    console.log('  - Admin Email:', adminEmail || '❌ NOT FOUND');
    console.log('');

    if (!adminEmail) {
      console.error('❌ No admin email found for this payment');
      console.error('   Please update the admin user email in the database');
      process.exit(1);
    }

    // Add email to payment object for sending
    const paymentWithEmail = {
      ...payment,
      subscription: {
        ...payment.subscription,
        tenant: {
          ...payment.subscription.tenant,
          email: adminEmail // This is the KEY fix - using admin email
        }
      }
    };

    console.log('====================================');
    console.log('SENDING TEST INVOICE EMAIL');
    console.log('====================================');
    console.log('FROM:', process.env.SMTP_USER);
    console.log('TO:', adminEmail); // This should be the admin email, not SMTP_USER
    console.log('');

    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await invoiceService.generateInvoicePDF(paymentWithEmail);
    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes\n');

    // Send email
    console.log('Sending email...');
    const result = await invoiceService.sendInvoiceEmail(paymentWithEmail, pdfBuffer);
    console.log('✅ Email sent successfully!\n');

    console.log('====================================');
    console.log('✅ TEST COMPLETE');
    console.log('====================================');
    console.log(`Check inbox: ${adminEmail}`);
    console.log('Message ID:', result.messageId);
    console.log('');
    console.log('If the email is going to the wrong address, check:');
    console.log('1. The console output above shows the correct TO address');
    console.log('2. Check your email provider dashboard/logs');
    console.log('3. Check spam folder');
    console.log('====================================');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceEmail();
