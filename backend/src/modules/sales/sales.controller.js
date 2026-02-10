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
  deleteTracking,
  convertQuotationToOrder,
  convertOrderToInvoice,
  listInvoicePayments,
  createInvoicePayment,
  updateInvoicePayment,
  deleteInvoicePayment,
  getSalesAnalytics,
  getRevenueMetrics,
  getPaymentAnalytics,
  generateRevenueForecast
} from './sales.service.js';
import exportService from '../../services/export.service.js';
import emailService from '../../services/email.service.js';

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

// Conversions
export const convertQuotationToOrderController = async (req, res, next) => {
  try {
    const order = await convertQuotationToOrder(req.params.id, req.user.tenantId);
    res.status(201).json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const convertOrderToInvoiceController = async (req, res, next) => {
  try {
    const invoice = await convertOrderToInvoice(req.params.id, req.user.tenantId);
    res.status(201).json(invoice);
  } catch (error) {
    handleError(error, next);
  }
};

// Invoice Payments
export const listInvoicePaymentsController = async (req, res, next) => {
  try {
    const payments = await listInvoicePayments(req.params.invoiceId, req.user.tenantId);
    res.json(payments);
  } catch (error) {
    handleError(error, next);
  }
};

export const createInvoicePaymentController = async (req, res, next) => {
  try {
    const payment = await createInvoicePayment(req.body, req.user.tenantId);
    res.status(201).json(payment);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateInvoicePaymentController = async (req, res, next) => {
  try {
    const payment = await updateInvoicePayment(req.params.id, req.body, req.user.tenantId);
    res.json(payment);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteInvoicePaymentController = async (req, res, next) => {
  try {
    await deleteInvoicePayment(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

// Analytics
export const getSalesAnalyticsController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await getSalesAnalytics(req.user.tenantId, startDate, endDate);
    res.json(analytics);
  } catch (error) {
    handleError(error, next);
  }
};

export const getRevenueMetricsController = async (req, res, next) => {
  try {
    const { period } = req.query;
    const metrics = await getRevenueMetrics(req.user.tenantId, period);
    res.json(metrics);
  } catch (error) {
    handleError(error, next);
  }
};

export const getPaymentAnalyticsController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await getPaymentAnalytics(req.user.tenantId, startDate, endDate);
    res.json(analytics);
  } catch (error) {
    handleError(error, next);
  }
};

export const exportAnalyticsPDFController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await getSalesAnalytics(req.user.tenantId, startDate, endDate);
    
    const pdfBuffer = await exportService.generatePDF(analytics);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    handleError(error, next);
  }
};

export const exportAnalyticsCSVController = async (req, res, next) => {
  try {
    const { startDate, endDate, type = 'summary' } = req.query;
    const analytics = await getSalesAnalytics(req.user.tenantId, startDate, endDate);
    
    const csv = await exportService.generateCSV(analytics, type);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    handleError(error, next);
  }
};

export const exportAnalyticsExcelController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await getSalesAnalytics(req.user.tenantId, startDate, endDate);
    
    const excelBuffer = await exportService.generateExcel(analytics);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales-analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    handleError(error, next);
  }
};

export const emailAnalyticsReportController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { recipients, format = 'pdf', subject } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    const analytics = await getSalesAnalytics(req.user.tenantId, startDate, endDate);
    
    const promises = recipients.map(email => 
      emailService.sendAnalyticsReport(email, analytics, { format, subject })
    );
    
    await Promise.all(promises);
    
    res.json({ 
      success: true, 
      message: `Report sent to ${recipients.length} recipient(s)`,
      recipients 
    });
  } catch (error) {
    handleError(error, next);
  }
};

export const scheduleAnalyticsReportController = async (req, res, next) => {
  try {
    const { schedule, recipients, format = 'pdf' } = req.body;
    
    if (!schedule || !['daily', 'weekly', 'monthly', 'quarterly'].includes(schedule)) {
      return res.status(400).json({ error: 'Valid schedule type required (daily, weekly, monthly, quarterly)' });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    const result = await emailService.scheduleReport(
      req.user.tenantId,
      schedule,
      recipients,
      { format }
    );
    
    res.json(result);
  } catch (error) {
    handleError(error, next);
  }
};

export const cancelScheduledReportController = async (req, res, next) => {
  try {
    const { schedule } = req.params;
    
    const result = emailService.cancelScheduledReport(req.user.tenantId, schedule);
    
    res.json(result);
  } catch (error) {
    handleError(error, next);
  }
};

export const getRevenueForecastController = async (req, res, next) => {
  try {
    const { method = 'linear', periodsAhead = 30 } = req.query;
    
    const forecast = await generateRevenueForecast(req.user.tenantId, {
      method,
      periodsAhead: parseInt(periodsAhead)
    });
    
    res.json(forecast);
  } catch (error) {
    handleError(error, next);
  }
};
