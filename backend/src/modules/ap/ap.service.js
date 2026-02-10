import prisma from '../../config/db.js';
import ExcelJS from 'exceljs';
import { deleteFile } from '../../config/upload.js';

// ==================== AP BILLS ====================

export const listBills = async (tenantId, filters = {}) => {
  const where = { tenantId };
  
  if (filters.status) where.status = filters.status;
  if (filters.approvalStatus) where.approvalStatus = filters.approvalStatus;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.overdue === 'true') {
    where.dueDate = { lt: new Date() };
    where.status = { in: ['PENDING', 'PARTIALLY_PAID', 'APPROVED'] };
  }

  // Pagination support
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 50;
  const skip = (page - 1) * limit;

  const [bills, total] = await Promise.all([
    prisma.aPBill.findMany({
      where,
      orderBy: { billDate: 'desc' },
      skip,
      take: limit,
      include: {
        vendor: true,
        purchaseOrder: true
      }
    }),
    prisma.aPBill.count({ where })
  ]);

  return {
    data: bills,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getBillById = async (id, tenantId) => {
  return await prisma.aPBill.findFirst({
    where: { id, tenantId },
    include: {
      vendor: true,
      purchaseOrder: {
        include: {
          receipts: true
        }
      }
    }
  });
};

export const createBill = async (data, tenantId, userId) => {
  // Generate unique bill number
  const billCount = await prisma.aPBill.count({ where: { tenantId } });
  const billNumber = `BILL-${String(billCount + 1).padStart(6, '0')}`;

  // Calculate balance amount
  const balanceAmount = data.totalAmount - (data.paidAmount || 0);

  // Determine status based on amounts
  let status = 'PENDING';
  if (data.paidAmount > 0 && data.paidAmount < data.totalAmount) {
    status = 'PARTIALLY_PAID';
  } else if (data.paidAmount >= data.totalAmount) {
    status = 'PAID';
  }

  // Check if overdue
  if (new Date(data.dueDate) < new Date() && status !== 'PAID') {
    status = 'OVERDUE';
  }

  const bill = await prisma.aPBill.create({
    data: {
      ...data,
      billNumber,
      balanceAmount,
      status,
      createdBy: userId,
      tenantId
    },
    include: {
      vendor: true,
      purchaseOrder: true
    }
  });

  // If linked to PO, update PO payment status
  if (data.purchaseOrderId) {
    await updatePOPaymentStatus(data.purchaseOrderId);
  }

  return bill;
};

export const updateBill = async (id, data, tenantId) => {
  // Recalculate balance if amounts changed
  if (data.totalAmount !== undefined || data.paidAmount !== undefined) {
    const currentBill = await prisma.aPBill.findFirst({ where: { id, tenantId } });
    const totalAmount = data.totalAmount !== undefined ? data.totalAmount : currentBill.totalAmount;
    const paidAmount = data.paidAmount !== undefined ? data.paidAmount : currentBill.paidAmount;
    
    data.balanceAmount = totalAmount - paidAmount;

    // Update status based on amounts
    if (paidAmount === 0) {
      data.status = 'PENDING';
    } else if (paidAmount > 0 && paidAmount < totalAmount) {
      data.status = 'PARTIALLY_PAID';
    } else if (paidAmount >= totalAmount) {
      data.status = 'PAID';
    }

    // Check if overdue
    const dueDate = data.dueDate || currentBill.dueDate;
    if (new Date(dueDate) < new Date() && data.status !== 'PAID') {
      data.status = 'OVERDUE';
    }
  }

  const bill = await prisma.aPBill.update({
    where: { id, tenantId },
    data,
    include: {
      vendor: true,
      purchaseOrder: true
    }
  });

  // Update PO payment status if linked
  if (bill.purchaseOrderId) {
    await updatePOPaymentStatus(bill.purchaseOrderId);
  }

  return bill;
};

export const deleteBill = async (id, tenantId) => {
  // Check if bill has payments by checking if paidAmount > 0
  const bill = await prisma.aPBill.findFirst({
    where: { id, tenantId }
  });

  if (bill.paidAmount > 0) {
    throw new Error('Cannot delete bill with existing payments');
  }

  const purchaseOrderId = bill.purchaseOrderId;

  await prisma.aPBill.delete({
    where: { id, tenantId }
  });

  // Update PO payment status if was linked
  if (purchaseOrderId) {
    await updatePOPaymentStatus(purchaseOrderId);
  }

  return bill;
};

export const approveBill = async (id, tenantId, userId) => {
  return await prisma.aPBill.update({
    where: { id, tenantId },
    data: {
      approvalStatus: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date()
    }
  });
};

export const rejectBill = async (id, tenantId, userId, reason) => {
  return await prisma.aPBill.update({
    where: { id, tenantId },
    data: {
      approvalStatus: 'REJECTED',
      approvedBy: userId,
      approvedAt: new Date(),
      notes: reason
    }
  });
};

// Three-way matching: PO <-> Receipt <-> Bill
export const performThreeWayMatch = async (billId, tenantId) => {
  const bill = await prisma.aPBill.findFirst({
    where: { id: billId, tenantId },
    include: {
      purchaseOrder: {
        include: {
          receipts: true
        }
      }
    }
  });

  if (!bill) {
    throw new Error('Bill not found');
  }

  if (!bill.purchaseOrderId) {
    throw new Error('Bill is not linked to a purchase order');
  }

  const po = bill.purchaseOrder;
  const receipts = po.receipts;

  // Check if PO exists
  const matchedToPO = !!po;

  // Check if receipts exist
  const matchedToReceipt = receipts && receipts.length > 0;

  // Perform matching logic
  let threeWayMatched = false;
  if (matchedToPO && matchedToReceipt) {
    // Compare bill items with PO items and receipt items
    // For MVP, we'll just check if amounts are within tolerance
    const tolerance = 0.05; // 5% tolerance
    const billAmount = bill.totalAmount;
    const poAmount = po.totalAmount;
    
    const difference = Math.abs(billAmount - poAmount);
    const percentDiff = difference / poAmount;

    threeWayMatched = percentDiff <= tolerance;
  }

  // Update bill matching status
  await prisma.aPBill.update({
    where: { id: billId },
    data: {
      matchedToPO,
      matchedToReceipt,
      threeWayMatched
    }
  });

  return {
    matched: threeWayMatched,
    matchedToPO,
    matchedToReceipt,
    message: threeWayMatched 
      ? 'Three-way match successful' 
      : 'Three-way match failed - amounts do not match within tolerance'
  };
};

// Helper function to update PO payment status based on bills
const updatePOPaymentStatus = async (purchaseOrderId) => {
  const bills = await prisma.aPBill.findMany({
    where: { purchaseOrderId }
  });

  if (bills.length === 0) return;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId }
  });

  const totalBilled = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);

  let paymentStatus = 'UNPAID';
  if (totalPaid > 0 && totalPaid < po.totalAmount) {
    paymentStatus = 'PARTIAL';
  } else if (totalPaid >= po.totalAmount) {
    paymentStatus = 'PAID';
  }

  await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { 
      paymentStatus,
      paidAmount: totalPaid
    }
  });
};

