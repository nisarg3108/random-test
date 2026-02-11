/**
 * Test Email Notification System
 * 
 * This script tests the overdue allocation email notification system.
 * It triggers the overdue check and sends email notifications.
 * 
 * Prerequisites:
 * 1. Configure SMTP settings in .env file
 * 2. Ensure backend server is NOT running (this imports the modules directly)
 * 3. Have at least one overdue allocation in the database
 * 
 * Usage:
 *   node test-email-notifications.js
 */

import { runOverdueCheckNow } from './backend/src/core/scheduler.js';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║      Testing Overdue Allocation Email Notifications           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 Test Details:');
console.log('   - Checks for overdue allocations');
console.log('   - Marks them as OVERDUE in database');
console.log('   - Sends email to affected employees');
console.log('   - Reports results\n');

console.log('⏳ Running test...\n');

runOverdueCheckNow()
  .then(result => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST RESULTS                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Overdue Allocations:');
    console.log(`   Count: ${result.count}`);
    
    if (result.count > 0) {
      console.log('\n📋 Allocations Marked as Overdue:');
      result.allocations.forEach((allocation, index) => {
        console.log(`\n   ${index + 1}. ${allocation.asset.name} (${allocation.asset.assetCode})`);
        console.log(`      Employee: ${allocation.employee.name} (${allocation.employee.email})`);
        console.log(`      Expected Return: ${new Date(allocation.expectedReturnDate).toLocaleDateString()}`);
        console.log(`      Status: ${allocation.status}`);
      });
      
      console.log('\n📧 Email Notifications:');
      if (result.emailResults) {
        if (result.emailResults.error) {
          console.log(`   ❌ Error: ${result.emailResults.error}`);
        } else {
          console.log(`   ✅ Sent: ${result.emailResults.sent}`);
          console.log(`   ❌ Failed: ${result.emailResults.failed}`);
          
          if (result.emailResults.failed > 0) {
            console.log('\n   Failed Emails:');
            result.emailResults.errors.forEach(err => {
              console.log(`      • ${err.employeeEmail}: ${err.error}`);
            });
          }
        }
      }
      
      console.log('\n✅ Test completed successfully!');
      console.log('💡 Check the employee email inbox(es) for overdue notifications.\n');
    } else {
      console.log('\n✅ No overdue allocations found.');
      console.log('💡 To test email notifications:');
      console.log('   1. Create an allocation with a past expectedReturnDate');
      console.log('   2. Run this test again\n');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST FAILED                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    console.error('❌ Error:', error.message);
    console.error('\n🔍 Stack trace:', error.stack);
    
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check that .env file has SMTP configuration:');
    console.log('      - SMTP_HOST=smtp.gmail.com');
    console.log('      - SMTP_PORT=587');
    console.log('      - SMTP_USER=your-email@gmail.com');
    console.log('      - SMTP_PASS=your-app-password');
    console.log('   2. Ensure backend server is NOT running');
    console.log('   3. Check database connection');
    console.log('   4. Review EMAIL_NOTIFICATION_GUIDE.md for setup details\n');
    
    process.exit(1);
  });
