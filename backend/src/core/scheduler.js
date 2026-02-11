/**
 * Scheduled Jobs for Asset Management
 * Handles periodic tasks like marking overdue allocations and sending notifications
 */

import cron from 'node-cron';
import { markOverdueAllocations } from '../modules/assets/allocation.service.js';
import emailService from '../services/email.service.js';

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduledJobs = () => {
  console.log('⏰ Initializing scheduled jobs...');

  // Check for overdue allocations every day at 12:00 AM (midnight)
  // Cron pattern: second minute hour day month weekday
  // '0 0 * * *' = At 00:00 (midnight) every day
  cron.schedule('0 0 * * *', async () => {
    console.log('🔍 Running scheduled job: Check overdue allocations');
    
    try {
      const result = await markOverdueAllocations();
      
      if (result.count > 0) {
        console.log(`✅ Marked ${result.count} allocation(s) as overdue`);
        console.log('Overdue allocations:', result.allocations);
        
        // Send email notifications to affected employees
        try {
          console.log('📧 Sending overdue notifications...');
          const emailResults = await emailService.sendBatchOverdueNotifications(result.allocations);
          console.log(`📧 Email notifications: ${emailResults.sent} sent, ${emailResults.failed} failed`);
          
          if (emailResults.failed > 0) {
            console.log('⚠️  Some email notifications failed:', emailResults.errors);
          }
        } catch (emailError) {
          console.error('⚠️  Failed to send overdue notifications:', emailError.message);
          // Don't throw - we still want to mark allocations as overdue even if emails fail
        }
      } else {
        console.log('✅ No overdue allocations found');
      }
    } catch (error) {
      console.error('❌ Error checking overdue allocations:', error);
    }
  });

  // Optional: More frequent check during business hours (every 6 hours)
  // Uncomment if you want more frequent checks
  // cron.schedule('0 */6 * * *', async () => {
  //   console.log('🔍 Running periodic overdue check (6 hours)');
  //   try {
  //     const result = await markOverdueAllocations();
  //     if (result.count > 0) {
  //       console.log(`✅ Marked ${result.count} allocation(s) as overdue`);
  //     }
  //   } catch (error) {
  //     console.error('❌ Error checking overdue allocations:', error);
  //   }
  // });

  console.log('✅ Scheduled jobs initialized');
  console.log('   - Overdue allocations: Daily at midnight (00:00)');
};

/**
 * Run overdue check immediately (useful for testing)
 */
export const runOverdueCheckNow = async () => {
  console.log('🔍 Running immediate overdue check...');
  
  try {
    const result = await markOverdueAllocations();
    
    if (result.count > 0) {
      console.log(`✅ Marked ${result.count} allocation(s) as overdue`);
      
      // Send email notifications
      try {
        console.log('📧 Sending overdue notifications...');
        const emailResults = await emailService.sendBatchOverdueNotifications(result.allocations);
        console.log(`📧 Email notifications: ${emailResults.sent} sent, ${emailResults.failed} failed`);
        
        return {
          ...result,
          emailResults
        };
      } catch (emailError) {
        console.error('⚠️  Failed to send overdue notifications:', emailError.message);
        return {
          ...result,
          emailResults: { error: emailError.message }
        };
      }
    } else {
      console.log('✅ No overdue allocations found');
      return result;
    }
  } catch (error) {
    console.error('❌ Error checking overdue allocations:', error);
    throw error;
  }
};