// ==================== PAYMENTS ====================

export const listPayments = async (tenantId, filters = {}) => {
  const where = { tenantId };
  
  if (filters.status) where.status = filters.status;
  if (filters.vendorId) where.vendorId = filters.vendorId;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

  // Pagination support
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 50;
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit,
      include: {
        vendor: true
      }
    }),
    prisma.payment.count({ where })
  ]);

  return {
    data: payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getPaymentById = async (id, tenantId) => {
  return await prisma.payment.findFirst({
    where: { id, tenantId },
    include: {
      vendor: true
    }
  });
};

export const createPayment = async (data, tenantId, userId) => {
  // Generate unique payment number
  const paymentCount = await prisma.payment.count({ where: { tenantId } });
  const paymentNumber = `PAY-${String(paymentCount + 1).padStart(6, '0')}`;

  const payment = await prisma.payment.create({
    data: {
      ...data,
      paymentNumber,
      createdBy: userId,
      tenantId
    },
    include: {
      vendor: true
    }
  });

  // Process allocations to bills
  if (data.allocations && data.allocations.length > 0) {
    await processPaymentAllocations(payment.id, data.allocations, tenantId);
  }

  return payment;
};

export const updatePayment = async (id, data, tenantId) => {
  const currentPayment = await prisma.payment.findFirst({ where: { id, tenantId } });

  const payment = await prisma.payment.update({
    where: { id, tenantId },
    data,
    include: {
      vendor: true
    }
  });

  // Reprocess allocations if changed
  if (data.allocations) {
    // Reverse old allocations
    if (currentPayment.allocations) {
      await reversePaymentAllocations(currentPayment.allocations, tenantId);
    }
    // Apply new allocations
    await processPaymentAllocations(id, data.allocations, tenantId);
  }

  return payment;
};

export const deletePayment = async (id, tenantId) => {
  const payment = await prisma.payment.findFirst({
    where: { id, tenantId }
  });

  // Reverse allocations
  if (payment.allocations) {
    await reversePaymentAllocations(payment.allocations, tenantId);
  }

  await prisma.payment.delete({
    where: { id, tenantId }
  });

  return payment;
};

// Process payment allocations to bills
const processPaymentAllocations = async (paymentId, allocations, tenantId) => {
  for (const allocation of allocations) {
    const bill = await prisma.aPBill.findFirst({
      where: { id: allocation.billId, tenantId }
    });

    if (bill) {
      const newPaidAmount = bill.paidAmount + allocation.allocatedAmount;
      await prisma.aPBill.update({
        where: { id: bill.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: bill.totalAmount - newPaidAmount
        }
      });

      // Update PO payment status if bill is linked to PO
      if (bill.purchaseOrderId) {
        await updatePOPaymentStatus(bill.purchaseOrderId);
      }
    }
  }
};

// Reverse payment allocations (for payment deletion/update)
const reversePaymentAllocations = async (allocations, tenantId) => {
  for (const allocation of allocations) {
    const bill = await prisma.aPBill.findFirst({
      where: { id: allocation.billId, tenantId }
    });

    if (bill) {
      const newPaidAmount = bill.paidAmount - allocation.allocatedAmount;
      await prisma.aPBill.update({
        where: { id: bill.id },
        data: {
          paidAmount: Math.max(0, newPaidAmount),
          balanceAmount: bill.totalAmount - Math.max(0, newPaidAmount)
        }
      });

      // Update PO payment status if bill is linked to PO
      if (bill.purchaseOrderId) {
        await updatePOPaymentStatus(bill.purchaseOrderId);
      }
    }
  }
};

// ==================== ANALYTICS & REPORTS ====================

export const getAPAnalytics = async (tenantId, startDate, endDate) => {
  const where = {
    tenantId,
    billDate: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined
    }
  };

  // Total Bills
  const totalBills = await prisma.aPBill.count({ where });
  
  // Total Amount
  const amountAgg = await prisma.aPBill.aggregate({
    where,
    _sum: {
      totalAmount: true,
      paidAmount: true,
      balanceAmount: true
    }
  });

  // Bills by Status
  const billsByStatus = await prisma.aPBill.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
    _sum: { totalAmount: true }
  });

  // Top Vendors by Amount
  const topVendors = await prisma.aPBill.groupBy({
    by: ['vendorId'],
    where,
    _sum: { totalAmount: true },
    _count: { id: true },
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: 10
  });

  // Get vendor details for top vendors
  const vendorIds = topVendors.map(v => v.vendorId);
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, name: true, vendorCode: true }
  });

  const topVendorsWithDetails = topVendors.map(tv => ({
    ...tv,
    vendor: vendors.find(v => v.id === tv.vendorId)
  }));

  // Monthly Trends
  const monthlyTrends = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "billDate") as month,
      COUNT(*)::int as count,
      SUM("totalAmount")::float as total,
      SUM("paidAmount")::float as paid,
      SUM("balanceAmount")::float as balance
    FROM "APBill"
    WHERE "tenantId" = ${tenantId}
      AND "billDate" >= ${startDate || new Date('2000-01-01')}
      AND "billDate" <= ${endDate || new Date()}
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  return {
    totalBills,
    totalAmount: amountAgg._sum.totalAmount || 0,
    totalPaid: amountAgg._sum.paidAmount || 0,
    totalBalance: amountAgg._sum.balanceAmount || 0,
    billsByStatus,
    topVendors: topVendorsWithDetails,
    monthlyTrends
  };
};

