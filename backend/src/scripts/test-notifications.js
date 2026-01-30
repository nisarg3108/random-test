import prisma from '../config/db.js';
import notificationService from '../modules/notifications/notification.service.js';

async function testNotifications() {
  try {
    console.log('🧪 Testing Notification System...\n');

    // Get first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.error('❌ No tenant found');
      return;
    }
    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

    // Get first employee
    const employee = await prisma.employee.findFirst({
      where: { tenantId: tenant.id },
      include: { user: true }
    });
    
    if (!employee) {
      console.error('❌ No employee found');
      return;
    }
    console.log(`✅ Found employee: ${employee.name} (${employee.id})`);

    // Test 1: Create a test notification
    console.log('\n📝 Test 1: Creating test notification...');
    const notification = await notificationService.createNotification({
      tenantId: tenant.id,
      employeeId: employee.id,
      type: 'SYSTEM',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working'
    });
    console.log(`✅ Notification created: ${notification.id}`);

    // Test 2: Get notifications
    console.log('\n📝 Test 2: Fetching notifications...');
    const notifications = await notificationService.getUserNotifications(
      employee.id,
      tenant.id
    );
    console.log(`✅ Found ${notifications.length} notifications`);
    notifications.slice(0, 3).forEach(n => {
      console.log(`   - ${n.title}: ${n.message} (Read: ${n.isRead})`);
    });

    // Test 3: Get unread count
    console.log('\n📝 Test 3: Getting unread count...');
    const unreadCount = await notificationService.getUnreadCount(
      employee.id,
      tenant.id
    );
    console.log(`✅ Unread notifications: ${unreadCount}`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();
