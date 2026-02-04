import prisma from '../../config/db.js';

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

  return prisma.salesQuotation.create({
    data: {
      tenantId,
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

  return prisma.salesOrder.create({
    data: {
      tenantId,
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

  if (data.customerName !== undefined) {
    const customerName = normalizeString(data.customerName);
    if (!customerName) throw new Error('Customer name is required');
    updates.customerName = customerName;
  }

  if (data.orderNumber !== undefined) updates.orderNumber = normalizeOptional(data.orderNumber);
  if (data.customerEmail !== undefined) updates.customerEmail = normalizeOptional(data.customerEmail);
  if (data.quotationId !== undefined) updates.quotationId = normalizeOptional(data.quotationId);
  if (data.orderDate !== undefined) updates.orderDate = parseDate(data.orderDate, 'Order date');
  if (data.expectedDelivery !== undefined) updates.expectedDelivery = parseDate(data.expectedDelivery, 'Expected delivery');
  if (data.items !== undefined) updates.items = Array.isArray(data.items) ? data.items : null;
  if (data.notes !== undefined) updates.notes = normalizeOptional(data.notes);

  if (data.subtotal !== undefined) updates.subtotal = parseMoney(data.subtotal, 'Subtotal');
  if (data.tax !== undefined) updates.tax = parseMoney(data.tax, 'Tax');
  if (data.discount !== undefined) updates.discount = parseMoney(data.discount, 'Discount');
  if (data.total !== undefined) updates.total = parseMoney(data.total, 'Total');

  if (data.status !== undefined) {
    updates.status = ensureStatus(data.status, ORDER_STATUSES, 'Order status');
  }

  return prisma.salesOrder.update({
    where: { id, tenantId },
    data: updates
  });
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
    orderBy: { createdAt: 'desc' }
  });
};

export const createInvoice = async (data, tenantId) => {
  const customerName = normalizeString(data.customerName);
  if (!customerName) throw new Error('Customer name is required');

  const { items, subtotal, tax, discount, total } = buildTotals(data);
  const amountPaid = parseMoney(data.amountPaid, 'Amount paid');
  const status = ensureStatus(data.status || 'DRAFT', INVOICE_STATUSES, 'Invoice status');

  return prisma.salesInvoice.create({
    data: {
      tenantId,
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