export const getAgingReport = async (tenantId, asOfDate = new Date()) => {
  const bills = await prisma.aPBill.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'APPROVED', 'OVERDUE'] },
      balanceAmount: { gt: 0 }
    },
    include: {
      vendor: true
    }
  });

  const asOf = new Date(asOfDate);
  
  // Group bills by aging buckets
  const agingBuckets = {
    current: [],      // Not yet due
    days_1_30: [],    // 1-30 days overdue
    days_31_60: [],   // 31-60 days overdue
    days_61_90: [],   // 61-90 days overdue
    days_91_plus: []  // 91+ days overdue
  };

  bills.forEach(bill => {
    const dueDate = new Date(bill.dueDate);
    const daysOverdue = Math.floor((asOf - dueDate) / (1000 * 60 * 60 * 24));

    if (daysOverdue < 0) {
      agingBuckets.current.push(bill);
    } else if (daysOverdue <= 30) {
      agingBuckets.days_1_30.push(bill);
    } else if (daysOverdue <= 60) {
      agingBuckets.days_31_60.push(bill);
    } else if (daysOverdue <= 90) {
      agingBuckets.days_61_90.push(bill);
    } else {
      agingBuckets.days_91_plus.push(bill);
    }
  });

  // Calculate totals per bucket
  const summary = {};
  Object.keys(agingBuckets).forEach(bucket => {
    summary[bucket] = {
      count: agingBuckets[bucket].length,
      total: agingBuckets[bucket].reduce((sum, bill) => sum + bill.balanceAmount, 0)
    };
  });

  return {
    asOfDate: asOf,
    bills: agingBuckets,
    summary,
    totalOutstanding: bills.reduce((sum, bill) => sum + bill.balanceAmount, 0),
    totalBills: bills.length
  };
};

