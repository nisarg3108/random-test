import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function showAdminEmails() {
  console.log('====================================');
  console.log('YOUR ADMIN EMAIL ADDRESSES');
  console.log('====================================\n');

  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      email: true,
      tenantId: true,
      tenant: {
        select: {
          name: true
        }
      }
    },
    orderBy: { email: 'asc' }
  });

  console.log('Invoice emails will be sent to these addresses:\n');
  
  adminUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Company: ${user.tenant?.name || 'N/A'}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log('');
  });

  console.log('====================================');
  console.log('IMPORTANT:');
  console.log('====================================');
  console.log('✅ testbro378@gmail.com = SMTP sender (FROM address)');
  console.log('✅ Emails above = Invoice recipients (TO address)');
  console.log('');
  console.log('If you\'re not receiving invoices:');
  console.log('1. Check SPAM folder in the admin emails above');
  console.log('2. Gmail might be filtering emails from yourself');
  console.log('3. Check the backend logs when you click "Email" button');
  console.log('====================================');

  await prisma.$disconnect();
}

showAdminEmails();
