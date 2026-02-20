import prisma from '../../config/db.js';
import integrationEventManager from '../integration/events/integrationEventManager.js';

const QUOTATION_STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE'];
const TRACKING_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'];

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeOptional = (value) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : null);

const parseMoney = (value, field) => {
  if (value === undefined || value === null || value === '') return 0;
  const numberValue = Number(value);
  if (Number.isNaN(numberValue) || numberValue < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
  return numberValue;
};

const parseDate = (value, field) => {
  if (!value) return null;
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return dateValue;
};

const computeSubtotalFromItems = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 0);
    const price = Number(item?.price ?? 0);
    if (Number.isNaN(qty) || Number.isNaN(price)) {
      return sum;
    }
    return sum + qty * price;
  }, 0);
};

const buildTotals = (data) => {
  const items = Array.isArray(data.items) ? data.items : null;
  const subtotal = data.subtotal !== undefined
    ? parseMoney(data.subtotal, 'Subtotal')
    : computeSubtotalFromItems(items);
  const tax = parseMoney(data.tax, 'Tax');
  const discount = parseMoney(data.discount, 'Discount');
  const total = data.total !== undefined
    ? parseMoney(data.total, 'Total')
    : Math.max(0, subtotal + tax - discount);
  return { items, subtotal, tax, discount, total };
};