export const getVendorStatement = async (vendorId, tenantId, startDate, endDate) => {
  const where = {
    vendorId,
    tenantId,
    billDate: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined
    }
  };

  const bills = await prisma.aPBill.findMany({
    where,
    orderBy: { billDate: 'asc' },
    include: {
      payments: true,
      purchaseOrder: true
    }
  });

  const payments = await prisma.payment.findMany({
    where: {
      vendorId,
      tenantId,
      paymentDate: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined
      }
    },
    orderBy: { paymentDate: 'asc' }
  });

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId }
  });

  // Calculate balances
  const totalBilled = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
  const balance = totalBilled - totalPaid;

  return {
    vendor,
    period: { startDate, endDate },
    bills,
    payments,
    summary: {
      totalBilled,
      totalPaid,
      balance,
      billCount: bills.length,
      paymentCount: payments.length
    }
  };
};

// ==================== ATTACHMENTS ====================

export const addBillAttachment = async (billId, tenantId, file) => {
  const bill = await prisma.aPBill.findFirst({
    where: { id: billId, tenantId }
  });

  if (!bill) {
    throw new Error('Bill not found');
  }

  const attachments = bill.attachments || [];
  const newAttachment = {
    id: Date.now().toString(),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path,
    uploadedAt: new Date().toISOString()
  };

  attachments.push(newAttachment);

  await prisma.aPBill.update({
    where: { id: billId },
    data: { attachments }
  });

  return newAttachment;
};

export const addPaymentAttachment = async (paymentId, tenantId, file) => {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId }
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  const attachments = payment.attachments || [];
  const newAttachment = {
    id: Date.now().toString(),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    path: file.path,
    uploadedAt: new Date().toISOString()
  };

  attachments.push(newAttachment);

  await prisma.payment.update({
    where: { id: paymentId },
    data: { attachments }
  });

  return newAttachment;
};

export const deleteBillAttachment = async (billId, tenantId, attachmentId) => {
  const bill = await prisma.aPBill.findFirst({
    where: { id: billId, tenantId }
  });

  if (!bill) {
    throw new Error('Bill not found');
  }

  const attachments = bill.attachments || [];
  const attachment = attachments.find(a => a.id === attachmentId);
  
  if (attachment) {
    // Delete physical file
    deleteFile(attachment.filename);
    
    // Remove from database
    const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
    await prisma.aPBill.update({
      where: { id: billId },
      data: { attachments: updatedAttachments }
    });
  }
};

