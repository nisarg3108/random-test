import PDFDocument from 'pdfkit';
import prisma from '../../config/db.js';
import { Resend } from 'resend';

/**
 * Generate invoice PDF
 */
export const generateInvoicePDF = async (payment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20)
         .fillColor('#1e40af')
         .text('INVOICE', 50, 50);

      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Your Company Name', 50, 80)
         .text('Address Line 1', 50, 95)
         .text('City, State ZIP', 50, 110)
         .text('Email: billing@yourcompany.com', 50, 125)
         .text('Phone: +1 (555) 123-4567', 50, 140);

      // Invoice Details - Right Side
      const invoiceNumber = payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`;
      const invoiceDate = new Date(payment.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fontSize(10)
         .fillColor('#374151')
         .text(`Invoice #: ${invoiceNumber}`, 350, 80, { width: 200, align: 'right' })
         .text(`Date: ${invoiceDate}`, 350, 95, { width: 200, align: 'right' })
         .text(`Status: ${payment.status}`, 350, 110, { width: 200, align: 'right' });

      // Bill To Section
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('BILL TO:', 50, 180);

      const tenant = payment.subscription?.tenant;
      if (tenant) {
        doc.fontSize(10)
           .fillColor('#374151')
           .text(tenant.name || 'Tenant Name', 50, 200)
           .text(tenant.email || '', 50, 215);
      }

      // Line separator
      doc.moveTo(50, 250)
         .lineTo(550, 250)
         .strokeColor('#e5e7eb')
         .stroke();

      // Table Headers
      const tableTop = 270;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('DESCRIPTION', 50, tableTop)
         .text('QTY', 300, tableTop, { width: 50, align: 'center' })
         .text('PRICE', 370, tableTop, { width: 80, align: 'right' })
         .text('AMOUNT', 470, tableTop, { width: 80, align: 'right' });

      // Line under headers
      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .strokeColor('#e5e7eb')
         .stroke();

      // Table Content
      const plan = payment.subscription?.plan;
      const itemY = tableTop + 30;
      
      const description = plan 
        ? `${plan.name} - ${plan.billingCycle} Subscription`
        : 'Subscription Payment';

      doc.fontSize(10)
         .fillColor('#1f2937')
         .text(description, 50, itemY, { width: 230 })
         .text('1', 300, itemY, { width: 50, align: 'center' })
         .text(`${payment.currency} ${payment.amount.toFixed(2)}`, 370, itemY, { width: 80, align: 'right' })
         .text(`${payment.currency} ${payment.amount.toFixed(2)}`, 470, itemY, { width: 80, align: 'right' });

      // Subtotal, Tax, Total section
      const summaryTop = itemY + 60;
      doc.moveTo(350, summaryTop)
         .lineTo(550, summaryTop)
         .strokeColor('#e5e7eb')
         .stroke();

      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Subtotal:', 370, summaryTop + 15, { width: 80, align: 'right' })
         .fillColor('#1f2937')
         .text(`${payment.currency} ${payment.amount.toFixed(2)}`, 470, summaryTop + 15, { width: 80, align: 'right' });

      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Tax (0%):', 370, summaryTop + 35, { width: 80, align: 'right' })
         .fillColor('#1f2937')
         .text(`${payment.currency} 0.00`, 470, summaryTop + 35, { width: 80, align: 'right' });

      // Total line
      doc.moveTo(350, summaryTop + 55)
         .lineTo(550, summaryTop + 55)
         .strokeColor('#1e40af')
         .lineWidth(2)
         .stroke();

      doc.fontSize(12)
         .fillColor('#1e40af')
         .text('TOTAL:', 370, summaryTop + 65, { width: 80, align: 'right' })
         .fontSize(14)
         .text(`${payment.currency} ${payment.amount.toFixed(2)}`, 470, summaryTop + 65, { width: 80, align: 'right' });

      // Payment Information
      const paymentInfoTop = summaryTop + 110;
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Payment Method:', 50, paymentInfoTop)
         .fillColor('#1f2937')
         .text(payment.subscription?.provider || 'Manual', 150, paymentInfoTop);

      doc.fillColor('#6b7280')
         .text('Payment Date:', 50, paymentInfoTop + 20)
         .fillColor('#1f2937')
         .text(invoiceDate, 150, paymentInfoTop + 20);

      doc.fillColor('#6b7280')
         .text('Transaction ID:', 50, paymentInfoTop + 40)
         .fillColor('#1f2937')
         .text(payment.providerPaymentId || payment.id, 150, paymentInfoTop + 40, { width: 300 });

      // Footer
      doc.fontSize(9)
         .fillColor('#9ca3af')
         .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 })
         .text('If you have any questions, please contact our support team.', 50, 715, { align: 'center', width: 500 });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Send invoice email with PDF attachment
 */
