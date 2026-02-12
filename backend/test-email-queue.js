// Email Queue and Health Check Test
// 
// Prerequisites:
// 1. Server must be running: npm run dev
// 2. Test user must exist: node create-test-user.js
// 3. SMTP must be configured in .env
//
// Run this with: node test-email-queue.js

import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

// Test user credentials
// Run create-test-user.js first if this user doesn't exist
const testUser = {
  email: 'apitest@test.com',
  password: 'Test@1234'
};

async function login() {
  console.log('\n🔐 Logging in...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

function getHeaders() {
  return {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
}

async function testHealthCheck() {
  console.log('\n📧 Testing SMTP Health Check...');
  try {
    const response = await axios.get(
      `${API_BASE}/communication/email/health`,
      getHeaders()
    );
    
    console.log('✅ Health Check Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.healthy) {
      console.log('✅ SMTP is healthy and configured');
    } else {
      console.log('⚠️ SMTP issues detected:', response.data.message);
    }
    
    return response.data.healthy;
  } catch (error) {
    console.error('❌ Health check failed:', error.response?.data || error.message);
    return false;
  }
}

async function queueTestEmail() {
  console.log('\n📨 Queuing test email...');
  try {
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email from Queue',
      body: '<h1>Test Email</h1><p>This is a test email from the email queue system.</p>',
      priority: 5
    };
    
    const response = await axios.post(
      `${API_BASE}/communication/email/queue`,
      emailData,
      getHeaders()
    );
    
    console.log('✅ Email queued successfully:');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   To: ${response.data.to}`);
    console.log(`   Subject: ${response.data.subject}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Priority: ${response.data.priority}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Failed to queue email:', error.response?.data || error.message);
    return null;
  }
}

async function getQueueStats() {
  console.log('\n📊 Getting queue statistics...');
  try {
    const response = await axios.get(
      `${API_BASE}/communication/email/queue/stats`,
      getHeaders()
    );
    
    console.log('✅ Queue Statistics:');
    console.log(`   Pending: ${response.data.pending}`);
    console.log(`   Processing: ${response.data.processing}`);
    console.log(`   Sent: ${response.data.sent}`);
    console.log(`   Failed: ${response.data.failed}`);
    console.log(`   Cancelled: ${response.data.cancelled}`);
    console.log(`   Total: ${response.data.total}`);
    console.log(`   Success Rate: ${response.data.successRate}%`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get stats:', error.response?.data || error.message);
    return null;
  }
}

async function getQueuedEmails(status = null) {
  console.log(`\n📋 Getting queued emails${status ? ` (status: ${status})` : ''}...`);
  try {
    const params = { limit: 10 };
    if (status) params.status = status;
    
    const response = await axios.get(
      `${API_BASE}/communication/email/queue`,
      {
        ...getHeaders(),
        params
      }
    );
    
    console.log(`✅ Found ${response.data.emails.length} emails:`);
    response.data.emails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email.to} - ${email.subject}`);
      console.log(`      Status: ${email.status}, Priority: ${email.priority}, Attempts: ${email.attempts}/${email.maxAttempts}`);
      if (email.lastError) {
        console.log(`      Error: ${email.lastError}`);
      }
    });
    
    return response.data.emails;
  } catch (error) {
    console.error('❌ Failed to get queued emails:', error.response?.data || error.message);
    return [];
  }
}

async function retryEmail(emailId) {
  console.log(`\n🔄 Retrying email ${emailId}...`);
  try {
    const response = await axios.post(
      `${API_BASE}/communication/email/queue/${emailId}/retry`,
      {},
      getHeaders()
    );
    
    console.log('✅', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Failed to retry email:', error.response?.data || error.message);
    return false;
  }
}

async function cancelEmail(emailId) {
  console.log(`\n🚫 Cancelling email ${emailId}...`);
  try {
    const response = await axios.post(
      `${API_BASE}/communication/email/queue/${emailId}/cancel`,
      {},
      getHeaders()
    );
    
    console.log('✅', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Failed to cancel email:', error.response?.data || error.message);
    return false;
  }
}

async function retryAllFailedEmails() {
  console.log('\n🔄 Retrying all failed emails...');
  try {
    const response = await axios.post(
      `${API_BASE}/communication/email/queue/retry-failed`,
      {},
      getHeaders()
    );
    
    console.log('✅', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Failed to retry failed emails:', error.response?.data || error.message);
    return false;
  }
}

async function queueHighPriorityEmail() {
  console.log('\n🚨 Queuing high priority email...');
  try {
    const emailData = {
      to: 'urgent@example.com',
      subject: 'URGENT: High Priority Email',
      body: '<h1>High Priority</h1><p>This email should be sent first.</p>',
      priority: 1, // Highest priority
      metadata: {
        type: 'urgent',
        source: 'test'
      }
    };
    
    const response = await axios.post(
      `${API_BASE}/communication/email/queue`,
      emailData,
      getHeaders()
    );
    
    console.log('✅ High priority email queued:');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Priority: ${response.data.priority}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Failed to queue email:', error.response?.data || error.message);
    return null;
  }
}

async function queueScheduledEmail() {
  console.log('\n⏰ Queuing scheduled email...');
  try {
    // Schedule for 5 minutes from now
    const scheduledDate = new Date();
    scheduledDate.setMinutes(scheduledDate.getMinutes() + 5);
    
    const emailData = {
      to: 'scheduled@example.com',
      subject: 'Scheduled Email',
      body: '<h1>Scheduled Email</h1><p>This email was scheduled to be sent later.</p>',
      priority: 5,
      scheduledAt: scheduledDate.toISOString()
    };
    
    const response = await axios.post(
      `${API_BASE}/communication/email/queue`,
      emailData,
      getHeaders()
    );
    
    console.log('✅ Scheduled email queued:');
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Scheduled for: ${scheduledDate.toLocaleString()}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Failed to queue email:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('  EMAIL QUEUE & HEALTH CHECK TEST SUITE');
  console.log('═══════════════════════════════════════════════');
  
  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without login');
    return;
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 1: Health Check
  await testHealthCheck();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 2: Queue normal email
  const emailId = await queueTestEmail();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 3: Queue high priority email
  await queueHighPriorityEmail();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 4: Queue scheduled email
  await queueScheduledEmail();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 5: Get queue stats
  await getQueueStats();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 6: Get pending emails
  await getQueuedEmails('PENDING');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 7: Get all queued emails
  await getQueuedEmails();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 8: Retry failed emails (if any)
  await retryAllFailedEmails();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Wait for queue to process (30 seconds)
  console.log('\n⏳ Waiting 35 seconds for email queue to process...');
  await new Promise(resolve => setTimeout(resolve, 35000));
  
  // Test 9: Check stats again
  await getQueueStats();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Test 10: Get sent emails
  await getQueuedEmails('SENT');
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('  TEST SUITE COMPLETE');
  console.log('═══════════════════════════════════════════════');
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