export const deletePaymentAttachment = async (paymentId, tenantId, attachmentId) => {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId }
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  const attachments = payment.attachments || [];
  const attachment = attachments.find(a => a.id === attachmentId);
  
  if (attachment) {
    // Delete physical file
    deleteFile(attachment.filename);
    
    // Remove from database
    const updatedAttachments = attachments.filter(a => a.id !== attachmentId);
    await prisma.payment.update({
      where: { id: paymentId },
      data: { attachments: updatedAttachments }
    });
  }
};

// ==================== EXCEL EXPORT ====================

export const exportAgingReportToExcel = async (tenantId, asOfDate = new Date()) => {
  const report = await getAgingReport(tenantId, asOfDate);
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ERP System';
  workbook.created = new Date();

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Aging Bucket', key: 'bucket', width: 20 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Bill Count', key: 'count', width: 12 }
  ];

  summarySheet.addRow({ bucket: 'Current (Not Due)', amount: report.summary.current.total, count: report.summary.current.count });
  summarySheet.addRow({ bucket: '1-30 Days Overdue', amount: report.summary.days_1_30.total, count: report.summary.days_1_30.count });
  summarySheet.addRow({ bucket: '31-60 Days Overdue', amount: report.summary.days_31_60.total, count: report.summary.days_31_60.count });
  summarySheet.addRow({ bucket: '61-90 Days Overdue', amount: report.summary.days_61_90.total, count: report.summary.days_61_90.count });
  summarySheet.addRow({ bucket: '90+ Days Overdue', amount: report.summary.days_91_plus.total, count: report.summary.days_91_plus.count });
  summarySheet.addRow({ bucket: '', amount: '', count: '' });
  summarySheet.addRow({ bucket: 'TOTAL', amount: report.totalOutstanding, count: report.totalBills });

  // Style summary sheet
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(7).font = { bold: true };
  summarySheet.getColumn('amount').numFmt = '$#,##0.00';

  // Details Sheet
  const detailsSheet = workbook.addWorksheet('Bill Details');
  detailsSheet.columns = [
    { header: 'Bill Number', key: 'billNumber', width: 15 },
    { header: 'Vendor', key: 'vendor', width: 25 },
    { header: 'Invoice Number', key: 'invoiceNumber', width: 15 },
    { header: 'Bill Date', key: 'billDate', width: 12 },
    { header: 'Due Date', key: 'dueDate', width: 12 },
    { header: 'Days Overdue', key: 'daysOverdue', width: 12 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Paid Amount', key: 'paidAmount', width: 15 },
    { header: 'Balance', key: 'balance', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];

  // Add all bills
  const allBills = [
    ...report.bills.current,
    ...report.bills.days_1_30,
    ...report.bills.days_31_60,
    ...report.bills.days_61_90,
    ...report.bills.days_91_plus
  ];

  const asOf = new Date(asOfDate);
  allBills.forEach(bill => {
    const dueDate = new Date(bill.dueDate);
    const daysOverdue = Math.floor((asOf - dueDate) / (1000 * 60 * 60 * 24));

    detailsSheet.addRow({
      billNumber: bill.billNumber,
      vendor: bill.vendor?.name || 'N/A',
      invoiceNumber: bill.invoiceNumber || 'N/A',
      billDate: new Date(bill.billDate).toLocaleDateString(),
      dueDate: dueDate.toLocaleDateString(),
      daysOverdue: daysOverdue,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      balance: bill.balanceAmount,
      status: bill.status
    });
  });

  // Style details sheet
  detailsSheet.getRow(1).font = { bold: true };
  detailsSheet.getColumn('totalAmount').numFmt = '$#,##0.00';
  detailsSheet.getColumn('paidAmount').numFmt = '$#,##0.00';
  detailsSheet.getColumn('balance').numFmt = '$#,##0.00';

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// ==================== EMAIL NOTIFICATIONS ====================

export const getOverdueBills = async (tenantId) => {
  const bills = await prisma.aPBill.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'APPROVED'] },
      dueDate: { lt: new Date() }
    },
    include: {
      vendor: true
    },
    orderBy: { dueDate: 'asc' }
  });

  return bills;
};
