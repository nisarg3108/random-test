/**
 * Browser Console Test - Email Notifications
 * 
 * Copy and paste this entire script into your browser console while logged in
 * to test the overdue allocation email notification system.
 * 
 * Prerequisites:
 * 1. Be logged into the application (have valid token in localStorage)
 * 2. Configure SMTP settings in backend .env file
 * 3. Backend server running on port 5000
 * 
 * What this test does:
 * - Triggers the overdue check endpoint
 * - Marks allocations as OVERDUE
 * - Sends email notifications
 * - Shows detailed results
 */

(async function testEmailNotifications() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║      Testing Overdue Allocation Email Notifications           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Get authentication token
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ Error: No authentication token found');
    console.log('💡 Please log in first, then run this test again');
    return;
  }

  console.log('✅ Authentication token found');
  console.log('⏳ Triggering overdue check with email notifications...\n');

  try {
    const response = await fetch('http://localhost:5000/api/allocations/mark-overdue', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    const result = await response.json();

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST RESULTS                               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Overdue Allocations Found:', result.count);

    if (result.count > 0) {
      console.log('\n📋 Details of Overdue Allocations:');
      console.table(result.allocations.map(a => ({
        'Asset': a.asset.name,
        'Code': a.asset.assetCode,
        'Employee': a.employee.name,
        'Email': a.employee.email,
        'Expected Return': new Date(a.expectedReturnDate).toLocaleDateString(),
        'Status': a.status
      })));

      console.log('\n📧 Email Notification Results:');
      if (result.emailResults) {
        console.log(`   ✅ Successfully Sent: ${result.emailResults.sent}`);
        console.log(`   ❌ Failed: ${result.emailResults.failed}`);

        if (result.emailResults.failed > 0 && result.emailResults.errors) {
          console.log('\n   Failed Email Details:');
          console.table(result.emailResults.errors);
        }

        if (result.emailResults.sent > 0) {
          console.log('\n✅ Email notifications sent successfully!');
          console.log('📬 Check the employee email inbox(es) for overdue notifications.');
          console.log('\n📧 Email details:');
          console.log('   Subject: ⚠️ Overdue Asset Return Notice - [Asset Name]');
          console.log('   Content: Professional HTML template with asset details');
          console.log('   Features: Red warning header, days overdue, action button');
        }
      } else {
        console.log('   ⚠️  Email results not available in response');
      }

      console.log('\n💡 Tips:');
      console.log('   • Check spam/junk folders if email not in inbox');
      console.log('   • Verify SMTP configuration in backend .env file');
      console.log('   • Check backend server logs for detailed email status');
    } else {
      console.log('\n✅ No overdue allocations found.');
      console.log('\n💡 To test email notifications:');
      console.log('   1. Go to Asset Allocations page');
      console.log('   2. Create a new allocation with a past Expected Return Date');
      console.log('   3. Run this test again');
      console.log('\n   Or use this code to create a test allocation:');
      console.log(`
      // Replace with actual IDs from your system
      fetch('http://localhost:5000/api/allocations', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assetId: 'your-asset-id',
          employeeId: 'your-employee-id',
          allocatedDate: '2024-01-01',
          expectedReturnDate: '2024-01-10', // Past date
          purpose: 'Testing email notifications'
        })
      })
      .then(r => r.json())
      .then(data => console.log('Test allocation created:', data));
      `);
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                 TEST COMPLETED                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST FAILED                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.error('❌ Error:', error.message);
    
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Check that backend server is running on port 5000');
    console.log('   2. Verify SMTP configuration in .env file:');
    console.log('      • SMTP_HOST=smtp.gmail.com');
    console.log('      • SMTP_PORT=587');
    console.log('      • SMTP_USER=your-email@gmail.com');
    console.log('      • SMTP_PASS=your-app-password (not regular password!)');
    console.log('   3. Check your authentication token is valid');
    console.log('   4. Look at browser Network tab for API response details');
    console.log('   5. Check backend server console for error messages');
    console.log('\n   For Gmail setup, see: EMAIL_NOTIFICATION_GUIDE.md');
  }
})();
