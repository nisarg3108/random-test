import * as apService from './ap.service.js';

// ==================== AP BILLS ====================

export const listBillsController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const filters = {
      status: req.query.status,
      approvalStatus: req.query.approvalStatus,
      vendorId: req.query.vendorId,
      overdue: req.query.overdue,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await apService.listBills(tenantId, filters);
    res.json(result);
  } catch (error) {
    console.error('Error listing bills:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBillByIdController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const bill = await apService.getBillById(id, tenantId);
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Error getting bill:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createBillController = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    const billData = req.body;

    const bill = await apService.createBill(billData, tenantId, userId);
    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateBillController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const billData = req.body;

    const bill = await apService.updateBill(id, billData, tenantId);
    res.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteBillController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const bill = await apService.deleteBill(id, tenantId);
    res.json({ message: 'Bill deleted successfully', bill });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: error.message });
  }
};

export const approveBillController = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { id } = req.params;

    const bill = await apService.approveBill(id, tenantId, userId);
    res.json(bill);
  } catch (error) {
    console.error('Error approving bill:', error);
    res.status(500).json({ error: error.message });
  }
};

export const rejectBillController = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const bill = await apService.rejectBill(id, tenantId, userId, reason);
    res.json(bill);
  } catch (error) {
    console.error('Error rejecting bill:', error);
    res.status(500).json({ error: error.message });
  }
};

export const performThreeWayMatchController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const result = await apService.performThreeWayMatch(id, tenantId);
    res.json(result);
  } catch (error) {
    console.error('Error performing three-way match:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== PAYMENTS ====================

export const listPaymentsController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const filters = {
      status: req.query.status,
      vendorId: req.query.vendorId,
      paymentMethod: req.query.paymentMethod,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await apService.listPayments(tenantId, filters);
    res.json(result);
  } catch (error) {
    console.error('Error listing payments:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentByIdController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const payment = await apService.getPaymentById(id, tenantId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createPaymentController = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    const paymentData = req.body;

    const payment = await apService.createPayment(paymentData, tenantId, userId);
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updatePaymentController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const paymentData = req.body;

    const payment = await apService.updatePayment(id, paymentData, tenantId);
    res.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deletePaymentController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const payment = await apService.deletePayment(id, tenantId);
    res.json({ message: 'Payment deleted successfully', payment });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== ANALYTICS & REPORTS ====================

export const getAPAnalyticsController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;

    const analytics = await apService.getAPAnalytics(tenantId, startDate, endDate);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting AP analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAgingReportController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { asOfDate } = req.query;

    const report = await apService.getAgingReport(tenantId, asOfDate);
    res.json(report);
  } catch (error) {
    console.error('Error getting aging report:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getVendorStatementController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { vendorId } = req.params;
    const { startDate, endDate } = req.query;

    const statement = await apService.getVendorStatement(vendorId, tenantId, startDate, endDate);
    res.json(statement);
  } catch (error) {
    console.error('Error getting vendor statement:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== ATTACHMENTS ====================

export const uploadBillAttachmentController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await apService.addBillAttachment(id, tenantId, req.file);
    res.json(attachment);
  } catch (error) {
    console.error('Error uploading bill attachment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const uploadPaymentAttachmentController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await apService.addPaymentAttachment(id, tenantId, req.file);
    res.json(attachment);
  } catch (error) {
    console.error('Error uploading payment attachment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteBillAttachmentController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id, attachmentId } = req.params;

    await apService.deleteBillAttachment(id, tenantId, attachmentId);
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill attachment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deletePaymentAttachmentController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id, attachmentId } = req.params;

    await apService.deletePaymentAttachment(id, tenantId, attachmentId);
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment attachment:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== EXCEL EXPORT ====================

export const exportAgingReportController = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { asOfDate } = req.query;

    const excelBuffer = await apService.exportAgingReportToExcel(tenantId, asOfDate);
    
    const filename = `AP-Aging-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting aging report:', error);
    res.status(500).json({ error: error.message });
  }
};
