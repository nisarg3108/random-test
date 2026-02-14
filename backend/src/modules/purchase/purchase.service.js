import prisma from '../../config/db.js';

// ==================== VENDORS ====================

export const listVendors = async (tenantId, filters = {}) => {
  const where = { tenantId };
  
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { vendorCode: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  return await prisma.vendor.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          purchaseOrders: true,
          evaluations: true
        }
      }
    }
  });
};

export const getVendorById = async (id, tenantId) => {
  return await prisma.vendor.findFirst({
    where: { id, tenantId },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      evaluations: {
        orderBy: { evaluationDate: 'desc' },
        take: 5
      },
      _count: {
        select: {
          purchaseOrders: true,
          purchaseRequisitions: true,
          evaluations: true
        }
      }
    }
  });
};

export const createVendor = async (data, tenantId) => {
  // Generate unique vendor code using timestamp if not provided
  const vendorCode = data.vendorCode || `VEN-${Date.now()}`;

  return await prisma.vendor.create({
    data: {
      ...data,
      vendorCode,
      tenantId
    }
  });
};

export const updateVendor = async (id, data, tenantId) => {
  return await prisma.vendor.update({
    where: { id, tenantId },
    data
  });
};

export const deleteVendor = async (id, tenantId) => {
  // Check if vendor has active purchase orders
  const activeOrders = await prisma.purchaseOrder.count({
    where: {
      vendorId: id,
      tenantId,
      status: { in: ['DRAFT', 'SENT', 'CONFIRMED', 'SHIPPED'] }
    }
  });

  if (activeOrders > 0) {
    throw new Error('Cannot delete vendor with active purchase orders');
  }

  return await prisma.vendor.delete({
    where: { id, tenantId }
  });
};

// ==================== PURCHASE REQUISITIONS ====================

export const listRequisitions = async (tenantId, filters = {}) => {
  const where = { tenantId };
  
  if (filters.status) where.status = filters.status;
  if (filters.approvalStatus) where.approvalStatus = filters.approvalStatus;
  if (filters.priority) where.priority = filters.priority;
  if (filters.departmentId) where.departmentId = filters.departmentId;

  return await prisma.purchaseRequisition.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      vendor: true,
      _count: {
        select: { purchaseOrders: true }
      }
    }
  });
};

export const getRequisitionById = async (id, tenantId) => {
  return await prisma.purchaseRequisition.findFirst({
    where: { id, tenantId },
    include: {
      vendor: true,
      purchaseOrders: true
    }
  });
};

export const createRequisition = async (data, tenantId, userId) => {
  // Generate unique requisition number
  const reqCount = await prisma.purchaseRequisition.count({ where: { tenantId } });
  const requisitionNumber = `PR-${String(reqCount + 1).padStart(6, '0')}`;

  return await prisma.purchaseRequisition.create({
    data: {
      ...data,
      requisitionNumber,
      requestedBy: userId,
      tenantId
    }
  });
};

export const updateRequisition = async (id, data, tenantId) => {
  return await prisma.purchaseRequisition.update({
    where: { id, tenantId },
    data
  });
};

export const deleteRequisition = async (id, tenantId) => {
  // Check if requisition has been converted to PO
  const po = await prisma.purchaseOrder.findFirst({
    where: { requisitionId: id, tenantId }
  });

  if (po) {
    throw new Error('Cannot delete requisition that has been converted to purchase order');
  }

  return await prisma.purchaseRequisition.delete({
    where: { id, tenantId }
  });
};

export const approveRequisition = async (id, tenantId, userId) => {
  return await prisma.purchaseRequisition.update({
    where: { id, tenantId },
    data: {
      approvalStatus: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date()
    }
  });
};

export const rejectRequisition = async (id, tenantId, userId, reason) => {
  return await prisma.purchaseRequisition.update({
    where: { id, tenantId },
    data: {
      approvalStatus: 'REJECTED',
      approvedBy: userId,
      approvedAt: new Date(),
      rejectionReason: reason
    }
  });
};

