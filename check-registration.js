import prisma from './backend/src/config/db.js';

async function checkRegistration() {
  const email = 'apitest111@test.com';
  
  console.log('\n=== Checking Registration for:', email, '===\n');

  // 1. Check PendingRegistration
  const pending = await prisma.pendingRegistration.findMany({
    where: { email },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('📋 PendingRegistration records:', pending.length);
  if (pending.length > 0) {
    const latest = pending[0];
    console.log('   Latest:', {
      id: latest.id,
      status: latest.status,
      tenantId: latest.tenantId,
      companyName: latest.companyName,
      provider: latest.provider,
      amount: latest.amount,
      createdAt: latest.createdAt,
      completedAt: latest.completedAt
    });
  }

  // 2. Check User
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  console.log('\n👤 User record:', user ? 'EXISTS' : 'NOT FOUND');
  if (user) {
    console.log('   Details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status
    });
  }

  // 3. Check Tenant
  if (user?.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    });
    
    console.log('\n🏢 Tenant record:', tenant ? 'EXISTS' : 'NOT FOUND');
    if (tenant) {
      console.log('   Details:', {
        id: tenant.id,
        name: tenant.name,
        createdAt: tenant.createdAt
      });
    }

    // 4. Check Subscription
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: user.tenantId },
      include: { 
        plan: true,
        items: true
      }
    });
    
    console.log('\n💳 Subscription record:', subscription ? 'EXISTS' : 'NOT FOUND');
    if (subscription) {
      console.log('   Details:', {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.plan.name,
        provider: subscription.provider,
        providerSubscriptionId: subscription.providerSubscriptionId,
        currentPeriodEnd: subscription.currentPeriodEnd,
        items: subscription.items.length
      });
    }

    // 5. Check BillingEvents
    const events = await prisma.billingEvent.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📨 BillingEvent records:', events.length);
    events.forEach((event, idx) => {
      console.log(`   Event ${idx + 1}:`, {
        eventType: event.eventType,
        provider: event.provider,
        status: event.status,
        processedAt: event.processedAt,
        errorMessage: event.errorMessage
      });
    });

    // 6. Check Payments
    const payments = await prisma.subscriptionPayment.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n💰 SubscriptionPayment records:', payments.length);
    payments.forEach((payment, idx) => {
      console.log(`   Payment ${idx + 1}:`, {
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        succeededAt: payment.succeededAt,
        failedAt: payment.failedAt
      });
    });
  }

  console.log('\n=== Check Complete ===\n');
}

checkRegistration()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