const ensureStatus = (value, allowed, label) => {
  if (!value) return null;
  if (!allowed.includes(value)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}`);
  }
  return value;
};

const ensureCustomer = async (customerId, tenantId) => {
  if (!customerId) return null;
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId }
  });
  if (!customer) throw new Error('Customer not found');
  return customerId;
};

const ensureDeal = async (dealId, tenantId) => {
  if (!dealId) return null;
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, tenantId }
  });
  if (!deal) throw new Error('Deal not found');
  return dealId;
};

// Quotations
export const listQuotations = (tenantId) => {
  return prisma.salesQuotation.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
};

export const createQuotation = async (data, tenantId) => {
  const title = normalizeString(data.title);
  const customerName = normalizeString(data.customerName);

  if (!title) throw new Error('Quotation title is required');
  if (!customerName) throw new Error('Customer name is required');

  const { items, subtotal, tax, discount, total } = buildTotals(data);

  const status = ensureStatus(data.status || 'DRAFT', QUOTATION_STATUSES, 'Quotation status');
  const validUntil = parseDate(data.validUntil, 'Valid until');
  const customerId = await ensureCustomer(normalizeOptional(data.customerId), tenantId);
  const dealId = await ensureDeal(normalizeOptional(data.dealId), tenantId);

  return prisma.salesQuotation.create({
    data: {
      tenantId,
      customerId,
      dealId,
      title,
      customerName,
      customerEmail: normalizeOptional(data.customerEmail),
      description: normalizeOptional(data.description),
      items,
      subtotal,
      tax,
      discount,
      total,
      status,
      validUntil
    }
  });
};

export const updateQuotation = async (id, data, tenantId) => {
  const updates = {};

  if (data.title !== undefined) {
    const title = normalizeString(data.title);
    if (!title) throw new Error('Quotation title is required');
    updates.title = title;
  }

  if (data.customerName !== undefined) {
    const customerName = normalizeString(data.customerName);
    if (!customerName) throw new Error('Customer name is required');
    updates.customerName = customerName;
  }

  if (data.customerEmail !== undefined) updates.customerEmail = normalizeOptional(data.customerEmail);
  if (data.description !== undefined) updates.description = normalizeOptional(data.description);
  if (data.items !== undefined) updates.items = Array.isArray(data.items) ? data.items : null;
  if (data.customerId !== undefined) {
    updates.customerId = await ensureCustomer(normalizeOptional(data.customerId), tenantId);
  }
  if (data.dealId !== undefined) {
    updates.dealId = await ensureDeal(normalizeOptional(data.dealId), tenantId);
  }

  if (data.subtotal !== undefined) updates.subtotal = parseMoney(data.subtotal, 'Subtotal');
  if (data.tax !== undefined) updates.tax = parseMoney(data.tax, 'Tax');
  if (data.discount !== undefined) updates.discount = parseMoney(data.discount, 'Discount');
  if (data.total !== undefined) updates.total = parseMoney(data.total, 'Total');

  if (data.status !== undefined) {
    updates.status = ensureStatus(data.status, QUOTATION_STATUSES, 'Quotation status');
  }

  if (data.validUntil !== undefined) updates.validUntil = parseDate(data.validUntil, 'Valid until');

  return prisma.salesQuotation.update({
    where: { id, tenantId },
    data: updates
  });
};

export const deleteQuotation = (id, tenantId) => {
  return prisma.salesQuotation.delete({
    where: { id, tenantId }
  });
};

// Orders
export const listSalesOrders = (tenantId) => {
  return prisma.salesOrder.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { tracking: true }
  });
};

export const createSalesOrder = async (data, tenantId) => {
  const customerName = normalizeString(data.customerName);
  if (!customerName) throw new Error('Customer name is required');

  const { items, subtotal, tax, discount, total } = buildTotals(data);
  const status = ensureStatus(data.status || 'PENDING', ORDER_STATUSES, 'Order status');

  const customerId = await ensureCustomer(normalizeOptional(data.customerId), tenantId);
  const dealId = await ensureDeal(normalizeOptional(data.dealId), tenantId);

  return prisma.salesOrder.create({
    data: {
      tenantId,
      customerId,
      dealId,
      orderNumber: normalizeOptional(data.orderNumber),
      quotationId: normalizeOptional(data.quotationId),
      customerName,
      customerEmail: normalizeOptional(data.customerEmail),
      orderDate: parseDate(data.orderDate, 'Order date') || undefined,
      expectedDelivery: parseDate(data.expectedDelivery, 'Expected delivery'),
      items,
      subtotal,
      tax,
      discount,
      total,
      status,
      notes: normalizeOptional(data.notes)
    }
  });
};

export const updateSalesOrder = async (id, data, tenantId) => {
  const updates = {};
  let previousStatus;

  if (data.customerName !== undefined) {
    const customerName = normalizeString(data.customerName);
    if (!customerName) throw new Error('Customer name is required');
    updates.customerName = customerName;
  }

  if (data.orderNumber !== undefined) updates.orderNumber = normalizeOptional(data.orderNumber);
  if (data.customerEmail !== undefined) updates.customerEmail = normalizeOptional(data.customerEmail);
  if (data.quotationId !== undefined) updates.quotationId = normalizeOptional(data.quotationId);
  if (data.customerId !== undefined) {
    updates.customerId = await ensureCustomer(normalizeOptional(data.customerId), tenantId);
  }
  if (data.dealId !== undefined) {
    updates.dealId = await ensureDeal(normalizeOptional(data.dealId), tenantId);
  }
  if (data.orderDate !== undefined) updates.orderDate = parseDate(data.orderDate, 'Order date');
  if (data.expectedDelivery !== undefined) updates.expectedDelivery = parseDate(data.expectedDelivery, 'Expected delivery');
  if (data.items !== undefined) updates.items = Array.isArray(data.items) ? data.items : null;
  if (data.notes !== undefined) updates.notes = normalizeOptional(data.notes);

  if (data.subtotal !== undefined) updates.subtotal = parseMoney(data.subtotal, 'Subtotal');
  if (data.tax !== undefined) updates.tax = parseMoney(data.tax, 'Tax');
  if (data.discount !== undefined) updates.discount = parseMoney(data.discount, 'Discount');
  if (data.total !== undefined) updates.total = parseMoney(data.total, 'Total');

  if (data.status !== undefined) {
    const existingOrder = await prisma.salesOrder.findFirst({
      where: { id, tenantId },
      select: { status: true }
    });

    if (!existingOrder) {
      throw new Error('Sales order not found');
    }

    previousStatus = existingOrder.status;
    updates.status = ensureStatus(data.status, ORDER_STATUSES, 'Order status');
  }

  const updatedOrder = await prisma.salesOrder.update({
    where: { id, tenantId },
    data: updates
  });

  if (previousStatus && updatedOrder.status !== previousStatus) {
    if (updatedOrder.status === 'CONFIRMED') {
      integrationEventManager.emitSalesOrderConfirmed(updatedOrder.id, tenantId);
    }
    if (updatedOrder.status === 'DELIVERED') {
      integrationEventManager.emitSalesOrderCompleted(updatedOrder.id, tenantId);
    }
  }

  return updatedOrder;
};

export const deleteSalesOrder = (id, tenantId) => {
  return prisma.salesOrder.delete({
    where: { id, tenantId }
  });
};

// Invoices
export const listInvoices = (tenantId) => {
  return prisma.salesInvoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { payments: true }
  });
};

export const createInvoice = async (data, tenantId) => {
  const customerName = normalizeString(data.customerName);
  if (!customerName) throw new Error('Customer name is required');

  const { items, subtotal, tax, discount, total } = buildTotals(data);
  const amountPaid = parseMoney(data.amountPaid, 'Amount paid');
  const status = ensureStatus(data.status || 'DRAFT', INVOICE_STATUSES, 'Invoice status');

  const customerId = await ensureCustomer(normalizeOptional(data.customerId), tenantId);
  const dealId = await ensureDeal(normalizeOptional(data.dealId), tenantId);

  return prisma.salesInvoice.create({
    data: {
      tenantId,
      customerId,
      dealId,
      invoiceNumber: normalizeOptional(data.invoiceNumber),
      orderId: normalizeOptional(data.orderId),
      customerName,
      customerEmail: normalizeOptional(data.customerEmail),
      issueDate: parseDate(data.issueDate, 'Issue date') || undefined,
      dueDate: parseDate(data.dueDate, 'Due date'),
      items,
      subtotal,
      tax,
      discount,
      total,
      amountPaid,
      status
    }
  });
};

export const updateInvoice = async (id, data, tenantId) => {
  const updates = {};

  if (data.customerName !== undefined) {
    const customerName = normalizeString(data.customerName);
    if (!customerName) throw new Error('Customer name is required');
    updates.customerName = customerName;
  }

  if (data.invoiceNumber !== undefined) updates.invoiceNumber = normalizeOptional(data.invoiceNumber);
  if (data.orderId !== undefined) updates.orderId = normalizeOptional(data.orderId);
  if (data.customerEmail !== undefined) updates.customerEmail = normalizeOptional(data.customerEmail);
  if (data.customerId !== undefined) {
    updates.customerId = await ensureCustomer(normalizeOptional(data.customerId), tenantId);
  }
  if (data.dealId !== undefined) {
    updates.dealId = await ensureDeal(normalizeOptional(data.dealId), tenantId);
  }
  if (data.issueDate !== undefined) updates.issueDate = parseDate(data.issueDate, 'Issue date');
  if (data.dueDate !== undefined) updates.dueDate = parseDate(data.dueDate, 'Due date');
  if (data.items !== undefined) updates.items = Array.isArray(data.items) ? data.items : null;

  if (data.subtotal !== undefined) updates.subtotal = parseMoney(data.subtotal, 'Subtotal');
  if (data.tax !== undefined) updates.tax = parseMoney(data.tax, 'Tax');
  if (data.discount !== undefined) updates.discount = parseMoney(data.discount, 'Discount');
  if (data.total !== undefined) updates.total = parseMoney(data.total, 'Total');

  if (data.amountPaid !== undefined) updates.amountPaid = parseMoney(data.amountPaid, 'Amount paid');
  if (data.status !== undefined) updates.status = ensureStatus(data.status, INVOICE_STATUSES, 'Invoice status');

  return prisma.salesInvoice.update({
    where: { id, tenantId },
    data: updates
  });
};

export const deleteInvoice = (id, tenantId) => {
  return prisma.salesInvoice.delete({
    where: { id, tenantId }
  });
};

// Order Tracking
export const listTrackings = (tenantId) => {
  return prisma.salesOrderTracking.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { order: true }
  });
};

export const createTracking = async (data, tenantId) => {
  const salesOrderId = normalizeString(data.salesOrderId);
  if (!salesOrderId) throw new Error('Sales order ID is required');

  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, tenantId }
  });

  if (!order) throw new Error('Sales order not found');

  const status = ensureStatus(data.status || 'PENDING', TRACKING_STATUSES, 'Tracking status');

  return prisma.salesOrderTracking.create({
    data: {
      tenantId,
      salesOrderId,
      status,
      carrier: normalizeOptional(data.carrier),
      trackingNumber: normalizeOptional(data.trackingNumber),
      location: normalizeOptional(data.location),
      notes: normalizeOptional(data.notes)
    }
  });
};

export const updateTracking = async (id, data, tenantId) => {
  const updates = {};

  if (data.status !== undefined) updates.status = ensureStatus(data.status, TRACKING_STATUSES, 'Tracking status');
  if (data.carrier !== undefined) updates.carrier = normalizeOptional(data.carrier);
  if (data.trackingNumber !== undefined) updates.trackingNumber = normalizeOptional(data.trackingNumber);
  if (data.location !== undefined) updates.location = normalizeOptional(data.location);
  if (data.notes !== undefined) updates.notes = normalizeOptional(data.notes);

  return prisma.salesOrderTracking.update({
    where: { id, tenantId },
    data: updates
  });
};

export const deleteTracking = (id, tenantId) => {
  return prisma.salesOrderTracking.delete({
    where: { id, tenantId }
  });
};

// Conversion Functions
export const convertQuotationToOrder = async (quotationId, tenantId) => {
  // Fetch the quotation
  const quotation = await prisma.salesQuotation.findFirst({
    where: { id: quotationId, tenantId }
  });

  if (!quotation) throw new Error('Quotation not found');
  
  if (quotation.status !== 'ACCEPTED') {
    throw new Error('Only ACCEPTED quotations can be converted to orders');
  }

  // Create sales order from quotation
  const salesOrder = await prisma.salesOrder.create({
    data: {
      tenantId,
      customerId: quotation.customerId,
      dealId: quotation.dealId,
      quotationId: quotation.id,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      orderDate: new Date(),
      items: quotation.items,
      subtotal: quotation.subtotal,
      tax: quotation.tax,
      discount: quotation.discount,
      total: quotation.total,
      status: 'PENDING',
      notes: `Converted from quotation: ${quotation.title}`
    }
  });

  return salesOrder;
};

export const convertOrderToInvoice = async (orderId, tenantId) => {
  // Fetch the order with tracking info
  const order = await prisma.salesOrder.findFirst({
    where: { id: orderId, tenantId },
    include: { tracking: true }
  });

  if (!order) throw new Error('Sales order not found');
  
  if (!['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
    throw new Error('Only CONFIRMED, SHIPPED, or DELIVERED orders can be converted to invoices');
  }

  // Calculate due date (30 days from now)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  // Create invoice from order
  const invoice = await prisma.salesInvoice.create({
    data: {
      tenantId,
      customerId: order.customerId,
      dealId: order.dealId,
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      issueDate: new Date(),
      dueDate,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      amountPaid: 0,
      status: 'DRAFT'
    }
  });

  return invoice;
};

// Invoice Payments
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'UPI', 'OTHER'];

const updateInvoicePaymentStatus = async (invoiceId, tenantId) => {
  // Get invoice with all payments
  const invoice = await prisma.salesInvoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: { payments: true }
  });

  if (!invoice) return;

  // Calculate total paid from all payments
  const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Determine new status
  let newStatus = invoice.status;
  if (totalPaid === 0) {
    newStatus = invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID' ? 'DRAFT' : invoice.status;
  } else if (totalPaid >= invoice.total) {
    newStatus = 'PAID';
  } else {
    newStatus = 'PARTIALLY_PAID';
  }

  // Update invoice
  await prisma.salesInvoice.update({
    where: { id: invoiceId, tenantId },
    data: { 
      amountPaid: totalPaid,
      status: newStatus
    }
  });
};

export const listInvoicePayments = (invoiceId, tenantId) => {
  return prisma.invoicePayment.findMany({
    where: { 
      invoiceId,
      tenantId 
    },
    orderBy: { paymentDate: 'desc' }
  });
};

export const createInvoicePayment = async (data, tenantId) => {
  const invoiceId = normalizeString(data.invoiceId);
  if (!invoiceId) throw new Error('Invoice ID is required');

  // Verify invoice exists
  const invoice = await prisma.salesInvoice.findFirst({
    where: { id: invoiceId, tenantId }
  });

  if (!invoice) throw new Error('Invoice not found');

  const amount = parseMoney(data.amount, 'Payment amount');
  if (amount <= 0) throw new Error('Payment amount must be greater than zero');

  const paymentMethod = data.paymentMethod ? 
    ensureStatus(data.paymentMethod, PAYMENT_METHODS, 'Payment method') : 
    null;

  const paymentDate = parseDate(data.paymentDate, 'Payment date') || new Date();

  // Create payment
  const payment = await prisma.invoicePayment.create({
    data: {
      tenantId,
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber: normalizeOptional(data.referenceNumber),
      notes: normalizeOptional(data.notes)
    }
  });

  // Update invoice payment status
  await updateInvoicePaymentStatus(invoiceId, tenantId);

  return payment;
};

export const updateInvoicePayment = async (id, data, tenantId) => {
  const payment = await prisma.invoicePayment.findFirst({
    where: { id, tenantId }
  });

  if (!payment) throw new Error('Payment not found');

  const updates = {};

  if (data.amount !== undefined) {
    const amount = parseMoney(data.amount, 'Payment amount');
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');
    updates.amount = amount;
  }

  if (data.paymentDate !== undefined) {
    updates.paymentDate = parseDate(data.paymentDate, 'Payment date') || new Date();
  }

  if (data.paymentMethod !== undefined) {
    updates.paymentMethod = data.paymentMethod ? 
      ensureStatus(data.paymentMethod, PAYMENT_METHODS, 'Payment method') : 
      null;
  }

  if (data.referenceNumber !== undefined) {
    updates.referenceNumber = normalizeOptional(data.referenceNumber);
  }

  if (data.notes !== undefined) {
    updates.notes = normalizeOptional(data.notes);
  }

  const updatedPayment = await prisma.invoicePayment.update({
    where: { id },
    data: updates
  });

  // Update invoice payment status
  await updateInvoicePaymentStatus(payment.invoiceId, tenantId);

  return updatedPayment;
};

export const deleteInvoicePayment = async (id, tenantId) => {
  const payment = await prisma.invoicePayment.findFirst({
    where: { id, tenantId }
  });

  if (!payment) throw new Error('Payment not found');

  const invoiceId = payment.invoiceId;

  await prisma.invoicePayment.delete({
    where: { id }
  });

  // Update invoice payment status
  await updateInvoicePaymentStatus(invoiceId, tenantId);
};

// ===========================
// Analytics Functions
// ===========================

/**
 * Get comprehensive sales analytics
 */
export const getSalesAnalytics = async (tenantId, startDate = null, endDate = null) => {
  // Default to last 30 days if no dates provided
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const dateFilter = {
    createdAt: {
      gte: startDate ? new Date(startDate) : defaultStart,
      lte: endDate ? new Date(endDate) : now
    }
  };

  // Get all data in parallel
  const [
    quotations,
    orders,
    invoices,
    payments,
    allInvoices,
    allQuotations,
    allOrders
  ] = await Promise.all([
    prisma.salesQuotation.findMany({ where: { tenantId, ...dateFilter } }),
    prisma.salesOrder.findMany({ where: { tenantId, ...dateFilter } }),
    prisma.salesInvoice.findMany({ 
      where: { tenantId, ...dateFilter },
      include: { payments: true }
    }),
    prisma.invoicePayment.findMany({
      where: { 
        tenantId,
        paymentDate: dateFilter.createdAt
      }
    }),
    // Get all invoices for overall stats
    prisma.salesInvoice.findMany({ 
      where: { tenantId },
      include: { payments: true }
    }),
    // Get all quotations for conversion metrics
    prisma.salesQuotation.findMany({ where: { tenantId } }),
    // Get all orders for conversion metrics
    prisma.salesOrder.findMany({ where: { tenantId } })
  ]);

  // Calculate revenue metrics
  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const paidRevenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const pendingRevenue = invoices
    .filter(inv => ['DRAFT', 'SENT', 'PARTIALLY_PAID'].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const overdueRevenue = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  // Calculate payment metrics
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paymentMethodBreakdown = payments.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  // Calculate invoice statistics
  const invoiceStats = {
    total: allInvoices.length,
    draft: allInvoices.filter(inv => inv.status === 'DRAFT').length,
    sent: allInvoices.filter(inv => inv.status === 'SENT').length,
    partiallyPaid: allInvoices.filter(inv => inv.status === 'PARTIALLY_PAID').length,
    paid: allInvoices.filter(inv => inv.status === 'PAID').length,
    overdue: allInvoices.filter(inv => inv.status === 'OVERDUE').length
  };

  // Calculate conversion rates
  const acceptedQuotations = allQuotations.filter(q => q.status === 'ACCEPTED').length;
  const quotationConversionRate = allQuotations.length > 0 
    ? (acceptedQuotations / allQuotations.length) * 100 
    : 0;
  
  const confirmedOrders = allOrders.filter(o => 
    ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
  ).length;
  const orderConversionRate = allOrders.length > 0 
    ? (confirmedOrders / allOrders.length) * 100 
    : 0;

  // Top customers by revenue
  const customerRevenue = allInvoices.reduce((acc, inv) => {
    if (inv.customerName) {
      acc[inv.customerName] = (acc[inv.customerName] || 0) + Number(inv.total || 0);
    }
    return acc;
  }, {});
  
  const topCustomers = Object.entries(customerRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Revenue over time (daily aggregation)
  const revenueByDate = invoices.reduce((acc, inv) => {
    const date = new Date(inv.createdAt).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + Number(inv.total || 0);
    return acc;
  }, {});

  const revenueTimeSeries = Object.entries(revenueByDate)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Payments over time (daily aggregation)
  const paymentsByDate = payments.reduce((acc, payment) => {
    const date = new Date(payment.paymentDate).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + Number(payment.amount || 0);
    return acc;
  }, {});

  const paymentsTimeSeries = Object.entries(paymentsByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Top products/services from line items
  const itemStats = allInvoices.reduce((acc, inv) => {
    if (inv.items && Array.isArray(inv.items)) {
      inv.items.forEach(item => {
        if (item.description) {
          if (!acc[item.description]) {
            acc[item.description] = {
              description: item.description,
              quantity: 0,
              revenue: 0,
              count: 0
            };
          }
          acc[item.description].quantity += Number(item.quantity || 0);
          acc[item.description].revenue += Number(item.quantity || 0) * Number(item.unitPrice || 0);
          acc[item.description].count += 1;
        }
      });
    }
    return acc;
  }, {});

  const topProducts = Object.values(itemStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    summary: {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      overdueRevenue,
      totalPayments,
      totalInvoices: invoices.length,
      totalOrders: orders.length,
      totalQuotations: quotations.length
    },
    invoiceStats,
    conversionMetrics: {
      quotationConversionRate: quotationConversionRate.toFixed(2),
      orderConversionRate: orderConversionRate.toFixed(2),
      acceptedQuotations,
      totalQuotations: allQuotations.length,
      confirmedOrders,
      totalOrders: allOrders.length
    },
    paymentMethodBreakdown,
    topCustomers,
    topProducts,
    revenueTimeSeries,
    paymentsTimeSeries,
    dateRange: {
      start: startDate || defaultStart.toISOString(),
      end: endDate || now.toISOString()
    }
  };
};

/**
 * Get revenue metrics
 */
export const getRevenueMetrics = async (tenantId, period = '30d') => {
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case '30d':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      break;
    case '90d':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
      break;
    case '1y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  }

  const invoices = await prisma.salesInvoice.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: now
      }
    },
    include: { payments: true }
  });

  const currentRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const paidRevenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  // Calculate previous period for growth rate
  let previousStartDate;
  const periodDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const previousInvoices = await prisma.salesInvoice.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: previousStartDate,
        lt: startDate
      }
    }
  });

  const previousRevenue = previousInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const growthRate = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 100;

  return {
    currentRevenue,
    paidRevenue,
    previousRevenue,
    growthRate: growthRate.toFixed(2),
    period,
    invoiceCount: invoices.length,
    averageInvoiceValue: invoices.length > 0 ? currentRevenue / invoices.length : 0
  };
};

/**
 * Get payment analytics
 */
export const getPaymentAnalytics = async (tenantId, startDate = null, endDate = null) => {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

  const payments = await prisma.invoicePayment.findMany({
    where: {
      tenantId,
      paymentDate: {
        gte: startDate ? new Date(startDate) : defaultStart,
        lte: endDate ? new Date(endDate) : now
      }
    },
    include: {
      invoice: {
        select: {
          issueDate: true,
          customerName: true
        }
      }
    }
  });

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const averagePayment = payments.length > 0 ? totalAmount / payments.length : 0;

  // Payment method breakdown
  const methodBreakdown = payments.reduce((acc, p) => {
    if (!acc[p.paymentMethod]) {
      acc[p.paymentMethod] = { count: 0, amount: 0 };
    }
    acc[p.paymentMethod].count += 1;
    acc[p.paymentMethod].amount += Number(p.amount || 0);
    return acc;
  }, {});

  // Calculate average payment time (days from invoice issue to payment)
  const paymentTimes = payments
    .filter(p => p.invoice?.issueDate)
    .map(p => {
      const issueDate = new Date(p.invoice.issueDate);
      const paymentDate = new Date(p.paymentDate);
      return Math.floor((paymentDate - issueDate) / (1000 * 60 * 60 * 24));
    });

  const averagePaymentTime = paymentTimes.length > 0
    ? paymentTimes.reduce((sum, days) => sum + days, 0) / paymentTimes.length
    : 0;

  return {
    totalPayments: payments.length,
    totalAmount,
    averagePayment,
    averagePaymentTime: averagePaymentTime.toFixed(1),
    methodBreakdown,
    recentPayments: payments.slice(-10).reverse()
  };
};

/**
 * Generate forecast for revenue predictions
 */
export const generateRevenueForecast = async (tenantId, options = {}) => {
  const { method = 'linear', periodsAhead = 30 } = options;
  
  // Get historical revenue data
  const analytics = await getSalesAnalytics(tenantId);
  const historicalData = analytics.revenueTimeSeries || [];

  if (historicalData.length < 3) {
    throw new Error('Insufficient historical data for forecasting. Need at least 3 days of data.');
  }

  // Import forecasting service
  const { default: forecastingService } = await import('../../services/forecasting.service.js');
  
  // Generate forecast
  const forecast = await forecastingService.generateForecast(historicalData, {
    method,
    periodsAhead,
    confidence: 0.95
  });

  return {
    historical: historicalData,
    forecast: forecast.predictions,
    trend: forecast.trend,
    seasonality: forecast.seasonality,
    accuracy: forecast.accuracy,
    method: forecast.method
  };
};
