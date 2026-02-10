import cron from 'node-cron';
import * as apService from '../modules/ap/ap.service.js';
import * as emailService from '../config/email.js';
import prisma from '../config/db.js';

/**
 * Send overdue bill notifications
 * Runs daily at 9:00 AM
 */
const sendOverdueBillNotifications = async () => {
  console.log('🔔 Running overdue bill notifications job...');

  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true }
    });

    let totalNotificationsSent = 0;

    for (const tenant of tenants) {
      // Get overdue bills for this tenant
      const overdueBills = await apService.getOverdueBills(tenant.id);

      if (overdueBills.length === 0) {
        console.log(`  ✓ No overdue bills for tenant: ${tenant.name}`);
        continue;
      }

      console.log(`  📧 Found ${overdueBills.length} overdue bills for tenant: ${tenant.name}`);

      // Get AP managers/finance team for this tenant
      const apManagers = await prisma.user.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
          // Add role filter if you have roles setup
          // role: { in: ['AP_MANAGER', 'FINANCE_MANAGER', 'ADMIN'] }
        }
      });

      const recipients = apManagers
        .map(u => u.email)
        .filter(email => email); // Remove null/undefined

      if (recipients.length === 0) {
        console.log(`  ⚠️  No recipients found for tenant: ${tenant.name}`);
        continue;
      }

      // Send notification for each overdue bill
      for (const bill of overdueBills) {
        try {
          await emailService.sendOverdueBillNotification(
            bill,
            bill.vendor,
            recipients
          );
          totalNotificationsSent++;
        } catch (error) {
          console.error(`  ❌ Failed to send notification for bill ${bill.billNumber}:`, error.message);
        }
      }
    }

    console.log(`✅ Overdue bill notifications job completed. Sent ${totalNotificationsSent} notifications.`);
  } catch (error) {
    console.error('❌ Overdue bill notifications job failed:', error);
  }
};

/**
 * Schedule the job
 * Cron expression: "0 9 * * *" = Every day at 9:00 AM
 * Change to "0 0 * * *" for midnight
 */
export const scheduleOverdueBillNotifications = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', sendOverdueBillNotifications, {
    scheduled: true,
    timezone: "America/New_York" // Change to your timezone
  });

  console.log('📅 Scheduled overdue bill notifications (daily at 9:00 AM)');

  // Optional: Run immediately on startup for testing
  // Uncomment the line below to test
  // sendOverdueBillNotifications();
};

/**
 * Manual trigger for testing
 */
export const triggerOverdueBillNotifications = sendOverdueBillNotifications;
