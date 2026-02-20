import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Create Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM || 'onboarding@resend.dev';

if (process.env.RESEND_API_KEY) {
  console.log(' Resend email service ready');
} else {
  console.log(' Email service not configured: RESEND_API_KEY is missing');
}

/**
 * Send overdue bill notification
 */
export const sendOverdueBillNotification = async (bill, vendor, recipients) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('  Email not configured - skipping notification');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject: `Overdue Bill Alert - ${bill.billNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;"> Overdue Bill Notification</h2>
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
            <p><strong>Vendor:</strong> ${vendor.name}</p>
            <p><strong>Invoice Number:</strong> ${bill.invoiceNumber || 'N/A'}</p>
            <p><strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}</p>
            <p><strong>Days Overdue:</strong> ${Math.floor((new Date() - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24))} days</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Bill Details</h3>
            <p><strong>Total Amount:</strong> $${bill.totalAmount.toFixed(2)}</p>
            <p><strong>Paid Amount:</strong> $${bill.paidAmount.toFixed(2)}</p>
            <p><strong>Balance Due:</strong> <span style="color: #dc2626; font-weight: bold;">$${bill.balanceAmount.toFixed(2)}</span></p>
          </div>
          <p>Please take action to process this payment as soon as possible.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated notification from the ERP System.</p>
        </div>
      `
    });

    if (error) throw new Error(error.message);
    console.log(' Overdue notification sent:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error(' Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send bill approval notification
 */
export const sendBillApprovalNotification = async (bill, vendor, approver, recipients) => {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, message: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject: `Bill Approved - ${bill.billNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;"> Bill Approved</h2>
          <p>${approver.name || 'An approver'} has approved the following bill:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
            <p><strong>Vendor:</strong> ${vendor.name}</p>
            <p><strong>Invoice Number:</strong> ${bill.invoiceNumber || 'N/A'}</p>
            <p><strong>Amount:</strong> $${bill.totalAmount.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${new Date(bill.dueDate).toLocaleDateString()}</p>
          </div>
          <p>The bill is now ready for payment processing.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated notification from the ERP System.</p>
        </div>
      `
    });

    if (error) throw new Error(error.message);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error(' Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send payment confirmation notification
 */
export const sendPaymentConfirmation = async (payment, vendor, bills, recipients) => {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, message: 'Email not configured' };
  }

  const billsList = bills.map(b =>
    `<li>${b.billNumber} - $${b.allocatedAmount?.toFixed(2) || '0.00'}</li>`
  ).join('');

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject: `Payment Processed - ${payment.paymentNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;"> Payment Processed</h2>
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Payment Number:</strong> ${payment.paymentNumber}</p>
            <p><strong>Vendor:</strong> ${vendor.name}</p>
            <p><strong>Payment Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
            <p><strong>Method:</strong> ${payment.paymentMethod}</p>
            ${payment.referenceNumber ? `<p><strong>Reference:</strong> ${payment.referenceNumber}</p>` : ''}
          </div>
          ${bills.length > 0 ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Bills Paid</h3>
              <ul style="margin: 10px 0;">${billsList}</ul>
            </div>
          ` : ''}
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">This is an automated notification from the ERP System.</p>
        </div>
      `
    });

    if (error) throw new Error(error.message);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error(' Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

export default resend;
