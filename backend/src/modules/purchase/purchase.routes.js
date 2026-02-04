import express from 'express';
import { requireAuth } from '../../core/auth/auth.middleware.js';
import {
  // Vendors
  listVendorsController,
  getVendorController,
  createVendorController,
  updateVendorController,
  deleteVendorController,
  // Requisitions
  listRequisitionsController,
  getRequisitionController,
  createRequisitionController,
  updateRequisitionController,
  deleteRequisitionController,
  approveRequisitionController,
  rejectRequisitionController,
  // Purchase Orders
  listPurchaseOrdersController,
  getPurchaseOrderController,
  createPurchaseOrderController,
  updatePurchaseOrderController,
  deletePurchaseOrderController,
  approvePurchaseOrderController,
  updatePOStatusController,
  updatePaymentStatusController,
  // Goods Receipts
  listGoodsReceiptsController,
  getGoodsReceiptController,
  createGoodsReceiptController,
  updateGoodsReceiptController,
  // Evaluations
  listEvaluationsController,
  getEvaluationController,
  createEvaluationController,
  updateEvaluationController,
  deleteEvaluationController,
  // Analytics
  getPurchaseAnalyticsController,
  getVendorPerformanceController
} from './purchase.controller.js';

const router = express.Router();

// ==================== VENDORS ====================
router.get('/vendors', requireAuth, listVendorsController);
router.get('/vendors/:id', requireAuth, getVendorController);
router.post('/vendors', requireAuth, createVendorController);
router.put('/vendors/:id', requireAuth, updateVendorController);
router.delete('/vendors/:id', requireAuth, deleteVendorController);

// ==================== PURCHASE REQUISITIONS ====================
router.get('/requisitions', requireAuth, listRequisitionsController);
router.get('/requisitions/:id', requireAuth, getRequisitionController);
router.post('/requisitions', requireAuth, createRequisitionController);
router.put('/requisitions/:id', requireAuth, updateRequisitionController);
router.delete('/requisitions/:id', requireAuth, deleteRequisitionController);
router.post('/requisitions/:id/approve', requireAuth, approveRequisitionController);
router.post('/requisitions/:id/reject', requireAuth, rejectRequisitionController);

// ==================== PURCHASE ORDERS ====================
router.get('/orders', requireAuth, listPurchaseOrdersController);
router.get('/orders/:id', requireAuth, getPurchaseOrderController);
router.post('/orders', requireAuth, createPurchaseOrderController);
router.put('/orders/:id', requireAuth, updatePurchaseOrderController);
router.delete('/orders/:id', requireAuth, deletePurchaseOrderController);
router.post('/orders/:id/approve', requireAuth, approvePurchaseOrderController);
router.patch('/orders/:id/status', requireAuth, updatePOStatusController);
router.patch('/orders/:id/payment', requireAuth, updatePaymentStatusController);

// ==================== GOODS RECEIPTS ====================
router.get('/receipts', requireAuth, listGoodsReceiptsController);
router.get('/receipts/:id', requireAuth, getGoodsReceiptController);
router.post('/receipts', requireAuth, createGoodsReceiptController);
router.put('/receipts/:id', requireAuth, updateGoodsReceiptController);

// ==================== SUPPLIER EVALUATIONS ====================
router.get('/evaluations', requireAuth, listEvaluationsController);
router.get('/evaluations/:id', requireAuth, getEvaluationController);
router.post('/evaluations', requireAuth, createEvaluationController);
router.put('/evaluations/:id', requireAuth, updateEvaluationController);
router.delete('/evaluations/:id', requireAuth, deleteEvaluationController);

// ==================== ANALYTICS ====================
router.get('/analytics', requireAuth, getPurchaseAnalyticsController);
router.get('/vendor-performance', requireAuth, getVendorPerformanceController);

export default router;
