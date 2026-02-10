import nodemailer from 'nodemailer';
import cron from 'node-cron';
import exportService from './export.service.js';

class EmailService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.warn('⚠️  Email service not configured. Set SMTP_USER and SMTP_PASS in .env to enable email features.');
      this.transporter = null;
    }
  }

  checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS in your .env file. See .env.example for setup instructions.');
    }
  }

  async sendWelcomeEmail(employeeData, defaultPassword) {
    this.checkConfiguration();
    
    const { email, name, employeeCode } = employeeData;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: email,
      subject: 'Welcome to the Team - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to the Team, ${name}!</h2>
          <p>Your employee account has been created successfully.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Account Details:</h3>
            <p><strong>Employee Code:</strong> ${employeeCode}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${defaultPassword}</p>
          </div>
          
          <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login for security.</p>
          
          <p>You can access the system at: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'http://localhost:5173'}</a></p>
          
          <p>If you have any questions, please contact your manager or HR department.</p>
          
          <p>Best regards,<br>HR Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  async sendPasswordResetOTP(email, otp, name) {
    this.checkConfiguration();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@company.com',
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${name || 'User'},</p>
          
          <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h1 style="color: #2c3e50; font-size: 32px; letter-spacing: 4px; margin: 0;">${otp}</h1>
          </div>
          
          <p><strong>This OTP is valid for 10 minutes only.</strong></p>
          
          <p>If you didn't request this password reset, please ignore this email or contact support.</p>
          
          <p>Best regards,<br>Security Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset OTP:', error);
      throw error;
    }
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send analytics report email
   */
  async sendAnalyticsReport(to, analyticsData, options = {}) {
    this.checkConfiguration();
    
    try {
      const {
        subject = 'Sales Analytics Report',
        format = 'pdf', // pdf, csv, excel
        includeAttachment = true
      } = options;

      let attachment;
      let filename;

      // Generate appropriate format
      if (includeAttachment) {
        if (format === 'pdf') {
          attachment = await exportService.generatePDF(analyticsData);
          filename = `sales-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
        } else if (format === 'csv') {
          attachment = await exportService.generateCSV(analyticsData, 'summary');
          filename = `sales-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        } else if (format === 'excel') {
          attachment = await exportService.generateExcel(analyticsData);
          filename = `sales-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
        }
      }

      // Build email HTML
      const html = this.buildReportEmailHTML(analyticsData);

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        attachments: includeAttachment ? [
          {
            filename,
            content: attachment,
            contentType: this.getContentType(format)
          }
        ] : []
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Analytics report email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Build HTML email content for analytics report
   */
  buildReportEmailHTML(analyticsData) {
    const summary = analyticsData.summary || {};
    const conversion = analyticsData.conversionMetrics || {};

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .metric-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .metric-label { font-size: 14px; color: #6b7280; margin-bottom: 5px; }
          .metric-value { font-size: 28px; font-weight: bold; color: #1f2937; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Sales Analytics Report</h1>
            <p style="margin: 10px 0 0 0;">Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">
            <h2>Summary</h2>
            <div class="metric-card">
              <div class="metric-label">Total Revenue</div>
              <div class="metric-value">₹${Number(summary.totalRevenue || 0).toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Paid Revenue</div>
              <div class="metric-value">₹${Number(summary.paidRevenue || 0).toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Pending Revenue</div>
              <div class="metric-value">₹${Number(summary.pendingRevenue || 0).toFixed(2)}</div>
            </div>
            
            <h2 style="margin-top: 30px;">Conversion Metrics</h2>
            <div class="metric-card">
              <div class="metric-label">Quotation Conversion Rate</div>
              <div class="metric-value">${conversion.quotationConversionRate || 0}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Order Conversion Rate</div>
              <div class="metric-value">${conversion.orderConversionRate || 0}%</div>
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/sales/analytics" class="button">
                View Full Dashboard
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated report from your ERP System.</p>
            <p>© ${new Date().getFullYear()} ERP TECH. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Schedule recurring analytics reports
   */
  async scheduleReport(tenantId, schedule, recipients, options = {}) {
    this.checkConfiguration();
    
    const jobKey = `${tenantId}-${schedule}`;

    // Cancel existing job if any
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
    }

    // Convert schedule to cron format
    const cronExpression = this.getCronExpression(schedule);

    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Running scheduled report for tenant ${tenantId}`);
        
        // Import sales service dynamically to avoid circular dependency
        const { default: salesService } = await import('../modules/sales/sales.service.js');
        
        // Get analytics data
        const analyticsData = await salesService.getSalesAnalytics(tenantId);

        // Send to all recipients
        const promises = recipients.map(email => 
          this.sendAnalyticsReport(email, analyticsData, options)
        );

        await Promise.all(promises);
        console.log(`Scheduled report sent successfully to ${recipients.length} recipients`);
      } catch (error) {
        console.error('Scheduled report error:', error);
      }
    });

    this.scheduledJobs.set(jobKey, job);
    return { success: true, jobKey, schedule: cronExpression };
  }

  /**
   * Cancel scheduled report
   */
  cancelScheduledReport(tenantId, schedule) {
    const jobKey = `${tenantId}-${schedule}`;
    
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
      this.scheduledJobs.delete(jobKey);
      return { success: true, message: 'Scheduled report cancelled' };
    }

    return { success: false, message: 'No scheduled report found' };
  }

  /**
   * Get cron expression from schedule type
   */
  getCronExpression(schedule) {
    const expressions = {
      'daily': '0 9 * * *',        // 9 AM daily
      'weekly': '0 9 * * 1',       // 9 AM every Monday
      'monthly': '0 9 1 * *',      // 9 AM on 1st of month
      'quarterly': '0 9 1 */3 *'   // 9 AM on 1st of every 3rd month
    };

    return expressions[schedule] || expressions.daily;
  }

  /**
   * Get content type for attachment
   */
  getContentType(format) {
    const types = {
      'pdf': 'application/pdf',
      'csv': 'text/csv',
      'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    return types[format] || 'application/octet-stream';
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service ready' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default new EmailService();