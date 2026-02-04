import {
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  listRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisition,
  deleteRequisition,
  approveRequisition,
  rejectRequisition,
  listPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  updatePOStatus,
  updatePaymentStatus,
  listGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  updateGoodsReceipt,
  listEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getPurchaseAnalytics,
  getVendorPerformance
} from './purchase.service.js';

const handleError = (error, next) => {
  if (error?.code === 'P2025') {
    error.message = 'Record not found';
  }
  next(error);
};

// ==================== VENDORS ====================

export const listVendorsController = async (req, res, next) => {
  try {
    const vendors = await listVendors(req.user.tenantId, req.query);
    res.json(vendors);
  } catch (error) {
    handleError(error, next);
  }
};

export const getVendorController = async (req, res, next) => {
  try {
    const vendor = await getVendorById(req.params.id, req.user.tenantId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    handleError(error, next);
  }
};

export const createVendorController = async (req, res, next) => {
  try {
    const vendor = await createVendor(req.body, req.user.tenantId);
    res.status(201).json(vendor);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateVendorController = async (req, res, next) => {
  try {
    const vendor = await updateVendor(req.params.id, req.body, req.user.tenantId);
    res.json(vendor);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteVendorController = async (req, res, next) => {
  try {
    await deleteVendor(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

// ==================== PURCHASE REQUISITIONS ====================

export const listRequisitionsController = async (req, res, next) => {
  try {
    const requisitions = await listRequisitions(req.user.tenantId, req.query);
    res.json(requisitions);
  } catch (error) {
    handleError(error, next);
  }
};

export const getRequisitionController = async (req, res, next) => {
  try {
    const requisition = await getRequisitionById(req.params.id, req.user.tenantId);
    if (!requisition) {
      return res.status(404).json({ message: 'Requisition not found' });
    }
    res.json(requisition);
  } catch (error) {
    handleError(error, next);
  }
};

export const createRequisitionController = async (req, res, next) => {
  try {
    const requisition = await createRequisition(req.body, req.user.tenantId, req.user.id);
    res.status(201).json(requisition);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateRequisitionController = async (req, res, next) => {
  try {
    const requisition = await updateRequisition(req.params.id, req.body, req.user.tenantId);
    res.json(requisition);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteRequisitionController = async (req, res, next) => {
  try {
    await deleteRequisition(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

export const approveRequisitionController = async (req, res, next) => {
  try {
    const requisition = await approveRequisition(req.params.id, req.user.tenantId, req.user.id);
    res.json(requisition);
  } catch (error) {
    handleError(error, next);
  }
};

export const rejectRequisitionController = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const requisition = await rejectRequisition(req.params.id, req.user.tenantId, req.user.id, reason);
    res.json(requisition);
  } catch (error) {
    handleError(error, next);
  }
};

// ==================== PURCHASE ORDERS ====================

export const listPurchaseOrdersController = async (req, res, next) => {
  try {
    const orders = await listPurchaseOrders(req.user.tenantId, req.query);
    res.json(orders);
  } catch (error) {
    handleError(error, next);
  }
};

export const getPurchaseOrderController = async (req, res, next) => {
  try {
    const order = await getPurchaseOrderById(req.params.id, req.user.tenantId);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const createPurchaseOrderController = async (req, res, next) => {
  try {
    const order = await createPurchaseOrder(req.body, req.user.tenantId, req.user.id);
    res.status(201).json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const updatePurchaseOrderController = async (req, res, next) => {
  try {
    const order = await updatePurchaseOrder(req.params.id, req.body, req.user.tenantId);
    res.json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const deletePurchaseOrderController = async (req, res, next) => {
  try {
    await deletePurchaseOrder(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

export const approvePurchaseOrderController = async (req, res, next) => {
  try {
    const order = await approvePurchaseOrder(req.params.id, req.user.tenantId, req.user.id);
    res.json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const updatePOStatusController = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await updatePOStatus(req.params.id, status, req.user.tenantId);
    res.json(order);
  } catch (error) {
    handleError(error, next);
  }
};

export const updatePaymentStatusController = async (req, res, next) => {
  try {
    const { paymentStatus, paidAmount } = req.body;
    const order = await updatePaymentStatus(req.params.id, paymentStatus, paidAmount, req.user.tenantId);
    res.json(order);
  } catch (error) {
    handleError(error, next);
  }
};

// ==================== GOODS RECEIPTS ====================

export const listGoodsReceiptsController = async (req, res, next) => {
  try {
    const receipts = await listGoodsReceipts(req.user.tenantId, req.query);
    res.json(receipts);
  } catch (error) {
    handleError(error, next);
  }
};

export const getGoodsReceiptController = async (req, res, next) => {
  try {
    const receipt = await getGoodsReceiptById(req.params.id, req.user.tenantId);
    if (!receipt) {
      return res.status(404).json({ message: 'Goods receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    handleError(error, next);
  }
};

export const createGoodsReceiptController = async (req, res, next) => {
  try {
    const receipt = await createGoodsReceipt(req.body, req.user.tenantId, req.user.id);
    res.status(201).json(receipt);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateGoodsReceiptController = async (req, res, next) => {
  try {
    const receipt = await updateGoodsReceipt(req.params.id, req.body, req.user.tenantId);
    res.json(receipt);
  } catch (error) {
    handleError(error, next);
  }
};

// ==================== SUPPLIER EVALUATIONS ====================

export const listEvaluationsController = async (req, res, next) => {
  try {
    const evaluations = await listEvaluations(req.user.tenantId, req.query);
    res.json(evaluations);
  } catch (error) {
    handleError(error, next);
  }
};

export const getEvaluationController = async (req, res, next) => {
  try {
    const evaluation = await getEvaluationById(req.params.id, req.user.tenantId);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    res.json(evaluation);
  } catch (error) {
    handleError(error, next);
  }
};

export const createEvaluationController = async (req, res, next) => {
  try {
    const evaluation = await createEvaluation(req.body, req.user.tenantId, req.user.id);
    res.status(201).json(evaluation);
  } catch (error) {
    handleError(error, next);
  }
};

export const updateEvaluationController = async (req, res, next) => {
  try {
    const evaluation = await updateEvaluation(req.params.id, req.body, req.user.tenantId);
    res.json(evaluation);
  } catch (error) {
    handleError(error, next);
  }
};

export const deleteEvaluationController = async (req, res, next) => {
  try {
    await deleteEvaluation(req.params.id, req.user.tenantId);
    res.status(204).send();
  } catch (error) {
    handleError(error, next);
  }
};

// ==================== ANALYTICS ====================

export const getPurchaseAnalyticsController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await getPurchaseAnalytics(req.user.tenantId, startDate, endDate);
    res.json(analytics);
  } catch (error) {
    handleError(error, next);
  }
};

export const getVendorPerformanceController = async (req, res, next) => {
  try {
    const { vendorId } = req.query;
    const performance = await getVendorPerformance(req.user.tenantId, vendorId);
    res.json(performance);
  } catch (error) {
    handleError(error, next);
  }
};