export const sendInvoiceEmail = async (payment, pdfBuffer) => {
  console.log('[Invoice Service] Starting email send...');
  console.log('[Invoice Service] Payment ID:', payment.id);
  console.log('[Invoice Service] Tenant email:', payment.subscription?.tenant?.email);
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM_ADDRESS = process.env.RESEND_FROM || 'onboarding@resend.dev';

  const tenant = payment.subscription?.tenant;
  const recipientEmail = tenant?.email;
  
  if (!recipientEmail) {
    const error = new Error('No recipient email address provided');
    console.error('[Invoice Service] Error:', error.message);
    throw error;
  }
  
  console.log('[Invoice Service] Sending to:', recipientEmail);
  // If RESEND_TO_OVERRIDE is set (used when domain not yet verified), send there instead
  const finalRecipient = process.env.RESEND_TO_OVERRIDE || recipientEmail;
  if (process.env.RESEND_TO_OVERRIDE) {
    console.log('[Invoice Service] RESEND_TO_OVERRIDE active, redirecting to:', finalRecipient);
  }
  
  const invoiceNumber = payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date(payment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: FROM_ADDRESS,
    to: [finalRecipient],
    subject: `Invoice ${invoiceNumber} - Payment Confirmation`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .invoice-box {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .invoice-detail {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .invoice-detail:last-child {
            border-bottom: none;
          }
          .label {
            color: #6b7280;
            font-weight: 600;
          }
          .value {
            color: #1f2937;
            font-weight: 600;
          }
          .total {
            background: #eff6ff;
            padding: 15px;
            border-radius: 6px;
            margin-top: 10px;
          }
          .total-amount {
            font-size: 24px;
            color: #1e40af;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">Payment Received</h1>
          <p style="margin: 10px 0 0 0;">Thank you for your payment!</p>
        </div>
        
        <div class="content">
          <p>Dear ${tenant?.name || 'Valued Customer'},</p>
          
          <p>We have successfully received your payment. Your invoice is attached to this email as a PDF.</p>
          
          <div class="invoice-box">
            <h2 style="margin-top: 0; color: #1e40af;">Invoice Details</h2>
            
            <div class="invoice-detail">
              <span class="label">Invoice Number:</span>
              <span class="value">${invoiceNumber}</span>
            </div>
            
            <div class="invoice-detail">
              <span class="label">Date:</span>
              <span class="value">${invoiceDate}</span>
            </div>
            
            <div class="invoice-detail">
              <span class="label">Status:</span>
              <span class="value"><span class="status-badge">${payment.status}</span></span>
            </div>
            
            <div class="invoice-detail">
              <span class="label">Description:</span>
              <span class="value">${payment.subscription?.plan?.name || 'Subscription'} - ${payment.subscription?.plan?.billingCycle || ''}</span>
            </div>
            
            <div class="total">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="label" style="font-size: 16px;">Total Amount:</span>
                <span class="total-amount">${payment.currency} ${payment.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription/billing" class="button">
              View in Dashboard
            </a>
          </p>
          
          <p>If you have any questions about this invoice, please don't hesitate to contact our support team.</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer.toString('base64')
      }
    ]
  };

  try {
    console.log('[Invoice Service] Attempting to send email via Resend...');
    const { data, error: sendError } = await resend.emails.send(mailOptions);
    if (sendError) throw new Error(sendError.message);
    console.log(`[Invoice Service] ✅ Email sent successfully!`);
    console.log(`[Invoice Service] Message ID: ${data.id}`);
    console.log(`[Invoice Service] Recipient: ${recipientEmail}`);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[Invoice Service] ❌ Failed to send invoice email');
    console.error('[Invoice Service] Error:', error.message);
    console.error('[Invoice Service] Full error:', error);
    throw error;
  }
};

/**
 * Get formatted invoice data
 */
export const getInvoiceData = async (paymentId, tenantId) => {
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
    throw new Error('Invoice not found');
  }

  const invoiceNumber = payment.invoiceNumber || `INV-${payment.id.slice(0, 8).toUpperCase()}`;
  
  return {
    id: payment.id,
    invoiceNumber,
    date: payment.createdAt,
    dueDate: payment.createdAt,
    status: payment.status,
    currency: payment.currency,
    amount: payment.amount,
    subtotal: payment.amount,
    tax: 0,
    total: payment.amount,
    tenant: {
      name: payment.subscription?.tenant?.name || 'N/A',
      email: payment.subscription?.tenant?.email || 'N/A'
    },
    items: [
      {
        description: payment.subscription?.plan 
          ? `${payment.subscription.plan.name} - ${payment.subscription.plan.billingCycle} Subscription`
          : 'Subscription Payment',
        quantity: 1,
        unitPrice: payment.amount,
        amount: payment.amount
      }
    ],
    payment: {
      method: payment.subscription?.provider || 'Manual',
      transactionId: payment.providerPaymentId || payment.id,
      date: payment.createdAt
    }
  };
};
