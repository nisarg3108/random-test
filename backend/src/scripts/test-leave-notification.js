import prisma from '../config/db.js';
import { createLeaveRequest } from '../modules/hr/leaveRequest.service.js';

async function testLeaveRequestNotification() {
  try {
    console.log('🧪 Testing Leave Request Notification...\n');

    const tenant = await prisma.tenant.findFirst();
    const employee = await prisma.employee.findFirst({
      where: { tenantId: tenant.id }
    });
    const leaveType = await prisma.leaveType.findFirst({
      where: { tenantId: tenant.id }
    });

    console.log(`✅ Tenant: ${tenant.name}`);
    console.log(`✅ Employee: ${employee.name}`);
    console.log(`✅ Leave Type: ${leaveType.name}\n`);

    // Get notification count before
    const beforeCount = await prisma.notification.count({
      where: { tenantId: tenant.id }
    });
    console.log(`📊 Notifications before: ${beforeCount}`);

    // Create leave request
    console.log('\n📝 Creating leave request...');
    const leaveRequest = await createLeaveRequest({
      employeeId: employee.id,
      leaveTypeId: leaveType.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      reason: 'Test leave request for notification'
    }, tenant.id);
    console.log(`✅ Leave request created: ${leaveRequest.id}`);

    // Get notification count after
    const afterCount = await prisma.notification.count({
      where: { tenantId: tenant.id }
    });
    console.log(`\n📊 Notifications after: ${afterCount}`);
    console.log(`📊 New notifications: ${afterCount - beforeCount}`);

    // Show latest notifications
    const latestNotifications = await prisma.notification.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { employee: true }
    });

    console.log('\n📬 Latest notifications:');
    latestNotifications.forEach(n => {
      console.log(`   - [${n.employee.name}] ${n.title}: ${n.message}`);
    });

    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testLeaveRequestNotification();
