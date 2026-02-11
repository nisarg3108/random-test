import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class DisbursementService {
  /**
   * Create disbursement records from approved payslips
   */
  async createDisbursements(payslipIds, paymentMethod, tenantId, userId) {
    try {
      // Fetch approved payslips
      const payslips = await prisma.payslip.findMany({
        where: {
          id: { in: payslipIds },
          tenantId,
          status: 'APPROVED',
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              name: true,
              email: true,
            },
          },
          payrollCycle: true,
        },
      });

      if (payslips.length === 0) {
        throw new Error('No approved payslips found');
      }

      // Create disbursement records
      const disbursements = await Promise.all(
        payslips.map(async (payslip) => {
          // Check if disbursement already exists
          const existing = await prisma.salaryDisbursement.findFirst({
            where: {
              tenantId,
              payrollCycleId: payslip.payrollCycleId,
              employeeId: payslip.employeeId,
            },
          });

          if (existing) {
            return existing;
          }

          // Create new disbursement
          return prisma.salaryDisbursement.create({
            data: {
              tenantId,
              payrollCycleId: payslip.payrollCycleId,
              employeeId: payslip.employeeId,
              amount: payslip.netSalary,
              paymentMethod,
              bankAccount: null, // Bank details will be set during payment file generation
              status: 'PENDING',
              notes: `Disbursement for ${new Date(payslip.payrollCycle.startDate).toLocaleDateString()} - ${new Date(payslip.payrollCycle.endDate).toLocaleDateString()}`,
            },
          });
        })
      );

      return {
        success: true,
        message: `Created ${disbursements.length} disbursement record(s)`,
        disbursements,
      };
    } catch (error) {
      console.error('Error creating disbursements:', error);
      throw error;
    }
  }

  /**
   * Update disbursement status
   */
  async updateDisbursementStatus(disbursementId, status, data, tenantId) {
    try {
      const updateData = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'PROCESSING') {
        updateData.paymentDate = data.paymentDate || new Date();
      }

      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.transactionRef = data.transactionRef;
        
        // Update related payslip status to PAID
        const disbursement = await prisma.salaryDisbursement.findUnique({
          where: { id: disbursementId },
        });

        if (disbursement) {
          await prisma.payslip.updateMany({
            where: {
              tenantId,
              payrollCycleId: disbursement.payrollCycleId,
              employeeId: disbursement.employeeId,
            },
            data: { status: 'PAID' },
          });
        }
      }

      if (status === 'FAILED') {
        updateData.failureReason = data.failureReason;
      }

      if (data.notes) {
        updateData.notes = data.notes;
      }

      const disbursement = await prisma.salaryDisbursement.update({
        where: { id: disbursementId, tenantId },
        data: updateData,
        include: {
          employee: {
            select: {
              employeeCode: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        message: `Disbursement status updated to ${status}`,
        disbursement,
      };
    } catch (error) {
      console.error('Error updating disbursement status:', error);
      throw error;
    }
  }

  /**
   * Bulk update disbursement statuses
   */
  async bulkUpdateStatus(disbursementIds, status, data, tenantId) {
    try {
      const results = await Promise.all(
        disbursementIds.map((id) =>
          this.updateDisbursementStatus(id, status, data, tenantId)
        )
      );

      return {
        success: true,
        message: `Updated ${results.length} disbursement(s)`,
        results,
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  /**
   * Get disbursements with filters
   */
  async getDisbursements(filters, tenantId) {
    try {
      const where = { tenantId };

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.payrollCycleId) {
        where.payrollCycleId = filters.payrollCycleId;
      }

      if (filters.employeeId) {
        where.employeeId = filters.employeeId;
      }

      if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
      }

      if (filters.dateFrom) {
        where.createdAt = { gte: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
      }

      const disbursements = await prisma.salaryDisbursement.findMany({
        where,
        include: {
          employee: {
            select: {
              employeeCode: true,
              name: true,
              email: true,
            },
          },
          payrollCycle: {
            select: {
              startDate: true,
              endDate: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate summary statistics
      const summary = {
        total: disbursements.length,
        totalAmount: disbursements.reduce((sum, d) => sum + d.amount, 0),
        byStatus: {},
        byPaymentMethod: {},
      };

      disbursements.forEach((d) => {
        summary.byStatus[d.status] = (summary.byStatus[d.status] || 0) + 1;
        summary.byPaymentMethod[d.paymentMethod] =
          (summary.byPaymentMethod[d.paymentMethod] || 0) + 1;
      });

      return {
        success: true,
        disbursements,
        summary,
      };
    } catch (error) {
      console.error('Error fetching disbursements:', error);
      throw error;
    }
  }

  /**
   * Generate payment file for bank transfer (NEFT/RTGS format)
   */
  async generatePaymentFile(disbursementIds, fileFormat, tenantId) {
    try {
      const disbursements = await prisma.salaryDisbursement.findMany({
        where: {
          id: { in: disbursementIds },
          tenantId,
          status: 'PENDING',
          paymentMethod: 'BANK_TRANSFER',
        },
        include: {
          employee: {
            select: {
              employeeCode: true,
              name: true,
            },
          },
          payrollCycle: true,
        },
      });

      if (disbursements.length === 0) {
        throw new Error('No valid disbursements found for payment file generation');
      }

      // Validate bank details (will warn but allow creation)
      const invalidRecords = disbursements.filter(
        (d) => !d.bankAccount || !d.transactionRef
      );

      if (invalidRecords.length > 0) {
        console.warn(`⚠️ Warning: ${invalidRecords.length} records have missing bank details. These will need to be updated before generating payment files.`);
      }

      // Generate file based on format
      let fileContent;
      let filename;
      const timestamp = new Date().toISOString().split('T')[0];

      if (fileFormat === 'CSV') {
        fileContent = this.generateCSVFile(disbursements);
        filename = `salary_payment_${timestamp}.csv`;
      } else if (fileFormat === 'NEFT') {
        fileContent = this.generateNEFTFile(disbursements);
        filename = `neft_payment_${timestamp}.txt`;
      } else {
        throw new Error('Invalid file format. Use CSV or NEFT');
      }

      // Mark disbursements as PROCESSING
      await prisma.salaryDisbursement.updateMany({
        where: { id: { in: disbursementIds }, tenantId },
        data: {
          status: 'PROCESSING',
          paymentDate: new Date(),
        },
      });

      return {
        success: true,
        message: `Generated payment file for ${disbursements.length} records`,
        filename,
        fileContent,
        recordCount: disbursements.length,
        totalAmount: disbursements.reduce((sum, d) => sum + d.amount, 0),
      };
    } catch (error) {
      console.error('Error generating payment file:', error);
      throw error;
    }
  }

  /**
   * Generate CSV format payment file
   */
  generateCSVFile(disbursements) {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Bank Account',
      'IFSC Code',
      'Bank Name',
      'Amount',
      'Email',
      'Narration',
    ];

    const rows = disbursements.map((d) => [
      d.employee.employeeCode,
      d.employee.name,
      d.bankAccount || 'N/A',
      'N/A', // IFSC Code (not stored)
      'N/A', // Bank Name (not stored)
      d.amount.toFixed(2),
      d.employee.email || '',
      `Salary for ${d.payrollCycle.name}`,
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Generate NEFT format payment file (based on common bank format)
   */
  generateNEFTFile(disbursements) {
    const lines = [];
    
    // Header
    lines.push('H|SALARY|' + new Date().toISOString().split('T')[0] + '|' + disbursements.length);
    
    // Detail records
    disbursements.forEach((d, index) => {
      const record = [
        'D',                                                          // Record Type
        (index + 1).toString().padStart(5, '0'),                     // Serial Number
        (d.bankAccount || 'PENDING').padEnd(20, ' '),                // Account Number
        'PENDING'.padEnd(11, ' '),                                   // IFSC Code (not stored)
        d.employee.name.padEnd(40, ' '),                             // Beneficiary Name
        d.amount.toFixed(2).padStart(15, '0'),                       // Amount
        d.employee.email ? d.employee.email.padEnd(50, ' ') : ''.padEnd(50, ' '), // Email
        `SAL ${d.payrollCycle.name}`.padEnd(30, ' '),               // Narration
      ].join('|');
      
      lines.push(record);
    });
    
    // Trailer
    const totalAmount = disbursements.reduce((sum, d) => sum + d.amount, 0);
    lines.push('T|' + disbursements.length + '|' + totalAmount.toFixed(2));
    
    return lines.join('\n');
  }

  /**
   * Reconcile payments with bank statement
   */
  async reconcilePayments(reconciliationData, tenantId) {
    try {
      const results = {
        success: [],
        failed: [],
        notFound: [],
      };

      for (const record of reconciliationData) {
        try {
          // Find disbursement by employee ID or account number
          const disbursement = await prisma.salaryDisbursement.findFirst({
            where: {
              tenantId,
              status: 'PROCESSING',
              employee: {
                OR: [
                  { employeeCode: record.employeeId },
                ],
              },
            },
          });

          if (!disbursement) {
            results.notFound.push(record);
            continue;
          }

          // Check if amount matches
          if (Math.abs(disbursement.amount - record.amount) > 0.01) {
            results.failed.push({
              ...record,
              reason: `Amount mismatch: Expected ${disbursement.amount}, Got ${record.amount}`,
            });
            continue;
          }

          // Update disbursement to COMPLETED
          await this.updateDisbursementStatus(
            disbursement.id,
            'COMPLETED',
            {
              transactionRef: record.transactionRef,
              notes: `Reconciled from bank statement. UTR: ${record.transactionRef}`,
            },
            tenantId
          );

          results.success.push({
            ...record,
            disbursementId: disbursement.id,
          });
        } catch (error) {
          results.failed.push({
            ...record,
            reason: error.message,
          });
        }
      }

      return {
        success: true,
        summary: {
          total: reconciliationData.length,
          reconciled: results.success.length,
          failed: results.failed.length,
          notFound: results.notFound.length,
        },
        results,
      };
    } catch (error) {
      console.error('Error reconciling payments:', error);
      throw error;
    }
  }

  /**
   * Get disbursement statistics
   */
  async getDisbursementStats(filters, tenantId) {
    try {
      const where = { tenantId };

      if (filters.payrollCycleId) {
        where.payrollCycleId = filters.payrollCycleId;
      }

      if (filters.dateFrom) {
        where.createdAt = { gte: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
      }

      const [
        totalCount,
        pendingCount,
        processingCount,
        completedCount,
        failedCount,
        totalAmount,
        disbursedAmount,
      ] = await Promise.all([
        prisma.salaryDisbursement.count({ where }),
        prisma.salaryDisbursement.count({ where: { ...where, status: 'PENDING' } }),
        prisma.salaryDisbursement.count({ where: { ...where, status: 'PROCESSING' } }),
        prisma.salaryDisbursement.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.salaryDisbursement.count({ where: { ...where, status: 'FAILED' } }),
        prisma.salaryDisbursement.aggregate({
          where,
          _sum: { amount: true },
        }),
        prisma.salaryDisbursement.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
      ]);

      return {
        success: true,
        stats: {
          total: {
            count: totalCount,
            amount: totalAmount._sum.amount || 0,
          },
          pending: {
            count: pendingCount,
          },
          processing: {
            count: processingCount,
          },
          completed: {
            count: completedCount,
            amount: disbursedAmount._sum.amount || 0,
          },
          failed: {
            count: failedCount,
          },
        },
      };
    } catch (error) {
      console.error('Error fetching disbursement stats:', error);
      throw error;
    }
  }
}

const disbursementService = new DisbursementService();
export default disbursementService;