export const convertRequisitionToPO = async (id, tenantId, userId) => {
  // Get the requisition with all details
  const requisition = await prisma.purchaseRequisition.findFirst({
    where: { id, tenantId },
    include: { vendor: true }
  });

  if (!requisition) {
    throw new Error('Requisition not found');
  }

  if (requisition.approvalStatus !== 'APPROVED') {
    throw new Error('Only approved requisitions can be converted to purchase orders');
  }

  if (requisition.status === 'CONVERTED') {
    throw new Error('This requisition has already been converted to a purchase order');
  }

  // Generate unique PO number
  const poCount = await prisma.purchaseOrder.count({ where: { tenantId } });
  const poNumber = `PO-${String(poCount + 1).padStart(6, '0')}`;

  // Create purchase order from requisition
  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      vendorId: requisition.vendorId,
      requisitionId: requisition.id,
      items: requisition.items,
      subtotal: requisition.totalAmount,
      tax: 0,
      discount: 0,
      shipping: 0,
      totalAmount: requisition.totalAmount,
      paymentTerms: requisition.vendor?.paymentTerms || 'Net 30',
      deliveryDate: requisition.requiredDate,
      shippingAddress: requisition.deliveryAddress,
      status: 'DRAFT',
      approvalStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      createdBy: userId,
      tenantId
    }
  });

  // Update requisition status to CONVERTED
  await prisma.purchaseRequisition.update({
    where: { id, tenantId },
    data: { status: 'CONVERTED' }
  });

  return purchaseOrder;
};

// ==================== PURCHASE ORDERS ====================

export const listPurchaseOrders = async (tenantId, filters = {}) => {
  const where = { tenantId };
  
  // Handle multiple status values
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status };
    } else {
      where.status = filters.status;
    }
  }
  
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.approvalStatus) where.approvalStatus = filters.approvalStatus;
  if (filters.vendorId) where.vendorId = filters.vendorId;

  return await prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      vendor: true,
      requisition: true,
      _count: {
        select: { receipts: true }
      }
    }
  });
};

export const getPurchaseOrderById = async (id, tenantId) => {
  return await prisma.purchaseOrder.findFirst({
    where: { id, tenantId },
    include: {
      vendor: true,
      requisition: true,
      receipts: true
    }
  });
};

export const createPurchaseOrder = async (data, tenantId, userId) => {
  // Generate unique PO number
  const poCount = await prisma.purchaseOrder.count({ where: { tenantId } });
  const poNumber = `PO-${String(poCount + 1).padStart(6, '0')}`;

  // If created from requisition, mark requisition as converted
  if (data.requisitionId) {
    await prisma.purchaseRequisition.update({
      where: { id: data.requisitionId },
      data: { status: 'CONVERTED' }
    });
  }

  return await prisma.purchaseOrder.create({
    data: {
      ...data,
      poNumber,
      createdBy: userId,
      tenantId
    }
  });
};

export const updatePurchaseOrder = async (id, data, tenantId) => {
  return await prisma.purchaseOrder.update({
    where: { id, tenantId },
    data
  });
};

export const deletePurchaseOrder = async (id, tenantId) => {
  // Check if PO has goods receipts
  const receipts = await prisma.goodsReceipt.count({
    where: { purchaseOrderId: id, tenantId }
  });

  if (receipts > 0) {
    throw new Error('Cannot delete purchase order with goods receipts');
  }

  return await prisma.purchaseOrder.delete({
    where: { id, tenantId }
  });
};

export const approvePurchaseOrder = async (id, tenantId, userId) => {
  return await prisma.purchaseOrder.update({
    where: { id, tenantId },
    data: {
      approvalStatus: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
      status: 'SENT' // Automatically send after approval
    }
  });
};

export const updatePOStatus = async (id, status, tenantId) => {
  return await prisma.purchaseOrder.update({
    where: { id, tenantId },
    data: { status }
  });
};

export const updatePaymentStatus = async (id, paymentStatus, paidAmount, tenantId) => {
  return await prisma.purchaseOrder.update({
    where: { id, tenantId },
    data: {
      paymentStatus,
      paidAmount
    }
  });
};

// ==================== GOODS RECEIPTS ====================

