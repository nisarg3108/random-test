import prisma from '../config/db.js';

const createInvoice = async (paymentId) => {
  console.log('[Invoice] Creating invoice for payment:', paymentId);
  return { success: true };
};

const sendInvoiceEmail = async (paymentId) => {
  console.log('[Invoice] Sending invoice email for payment:', paymentId);
  return { success: true };
};

export default {
  createInvoice,
  sendInvoiceEmail
};
