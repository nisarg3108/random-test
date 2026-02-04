import {
  listQuotations,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  listSalesOrders,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  listTrackings,
  createTracking,
  updateTracking,
  deleteTracking
} from './sales.service.js';

const handleError = (error, next) => {
  if (error?.code === 'P2025') {
    error.message = 'Record not found';
  }
  next(error);
};

// Quotations
export const listQuotationsController = async (req, res, next) => {
  try {
    const quotations = await listQuotations(req.user.tenantId);
    res.json(quotations);
  } catch (error) {
    handleError(error, next);
  }
};

export const createQuotationController = async (req, res, next) => {
  try {
    const quotation = await createQuotation(req.body, req.user.tenantId);
    res.status(201).json(quotation);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateQuotationController = async (req, res, next) => {
  try {
    const quotation = await updateQuotation(req.params.id, req.body, req.user.tenantId);
    res.json(quotation);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteQuotationController = async (req, res, next) => {
  try {
    await deleteQuotation(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

// Sales Orders
export const listSalesOrdersController = async (req, res, next) => {
  try {
    const orders = await listSalesOrders(req.user.tenantId);
    res.json(orders);
  } catch (error) {
    handleError(error, next);
  }
};

export const createSalesOrderController = async (req, res, next) => {
  try {
    const order = await createSalesOrder(req.body, req.user.tenantId);
    res.status(201).json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateSalesOrderController = async (req, res, next) => {
  try {
    const order = await updateSalesOrder(req.params.id, req.body, req.user.tenantId);
    res.json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteSalesOrderController = async (req, res, next) => {
  try {
    await deleteSalesOrder(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

// Invoices
export const listInvoicesController = async (req, res, next) => {
  try {
    const invoices = await listInvoices(req.user.tenantId);
    res.json(invoices);
  } catch (error) {
    handleError(error, next);
  }
};

export const createInvoiceController = async (req, res, next) => {
  try {
    const invoice = await createInvoice(req.body, req.user.tenantId);
    res.status(201).json(invoice);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateInvoiceController = async (req, res, next) => {
  try {
    const invoice = await updateInvoice(req.params.id, req.body, req.user.tenantId);
    res.json(invoice);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteInvoiceController = async (req, res, next) => {
  try {
    await deleteInvoice(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

// Tracking
export const listTrackingsController = async (req, res, next) => {
  try {
    const trackings = await listTrackings(req.user.tenantId);
    res.json(trackings);
  } catch (error) {
    handleError(error, next);
  }
};

export const createTrackingController = async (req, res, next) => {
  try {
    const tracking = await createTracking(req.body, req.user.tenantId);
    res.status(201).json(tracking);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateTrackingController = async (req, res, next) => {
  try {
    const tracking = await updateTracking(req.params.id, req.body, req.user.tenantId);
    res.json(tracking);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteTrackingController = async (req, res, next) => {
  try {
    await deleteTracking(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};