// Helper function to update PO status based on receipt completion
const updatePOStatusFromReceipts = async (purchaseOrderId) => {
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { receipts: true }
  });

  if (!purchaseOrder) return;

  const orderedItems = purchaseOrder.items || [];
  const allReceipts = purchaseOrder.receipts || [];
  
  // Calculate total received quantities per item
  const receivedQuantities = {};
  allReceipts.forEach(receipt => {
    const receiptItems = receipt.items || [];
    receiptItems.forEach(item => {
      const key = item.itemName;
      receivedQuantities[key] = (receivedQuantities[key] || 0) + (item.receivedQuantity || 0);
    });
  });

  // Check if all items are fully received
  let allItemsReceived = orderedItems.length > 0;
  orderedItems.forEach(orderedItem => {
    const totalReceived = receivedQuantities[orderedItem.itemName] || 0;
    const ordered = orderedItem.quantity || 0;
    if (totalReceived < ordered) {
      allItemsReceived = false;
    }
  });

  // Update PO status: RECEIVED if fully received, keep as SHIPPED if partial
  const newStatus = allItemsReceived ? 'RECEIVED' : purchaseOrder.status;
  if (purchaseOrder.status !== newStatus && newStatus === 'RECEIVED') {
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: 'RECEIVED' }
    });
  }
};

export const listGoodsReceipts = async (tenantId, filters = {}) => {
  const where = { tenantId };
  
  if (filters.status) where.status = filters.status;
  if (filters.purchaseOrderId) where.purchaseOrderId = filters.purchaseOrderId;

  return await prisma.goodsReceipt.findMany({
    where,
    orderBy: { receivedDate: 'desc' },
    include: {
      purchaseOrder: {
        include: { vendor: true }
      }
    }
  });
};

export const getGoodsReceiptById = async (id, tenantId) => {
  return await prisma.goodsReceipt.findFirst({
    where: { id, tenantId },
    include: {
      purchaseOrder: {
        include: { vendor: true }
      }
    }
  });
};

export const createGoodsReceipt = async (data, tenantId, userId) => {
  // Generate unique receipt number
  const receiptCount = await prisma.goodsReceipt.count({ where: { tenantId } });
  const receiptNumber = `GRN-${String(receiptCount + 1).padStart(6, '0')}`;

  // Create the receipt
  const receipt = await prisma.goodsReceipt.create({
    data: {
      ...data,
      receiptNumber,
      receivedBy: userId,
      tenantId
    }
  });

  // Update PO status based on receipt quantities
  await updatePOStatusFromReceipts(data.purchaseOrderId);

  return receipt;
};

export const updateGoodsReceipt = async (id, data, tenantId) => {
  const receipt = await prisma.goodsReceipt.update({
    where: { id, tenantId },
    data
  });

  // Recalculate PO status after receipt update
  await updatePOStatusFromReceipts(receipt.purchaseOrderId);

  return receipt;
};

export const deleteGoodsReceipt = async (id, tenantId) => {
  // Get receipt before deleting to access purchaseOrderId
  const receipt = await prisma.goodsReceipt.findFirst({
    where: { id, tenantId }
  });

  if (!receipt) {
    throw new Error('Goods receipt not found');
  }

  const purchaseOrderId = receipt.purchaseOrderId;

  // Delete the receipt
  await prisma.goodsReceipt.delete({
    where: { id, tenantId }
  });

  // Recalculate PO status after receipt deletion
  await updatePOStatusFromReceipts(purchaseOrderId);

  return receipt;
};

// ==================== SUPPLIER EVALUATIONS ====================

// Helper function to update vendor rating based on all evaluations
const updateVendorRating = async (vendorId, tenantId) => {
  const avgRating = await prisma.supplierEvaluation.aggregate({
    where: { vendorId, tenantId },
    _avg: { overallRating: true }
  });

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { rating: avgRating._avg.overallRating || 0 }
  });
};

export const listEvaluations = async (tenantId, filters = {}) => {
  const where = { tenantId };
  
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.status) where.status = filters.status;

  return await prisma.supplierEvaluation.findMany({
    where,
    orderBy: { evaluationDate: 'desc' },
    include: {
      vendor: true
    }
  });
};

export const getEvaluationById = async (id, tenantId) => {
  return await prisma.supplierEvaluation.findFirst({
    where: { id, tenantId },
    include: {
      vendor: true
    }
  });
};

export const createEvaluation = async (data, tenantId, userId) => {
  // Calculate overall rating as average
  const ratings = [
    data.qualityRating || 0,
    data.deliveryRating || 0,
    data.priceRating || 0,
    data.serviceRating || 0,
    data.communicationRating || 0
  ];
  const overallRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  const evaluation = await prisma.supplierEvaluation.create({
    data: {
      ...data,
      overallRating,
      evaluatedBy: userId,
      tenantId
    }
  });

  // Update vendor's rating based on all evaluations
  await updateVendorRating(data.vendorId, tenantId);

  return evaluation;
};

