import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('====================================');
  console.log('EMAIL CONFIGURATION TEST');
  console.log('====================================');
  console.log('');
  console.log('SMTP Settings:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  Pass:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
  console.log('  From:', process.env.SMTP_FROM);
  console.log('');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP_USER or SMTP_PASS not configured in .env file');
    process.exit(1);
  }

  console.log('Creating transporter...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  console.log('Verifying connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('  - Wrong password (use App Password for Gmail)');
    console.error('  - 2FA not enabled (required for App Passwords)');
    console.error('  - Wrong host or port');
    console.error('  - Firewall blocking connection');
    process.exit(1);
  }

  console.log('Sending test email...');
  const testEmail = {
    from: `"Test Sender" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER, // Send to yourself
    subject: 'Test Email from ERP System - Invoice Module',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9fafb; margin-top: 20px; border-radius: 8px; }
          .success { color: #10b981; font-weight: bold; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Email Test Successful!</h1>
        </div>
        <div class="content">
          <p class="success">✅ Your email configuration is working!</p>
          <p>This test email confirms that your SMTP settings are configured correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
            <li>From Email: ${process.env.SMTP_USER}</li>
          </ul>
          <p>You can now send invoice emails from your ERP system.</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `,
    text: `Email Test Successful! Your SMTP configuration is working correctly. Sent at: ${new Date().toLocaleString()}`
  };

  try {
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('');
    console.log('Message ID:', info.messageId);
    console.log('Sent to:', process.env.SMTP_USER);
    console.log('');
    console.log('Check your inbox (and spam folder) for the test email.');
    console.log('');
    console.log('====================================');
    console.log('✅ EMAIL SYSTEM IS WORKING!');
    console.log('====================================');
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testEmail();
