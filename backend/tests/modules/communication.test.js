/**
 * Communication Module Test Suite
 */

module.exports = {
  async run(apiCall, logTest) {
    console.log('\n\n💬 COMMUNICATION MODULE TESTS');
    console.log('═══════════════════════════════════════');

    let announcementId, messageId;

    // Test 1: Create Announcement
    try {
      const announcementData = {
        title: `Test Announcement ${Date.now()}`,
        content: 'This is a test announcement',
        priority: 'NORMAL',
        publishDate: new Date().toISOString()
      };
      const response = await apiCall('POST', '/communication/announcements', announcementData);
      announcementId = response.data?.id || response.id;
      logTest('Create Announcement', 'pass', `- ID: ${announcementId}`);
    } catch (error) {
      logTest('Create Announcement', 'fail', `- ${error.message}`);
    }

    // Test 2: Get All Announcements
    try {
      const response = await apiCall('GET', '/communication/announcements');
      const announcements = response.data || response;
      logTest('Get All Announcements', 'pass', `- Found ${announcements.length} announcements`);
    } catch (error) {
      logTest('Get All Announcements', 'fail', `- ${error.message}`);
    }

    // Test 3: Send Message
    try {
      const messageData = {
        recipientId: 1,
        subject: 'Test Message',
        content: 'This is a test message',
        priority: 'NORMAL'
      };
      const response = await apiCall('POST', '/communication/messages', messageData);
      messageId = response.data?.id || response.id;
      logTest('Send Message', 'pass', `- Message ID: ${messageId}`);
    } catch (error) {
      logTest('Send Message', 'fail', `- ${error.message}`);
    }

    // Test 4: Get Inbox
    try {
      const response = await apiCall('GET', '/communication/messages/inbox');
      const messages = response.data || response;
      logTest('Get Inbox', 'pass', `- Found ${messages.length} messages`);
    } catch (error) {
      logTest('Get Inbox', 'fail', `- ${error.message}`);
    }

    // Test 5: Mark Message as Read
    if (messageId) {
      try {
        await apiCall('PATCH', `/communication/messages/${messageId}/read`);
        logTest('Mark Message as Read', 'pass', '- Message marked as read');
      } catch (error) {
        logTest('Mark Message as Read', 'fail', `- ${error.message}`);
      }
    } else {
      logTest('Mark Message as Read', 'skip', '- No message ID');
    }

    // Test 6: Get Unread Count
    try {
      const response = await apiCall('GET', '/communication/messages/unread-count');
      const count = response.data?.count || response.count || 0;
      logTest('Get Unread Count', 'pass', `- Unread: ${count}`);
    } catch (error) {
      logTest('Get Unread Count', 'fail', `- ${error.message}`);
    }
  }
};