export const updateEvaluation = async (id, data, tenantId) => {
  // Recalculate overall rating
  const ratings = [
    data.qualityRating || 0,
    data.deliveryRating || 0,
    data.priceRating || 0,
    data.serviceRating || 0,
    data.communicationRating || 0
  ];
  const overallRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  const evaluation = await prisma.supplierEvaluation.update({
    where: { id, tenantId },
    data: {
      ...data,
      overallRating
    }
  });

  // Update vendor's rating based on all evaluations
  await updateVendorRating(evaluation.vendorId, tenantId);

  return evaluation;
};

export const deleteEvaluation = async (id, tenantId) => {
  // Get vendor ID before deleting
  const evaluation = await prisma.supplierEvaluation.findFirst({
    where: { id, tenantId }
  });

  if (!evaluation) {
    throw new Error('Evaluation not found');
  }

  const vendorId = evaluation.vendorId;

  await prisma.supplierEvaluation.delete({
    where: { id, tenantId }
  });

  // Update vendor's rating after deletion
  await updateVendorRating(vendorId, tenantId);

  return evaluation;
};

// ==================== ANALYTICS ====================

export const getPurchaseAnalytics = async (tenantId, startDate, endDate) => {
  const where = {
    tenantId,
    createdAt: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined
    }
  };

  // Total Purchase Orders
  const totalPOs = await prisma.purchaseOrder.count({ where });
  
  // Total Spend
  const totalSpend = await prisma.purchaseOrder.aggregate({
    where: { ...where, status: { notIn: ['CANCELLED'] } },
    _sum: { totalAmount: true }
  });

  // PO by Status
  const poByStatus = await prisma.purchaseOrder.groupBy({
    by: ['status'],
    where,
    _count: true
  });

  // Top Vendors by Spend
  const topVendors = await prisma.purchaseOrder.groupBy({
    by: ['vendorId'],
    where: { ...where, status: { notIn: ['CANCELLED'] } },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: 'desc' } },
    take: 5
  });

  // Get vendor details
  const vendorIds = topVendors.map(v => v.vendorId);
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, name: true, vendorCode: true }
  });

  const topVendorsWithDetails = topVendors.map(tv => ({
    ...tv,
    vendor: vendors.find(v => v.id === tv.vendorId)
  }));

  // Average PO Value
  const avgPOValue = totalPOs > 0 ? (totalSpend._sum.totalAmount || 0) / totalPOs : 0;

  // Pending Requisitions
  const pendingRequisitions = await prisma.purchaseRequisition.count({
    where: { tenantId, approvalStatus: 'PENDING' }
  });

  // Pending Approvals
  const pendingApprovals = await prisma.purchaseOrder.count({
    where: { tenantId, approvalStatus: 'PENDING' }
  });

  // Payment Status
  const paymentStatus = await prisma.purchaseOrder.groupBy({
    by: ['paymentStatus'],
    where,
    _count: true,
    _sum: { totalAmount: true }
  });

  // Monthly Trend
  const monthlyTrend = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "orderDate") as month,
      COUNT(*)::integer as count,
      SUM("totalAmount")::float as total
    FROM "PurchaseOrder"
    WHERE "tenantId" = ${tenantId}
      AND "status" != 'CANCELLED'
      AND "orderDate" >= ${startDate ? new Date(startDate) : new Date('2000-01-01')}
      AND "orderDate" <= ${endDate ? new Date(endDate) : new Date()}
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  return {
    summary: {
      totalPOs,
      totalSpend: totalSpend._sum.totalAmount || 0,
      avgPOValue,
      pendingRequisitions,
      pendingApprovals
    },
    poByStatus,
    topVendors: topVendorsWithDetails,
    paymentStatus,
    monthlyTrend
  };
};

export const getVendorPerformance = async (tenantId, vendorId = null) => {
  const where = { tenantId };
  if (vendorId) where.vendorId = vendorId;

  const evaluations = await prisma.supplierEvaluation.groupBy({
    by: ['vendorId'],
    where,
    _avg: {
      qualityRating: true,
      deliveryRating: true,
      priceRating: true,
      serviceRating: true,
      communicationRating: true,
      overallRating: true
    },
    _count: true
  });

  // Get vendor details
  const vendorIds = evaluations.map(e => e.vendorId);
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, name: true, vendorCode: true, category: true }
  });

  return evaluations.map(ev => ({
    ...ev,
    vendor: vendors.find(v => v.id === ev.vendorId)
  }));
};
