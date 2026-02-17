import prisma from '../../config/db.js';
import * as invoiceService from './invoice.service.js';

/**
 * Get all invoices for tenant
 */
export const getInvoices = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const payments = await prisma.subscriptionPayment.findMany({
      where: { tenantId, status: 'SUCCEEDED' },
      include: { 
        subscription: { 
          include: { 
            plan: true,
            tenant: true
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format invoices with invoice numbers
    const invoices = payments.map(payment => ({
      ...payment,
      invoiceNumber: payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`,
      invoiceDate: payment.createdAt
    }));

    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get single invoice by payment ID
 */
export const getInvoiceByPaymentId = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { paymentId } = req.params;
    
    const invoiceData = await invoiceService.getInvoiceData(paymentId, tenantId);
    
    res.json({ success: true, data: invoiceData });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    if (error.message === 'Invoice not found') {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Download invoice as PDF
 */
export const downloadInvoice = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { paymentId } = req.params;
    
    // Fetch payment with all related data
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { id: paymentId, tenantId },
      include: { 
        subscription: { 
          include: { 
            plan: true, 
            tenant: true 
          } 
        } 
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Generate PDF
    const pdfBuffer = await invoiceService.generateInvoicePDF(payment);
    
    const invoiceNumber = payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`;
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Resend invoice email with PDF attachment
 */
export const resendInvoiceEmail = async (req, res) => {
  try {
    const { tenantId, email: userEmail } = req.user;
    const { paymentId } = req.params;

    console.log('[Invoice Controller] Resend invoice request received');
    console.log('[Invoice Controller] Payment ID:', paymentId);
    console.log('[Invoice Controller] User email:', userEmail);
    console.log('[Invoice Controller] Tenant ID:', tenantId);

    // Check SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[Invoice Controller] SMTP not configured');
      return res.status(503).json({ 
        success: false, 
        error: 'Email service not configured. Please contact administrator.' 
      });
    }

    // Fetch payment with all related data
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { id: paymentId, tenantId },
      include: { 
        subscription: { 
          include: { 
            plan: true, 
            tenant: {
              include: {
                users: {
                  where: { role: 'ADMIN' },
                  take: 1
                }
              }
            }
          } 
        } 
      }
    });

    if (!payment) {
      console.error('[Invoice Controller] Payment not found');
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    console.log('[Invoice Controller] Payment found:', payment.id);
    console.log('[Invoice Controller] Admin users:', payment.subscription?.tenant?.users?.length || 0);

    // Get recipient email - priority: current user, admin user, or tenant name as fallback
    let recipientEmail = userEmail;
    if (!recipientEmail && payment.subscription?.tenant?.users?.length > 0) {
      recipientEmail = payment.subscription.tenant.users[0].email;
      console.log('[Invoice Controller] Using admin email:', recipientEmail);
    } else {
      console.log('[Invoice Controller] Using current user email:', recipientEmail);
    }

    if (!recipientEmail) {
      console.error('[Invoice Controller] No email address available');
      return res.status(400).json({ 
        success: false, 
        error: 'No email address available. Please update your account email in settings.' 
      });
    }

    // Add recipient email to payment data for invoice generation
    const paymentWithEmail = {
      ...payment,
      subscription: {
        ...payment.subscription,
        tenant: {
          ...payment.subscription.tenant,
          email: recipientEmail
        }
      }
    };

    console.log('[Invoice Controller] Generating PDF...');
    // Generate PDF
    const pdfBuffer = await invoiceService.generateInvoicePDF(paymentWithEmail);
    
    console.log('[Invoice Controller] PDF generated, size:', pdfBuffer.length, 'bytes');
    console.log('[Invoice Controller] Sending email...');
    
    // Send email with PDF attachment
    const result = await invoiceService.sendInvoiceEmail(paymentWithEmail, pdfBuffer);

    console.log('[Invoice Controller] ✅ Email sent successfully');
    res.json({ 
      success: true, 
      message: `Invoice email sent successfully to ${recipientEmail}`,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('[Invoice Controller] ❌ Error sending invoice email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send invoice email: ' + error.message 
    });
  }
};

/**
 * Preview invoice (returns formatted invoice data)
 */
export const previewInvoice = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { paymentId } = req.params;
    
    const invoiceData = await invoiceService.getInvoiceData(paymentId, tenantId);
    
    res.json({ success: true, data: invoiceData });
  } catch (error) {
    console.error('Error previewing invoice:', error);
    if (error.message === 'Invoice not found') {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};
