import disbursementService from './disbursement.service.js';

class DisbursementController {
  /**
   * Create disbursements from approved payslips
   * POST /api/hr/disbursements
   */
  async createDisbursements(req, res) {
    try {
      const { payslipIds, paymentMethod } = req.body;
      const tenantId = req.user.tenantId;
      const userId = req.user.id;

      if (!payslipIds || !Array.isArray(payslipIds) || payslipIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'payslipIds array is required',
        });
      }

      const validMethods = ['BANK_TRANSFER', 'CHEQUE', 'CASH', 'UPI'];
      if (!validMethods.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: `Invalid payment method. Use: ${validMethods.join(', ')}`,
        });
      }

      const result = await disbursementService.createDisbursements(
        payslipIds,
        paymentMethod,
        tenantId,
        userId
      );

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in createDisbursements:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create disbursements',
      });
    }
  }

  /**
   * Get disbursements with filters
   * GET /api/hr/disbursements
   */
  async getDisbursements(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        status: req.query.status,
        payrollCycleId: req.query.payrollCycleId,
        employeeId: req.query.employeeId,
        paymentMethod: req.query.paymentMethod,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const result = await disbursementService.getDisbursements(filters, tenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getDisbursements:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch disbursements',
      });
    }
  }

  /**
   * Update single disbursement status
   * PATCH /api/hr/disbursements/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, transactionRef, failureReason, notes, paymentDate } = req.body;
      const tenantId = req.user.tenantId;

      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Use: ${validStatuses.join(', ')}`,
        });
      }

      const data = { transactionRef, failureReason, notes, paymentDate };

      const result = await disbursementService.updateDisbursementStatus(
        id,
        status,
        data,
        tenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error in updateStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update status',
      });
    }
  }

  /**
   * Bulk update disbursement statuses
   * PATCH /api/hr/disbursements/bulk-status
   */
  async bulkUpdateStatus(req, res) {
    try {
      const { disbursementIds, status, transactionRef, failureReason, notes } = req.body;
      const tenantId = req.user.tenantId;

      if (!disbursementIds || !Array.isArray(disbursementIds) || disbursementIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'disbursementIds array is required',
        });
      }

      const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Use: ${validStatuses.join(', ')}`,
        });
      }

      const data = { transactionRef, failureReason, notes };

      const result = await disbursementService.bulkUpdateStatus(
        disbursementIds,
        status,
        data,
        tenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error in bulkUpdateStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to bulk update statuses',
      });
    }
  }

  /**
   * Generate payment file for bank transfer
   * POST /api/hr/disbursements/generate-payment-file
   */
  async generatePaymentFile(req, res) {
    try {
      const { disbursementIds, fileFormat } = req.body;
      const tenantId = req.user.tenantId;

      if (!disbursementIds || !Array.isArray(disbursementIds) || disbursementIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'disbursementIds array is required',
        });
      }

      const validFormats = ['CSV', 'NEFT'];
      if (!validFormats.includes(fileFormat)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file format. Use: ${validFormats.join(', ')}`,
        });
      }

      const result = await disbursementService.generatePaymentFile(
        disbursementIds,
        fileFormat,
        tenantId
      );

      // Set headers for file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      res.json(result);
    } catch (error) {
      console.error('Error in generatePaymentFile:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate payment file',
      });
    }
  }

  /**
   * Reconcile payments with bank statement
   * POST /api/hr/disbursements/reconcile
   */
  async reconcilePayments(req, res) {
    try {
      const { reconciliationData } = req.body;
      const tenantId = req.user.tenantId;

      if (!reconciliationData || !Array.isArray(reconciliationData)) {
        return res.status(400).json({
          success: false,
          message: 'reconciliationData array is required',
        });
      }

      // Validate reconciliation data structure
      const requiredFields = ['employeeId', 'accountNumber', 'amount', 'transactionRef'];
      const invalidRecords = reconciliationData.filter((record) =>
        requiredFields.some((field) => !record[field])
      );

      if (invalidRecords.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Each record must have: ${requiredFields.join(', ')}`,
        });
      }

      const result = await disbursementService.reconcilePayments(
        reconciliationData,
        tenantId
      );

      res.json(result);
    } catch (error) {
      console.error('Error in reconcilePayments:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reconcile payments',
      });
    }
  }

  /**
   * Get disbursement statistics
   * GET /api/hr/disbursements/stats
   */
  async getStats(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        payrollCycleId: req.query.payrollCycleId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
      };

      const result = await disbursementService.getDisbursementStats(filters, tenantId);

      res.json(result);
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch statistics',
      });
    }
  }
}

const disbursementController = new DisbursementController();
export default disbursementController;
