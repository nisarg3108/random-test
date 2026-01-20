import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotifications() {
  try {
    console.log('Seeding sample notifications...');

    const employees = await prisma.employee.findMany({
      take: 5
    });

    if (employees.length === 0) {
      console.log('No employees found. Please create employees first.');
      return;
    }

    const sampleNotifications = [];

    employees.forEach(employee => {
      sampleNotifications.push(
        {
          tenantId: employee.tenantId,
          employeeId: employee.id,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: 'You have been assigned a new task: Complete quarterly report',
          isRead: false
        },
        {
          tenantId: employee.tenantId,
          employeeId: employee.id,
          type: 'SYSTEM',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM',
          isRead: Math.random() > 0.5
        },
        {
          tenantId: employee.tenantId,
          employeeId: employee.id,
          type: 'INVENTORY_ALERT',
          title: 'Low Stock Alert',
          message: 'Office supplies are running low and need to be restocked',
          isRead: false
        }
      );
    });

    await prisma.notification.createMany({
      data: sampleNotifications
    });

    console.log(`Created ${sampleNotifications.length} sample notifications`);
    console.log(`- ${employees.length} employees`);
    console.log('- 3 notifications per employee');

  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications();