import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import emailService from './email.service.js';
const prisma = new PrismaClient();

class EmailQueueService {
  constructor() {
    this.emailService = emailService;
    this.processing = false;
    this.processingInterval = null;
  }

  /**
   * Initialize the email queue processor
   * Starts a cron job to process pending emails every minute
   */
  initialize() {
    // Process queue every 30 seconds
    this.processingInterval = cron.schedule('*/30 * * * * *', async () => {
      if (!this.processing) {
        await this.processQueue();
      }
    });

    console.log('✅ Email queue processor initialized');
  }

  /**
   * Stop the email queue processor
   */
  stop() {
    if (this.processingInterval) {
      this.processingInterval.stop();
      console.log('⚠️ Email queue processor stopped');
    }
  }

  /**
   * Queue an email for sending
   */
  async queueEmail({ tenantId, to, cc, bcc, subject, body, templateId, variables, priority = 5, scheduledAt = new Date(), metadata = {} }) {
    try {
      const queuedEmail = await prisma.emailQueue.create({
        data: {
          tenantId,
          to,
          cc,
          bcc,
          subject,
          body,
          templateId,
          variables,
          priority,
          scheduledAt,
          metadata,
          status: 'PENDING',
          attempts: 0,
          maxAttempts: 3
        }
      });

      console.log(`📧 Email queued: ${queuedEmail.id} to ${to}`);
      return queuedEmail;
    } catch (error) {
      console.error('❌ Error queueing email:', error);
      throw error;
    }
  }

  /**
   * Process all pending emails in the queue
   */
  async processQueue() {
    if (this.processing) {
      return;
    }

    try {
      this.processing = true;

      // Get pending emails that are scheduled to be sent
      const allPendingEmails = await prisma.emailQueue.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: {
            lte: new Date()
          }
        },
        orderBy: [
          { priority: 'asc' },
          { scheduledAt: 'asc' }
        ]
      });

      // Filter emails where attempts < maxAttempts
      const pendingEmails = allPendingEmails.filter(email => email.attempts < email.maxAttempts).slice(0, 10);

      if (pendingEmails.length > 0) {
        console.log(`📬 Processing ${pendingEmails.length} queued emails`);
      }

      // Process each email
      for (const email of pendingEmails) {
        await this.processEmail(email);
      }

      // Also retry failed emails that haven't reached max attempts
      await this.retryFailedEmails();

    } catch (error) {
      console.error('❌ Error processing email queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single queued email
   */
  async processEmail(email) {
    try {
      // Mark as processing
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: 'PROCESSING',
          processingAt: new Date(),
          attempts: { increment: 1 }
        }
      });

      // Attempt to send the email
      let result;
      if (email.templateId) {
        // Send using template
        result = await this.emailService.sendTemplateEmail(
          email.to,
          email.templateId,
          email.variables || {},
          email.tenantId
        );
      } else {
        // Send direct email
        result = await this.emailService.sendEmail({
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          html: email.body,
          tenantId: email.tenantId
        });
      }

      // Mark as sent
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Log successful send
      await prisma.emailLog.create({
        data: {
          tenantId: email.tenantId,
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          body: email.body,
          templateId: email.templateId,
          status: 'SENT',
          sentAt: new Date(),
          metadata: {
            ...email.metadata,
            queueId: email.id,
            attempts: email.attempts + 1
          }
        }
      });

      console.log(`✅ Email sent successfully: ${email.id}`);

    } catch (error) {
      console.error(`❌ Error sending email ${email.id}:`, error.message);

      // Get current error log
      const errorLog = Array.isArray(email.errorLog) ? email.errorLog : [];
      errorLog.push({
        attempt: email.attempts + 1,
        error: error.message,
        timestamp: new Date()
      });

      // Check if we've reached max attempts
      const newAttempts = email.attempts + 1;
      const isFailed = newAttempts >= email.maxAttempts;

      // Update with error
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: isFailed ? 'FAILED' : 'PENDING',
          lastError: error.message,
          errorLog,
          failedAt: isFailed ? new Date() : null,
          // Exponential backoff: schedule retry for 2^attempts minutes later
          scheduledAt: isFailed ? email.scheduledAt : new Date(Date.now() + Math.pow(2, newAttempts) * 60 * 1000)
        }
      });

      // Log failed attempt
      if (isFailed) {
        await prisma.emailLog.create({
          data: {
            tenantId: email.tenantId,
            to: email.to,
            cc: email.cc,
            bcc: email.bcc,
            subject: email.subject,
            body: email.body,
            templateId: email.templateId,
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: error.message,
            metadata: {
              ...email.metadata,
              queueId: email.id,
              attempts: newAttempts,
              errorLog
            }
          }
        });
      }
    }
  }

  /**
   * Retry failed emails that haven't exceeded max attempts
   */
  async retryFailedEmails() {
    try {
      const allFailedEmails = await prisma.emailQueue.findMany({
        where: {
          status: 'FAILED'
        },
        take: 20
      });

      // Filter emails where attempts < maxAttempts
      const failedEmails = allFailedEmails.filter(email => email.attempts < email.maxAttempts).slice(0, 5);

      for (const email of failedEmails) {
        // Reset to pending with exponential backoff
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'PENDING',
            scheduledAt: new Date(Date.now() + Math.pow(2, email.attempts) * 60 * 1000)
          }
        });

        console.log(`🔄 Retrying failed email: ${email.id} (attempt ${email.attempts + 1})`);
      }
    } catch (error) {
      console.error('❌ Error retrying failed emails:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(tenantId = null) {
    try {
      const where = tenantId ? { tenantId } : {};

      const [pending, processing, sent, failed, cancelled, total] = await Promise.all([
        prisma.emailQueue.count({ where: { ...where, status: 'PENDING' } }),
        prisma.emailQueue.count({ where: { ...where, status: 'PROCESSING' } }),
        prisma.emailQueue.count({ where: { ...where, status: 'SENT' } }),
        prisma.emailQueue.count({ where: { ...where, status: 'FAILED' } }),
        prisma.emailQueue.count({ where: { ...where, status: 'CANCELLED' } }),
        prisma.emailQueue.count({ where })
      ]);

      return {
        pending,
        processing,
        sent,
        failed,
        cancelled,
        total,
        successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Get queued emails with filters
   */
  async getQueuedEmails({ tenantId, status, priority, limit = 50, offset = 0 }) {
    try {
      const where = {};
      if (tenantId) where.tenantId = tenantId;
      if (status) where.status = status;
      if (priority) where.priority = priority;

      const [emails, total] = await Promise.all([
        prisma.emailQueue.findMany({
          where,
          orderBy: [
            { priority: 'asc' },
            { scheduledAt: 'asc' }
          ],
          take: limit,
          skip: offset
        }),
        prisma.emailQueue.count({ where })
      ]);

      return {
        emails,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('❌ Error getting queued emails:', error);
      throw error;
    }
  }

  /**
   * Cancel a queued email
   */
  async cancelEmail(emailId) {
    try {
      const email = await prisma.emailQueue.findUnique({
        where: { id: emailId }
      });

      if (!email) {
        throw new Error('Email not found');
      }

      if (email.status === 'SENT') {
        throw new Error('Cannot cancel already sent email');
      }

      await prisma.emailQueue.update({
        where: { id: emailId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });

      console.log(`🚫 Email cancelled: ${emailId}`);
      return true;
    } catch (error) {
      console.error('❌ Error cancelling email:', error);
      throw error;
    }
  }

  /**
   * Retry a specific failed email immediately
   */
  async retryEmail(emailId) {
    try {
      const email = await prisma.emailQueue.findUnique({
        where: { id: emailId }
      });

      if (!email) {
        throw new Error('Email not found');
      }

      if (email.status !== 'FAILED' && email.status !== 'PENDING') {
        throw new Error('Can only retry failed or pending emails');
      }

      await prisma.emailQueue.update({
        where: { id: emailId },
        data: {
          status: 'PENDING',
          scheduledAt: new Date(),
          lastError: null
        }
      });

      console.log(`🔄 Email retry scheduled: ${emailId}`);
      
      // Trigger immediate processing
      if (!this.processing) {
        setTimeout(() => this.processQueue(), 1000);
      }

      return true;
    } catch (error) {
      console.error('❌ Error retrying email:', error);
      throw error;
    }
  }

  /**
   * Clean up old sent/failed emails (older than specified days)
   */
  async cleanup(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.emailQueue.deleteMany({
        where: {
          status: {
            in: ['SENT', 'FAILED', 'CANCELLED']
          },
          updatedAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`🧹 Cleaned up ${result.count} old emails`);
      return result.count;
    } catch (error) {
      console.error('❌ Error cleaning up email queue:', error);
      throw error;
    }
  }

  /**
   * Check SMTP health
   */
  async checkHealth() {
    try {
      const isConfigured = this.emailService.checkConfiguration();
      
      if (!isConfigured) {
        return {
          healthy: false,
          configured: false,
          message: 'Resend not configured',
          details: {
            resendApiKey: process.env.RESEND_API_KEY ? 'set' : 'not set'
          }
        };
      }

      return {
        healthy: true,
        configured: true,
        message: 'Resend email service healthy',
        details: {
          resendApiKey: 'configured',
          from: process.env.RESEND_FROM || 'onboarding@resend.dev'
        }
      };
    } catch (error) {
      return {
        healthy: false,
        configured: false,
        message: 'Health check failed',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const emailQueueService = new EmailQueueService();

export default emailQueueService;
