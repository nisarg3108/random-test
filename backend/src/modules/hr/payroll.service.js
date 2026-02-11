import prisma from '../../config/db.js';
import SalaryComponentCalculator from '../../utils/salaryComponentCalculator.js';

class PayrollService {
  // ==========================================
  // SALARY COMPONENTS
  // ==========================================

  async createSalaryComponent(data) {
    const { tenantId, name, code, type, calculationType, value, formula, isTaxable, description } = data;
    
    return prisma.salaryComponent.create({
      data: {
        tenantId,
        name,
        code: code.toUpperCase(),
        type,
        calculationType,
        value,
        formula,
        isTaxable,
        description
      }
    });
  }

  async getSalaryComponents(tenantId, filters = {}) {
    const { type, isActive } = filters;
    const where = { tenantId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    return prisma.salaryComponent.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  async updateSalaryComponent(id, tenantId, data) {
    return prisma.salaryComponent.update({
      where: { id, tenantId },
      data
    });
  }

  // ==========================================
  // TAX CONFIGURATION
  // ==========================================

  async createTaxConfiguration(data) {
    const { tenantId, name, taxType, slabs, deductionRules, effectiveFrom, effectiveTo } = data;
    
    return prisma.taxConfiguration.create({
      data: {
        tenantId,
        name,
        taxType,
        slabs,
        deductionRules,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null
      }
    });
  }

  async getTaxConfigurations(tenantId) {
    return prisma.taxConfiguration.findMany({
      where: { tenantId, isActive: true },
      orderBy: { effectiveFrom: 'desc' }
    });
  }

  async calculateTax(annualIncome, taxType, tenantId) {
    const taxConfig = await prisma.taxConfiguration.findFirst({
      where: {
        tenantId,
        taxType,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } }
        ]
      }
    });

    if (!taxConfig) {
      return { tax: 0, effectiveRate: 0, breakdown: [] };
    }

    const slabs = taxConfig.slabs;
    let totalTax = 0;
    const breakdown = [];

    for (const slab of slabs) {
      const { min, max, rate } = slab;
      
      if (annualIncome > min) {
        const taxableAmount = Math.min(annualIncome, max || annualIncome) - min;
        const slabTax = (taxableAmount * rate) / 100;
        totalTax += slabTax;
        
        breakdown.push({
          range: `${min} - ${max || 'Above'}`,
          rate: `${rate}%`,
          taxableAmount,
          tax: slabTax
        });
        
        if (max && annualIncome <= max) break;
      }
    }

    return {
      tax: Math.round(totalTax),
      effectiveRate: annualIncome > 0 ? ((totalTax / annualIncome) * 100).toFixed(2) : 0,
      breakdown
    };
  }

  // ==========================================
  // PAYROLL CYCLE
  // ==========================================

  async createPayrollCycle(data) {
    const { tenantId, name, startDate, endDate, paymentDate, notes } = data;
    
    return prisma.payrollCycle.create({
      data: {
        tenantId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        paymentDate: new Date(paymentDate),
        notes
      }
    });
  }

  async getPayrollCycles(tenantId, filters = {}) {
    const { status } = filters;
    const where = { tenantId };
    if (status) where.status = status;

    return prisma.payrollCycle.findMany({
      where,
      include: {
        _count: {
          select: {
            payslips: true,
            disbursements: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPayrollCycleById(id, tenantId) {
    return prisma.payrollCycle.findFirst({
      where: { id, tenantId },
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                employeeCode: true,
                designation: true
              }
            }
          }
        },
        disbursements: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                employeeCode: true
              }
            }
          }
        }
      }
    });
  }

  // ==========================================
  // PAYSLIP GENERATION
  // ==========================================

  async generatePayslips(cycleId, tenantId, processedBy) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: cycleId, tenantId }
    });

    if (!cycle) {
      throw new Error('Payroll cycle not found');
    }

    if (cycle.status !== 'DRAFT') {
      throw new Error('Payroll cycle is not in DRAFT status');
    }

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        tenantId,
        status: 'ACTIVE'
      },
      include: {
        salaryStructure: true
      }
    });

    const payslips = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const employee of employees) {
      if (!employee.salaryStructure) continue;

      // Calculate working days
      const workingDays = Math.ceil(
        (cycle.endDate - cycle.startDate) / (1000 * 60 * 60 * 24)
      );

      // Fetch actual attendance data for the cycle period
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          tenantId,
          date: {
            gte: cycle.startDate,
            lte: cycle.endDate
          }
        }
      });

      // Calculate attendance statistics
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let halfDays = 0;
      let totalOvertimeHours = 0;

      attendanceRecords.forEach(record => {
        switch (record.status) {
          case 'PRESENT':
          case 'WORK_FROM_HOME':
            presentDays++;
            break;
          case 'ABSENT':
            absentDays++;
            break;
          case 'LEAVE':
            leaveDays++;
            break;
          case 'HALF_DAY':
            halfDays++;
            presentDays += 0.5;
            absentDays += 0.5;
            break;
        }
        
        // Sum overtime hours
        if (record.overtimeHours) {
          totalOvertimeHours += record.overtimeHours;
        }
      });

      // If no attendance records, assume full presence (backward compatibility)
      if (attendanceRecords.length === 0) {
        presentDays = workingDays;
        absentDays = 0;
        leaveDays = 0;
      }

      // Get basic salary from employee's salary structure
      const { basicSalary } = employee.salaryStructure;
      
      // Pro-rate basic salary by attendance
      const dailyBasic = basicSalary / 30;
      const calculatedBasic = dailyBasic * presentDays;
      
      // Calculate overtime pay (2x hourly rate)
      const hourlyRate = basicSalary / 30 / 8;
      const overtimePay = totalOvertimeHours * hourlyRate * 2;
      
      // Fetch active salary components for this tenant
      const salaryComponents = await prisma.salaryComponent.findMany({
        where: {
          tenantId,
          isActive: true
        }
      });

      // Calculate all components dynamically using the formula engine
      const componentResults = SalaryComponentCalculator.calculateAllComponents(
        salaryComponents,
        {
          basicSalary: calculatedBasic,
          presentDays,
          workingDays,
          overtimeHours: totalOvertimeHours,
          employeeId: employee.id
        }
      );

      const grossSalary = calculatedBasic + componentResults.allowancesTotal + componentResults.bonusesTotal + overtimePay;
      
      // Calculate tax on the gross salary
      const annualIncome = grossSalary * 12;
      const taxResult = await this.calculateTax(annualIncome, 'INCOME_TAX', tenantId);
      const monthlyTax = taxResult.tax / 12;
      
      const totalDeduction = componentResults.deductionsTotal + monthlyTax;
      const netSalary = grossSalary - totalDeduction;
      
      // Generate payslip number
      const payslipNumber = `PAY-${cycle.name.replace(/\s/g, '-')}-${employee.employeeCode}`;
      
      // Separate PF and Insurance for backward compatibility fields
      const pfDeduction = componentResults.deductions.PF || componentResults.deductions.PROVIDENT_FUND || 0;
      const insuranceDeduction = componentResults.deductions.INSURANCE || componentResults.deductions.ESI || 0;
      
      const payslip = await prisma.payslip.create({
        data: {
          tenantId,
          employeeId: employee.id,
          payrollCycleId: cycleId,
          payslipNumber,
          basicSalary: calculatedBasic,
          allowances: componentResults.allowances,
          bonuses: componentResults.bonusesTotal,
          overtime: overtimePay,
          grossSalary,
          taxDeductions: monthlyTax,
          providentFund: pfDeduction,
          insurance: insuranceDeduction,
          otherDeductions: componentResults.deductions,
          totalDeductions: totalDeduction,
          netSalary,
          workingDays,
          presentDays: Math.round(presentDays * 10) / 10, // Round to 1 decimal
          absentDays: Math.round(absentDays * 10) / 10,
          leaveDays,
          overtimeHours: totalOvertimeHours
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              designation: true
            }
          }
        }
      });
      
      payslips.push(payslip);
      totalGross += grossSalary;
      totalDeductions += totalDeduction;
      totalNet += netSalary;
    }

    // Update payroll cycle
    await prisma.payrollCycle.update({
      where: { id: cycleId },
      data: {
        status: 'PROCESSING',
        totalGross,
        totalDeductions,
        totalNet,
        processedBy,
        processedAt: new Date()
      }
    });

    return {
      cycle: await this.getPayrollCycleById(cycleId, tenantId),
      payslips,
      summary: {
        totalEmployees: payslips.length,
        totalGross,
        totalDeductions,
        totalNet
      }
    };
  }

  async getPayslips(tenantId, filters = {}) {
    const { employeeId, payrollCycleId, status } = filters;
    const where = { tenantId };
    if (employeeId) where.employeeId = employeeId;
    if (payrollCycleId) where.payrollCycleId = payrollCycleId;
    if (status) where.status = status;

    return prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            designation: true,
            email: true
          }
        },
        payrollCycle: {
          select: {
            id: true,
            name: true,
            paymentDate: true
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    });
  }

  async getPayslipById(id, tenantId) {
    return prisma.payslip.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            designation: true,
            email: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        payrollCycle: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            paymentDate: true
          }
        }
      }
    });
  }

  async approvePayslip(id, tenantId, approvedBy) {
    return prisma.payslip.update({
      where: { id, tenantId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      }
    });
  }

  // ==========================================
  // SALARY DISBURSEMENT
  // ==========================================

  async createDisbursements(cycleId, tenantId) {
    const cycle = await prisma.payrollCycle.findFirst({
      where: { id: cycleId, tenantId },
      include: {
        payslips: {
          where: { status: 'APPROVED' },
          include: {
            employee: true
          }
        }
      }
    });

    if (!cycle) {
      throw new Error('Payroll cycle not found');
    }

    const disbursements = [];

    for (const payslip of cycle.payslips) {
      const disbursement = await prisma.salaryDisbursement.create({
        data: {
          tenantId,
          payrollCycleId: cycleId,
          employeeId: payslip.employeeId,
          amount: payslip.netSalary,
          paymentMethod: 'BANK_TRANSFER',
          paymentDate: cycle.paymentDate
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              email: true
            }
          }
        }
      });
      
      disbursements.push(disbursement);
    }

    return disbursements;
  }

  async getDisbursements(tenantId, filters = {}) {
    const { payrollCycleId, employeeId, status } = filters;
    const where = { tenantId };
    if (payrollCycleId) where.payrollCycleId = payrollCycleId;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    return prisma.salaryDisbursement.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true
          }
        },
        payrollCycle: {
          select: {
            id: true,
            name: true,
            paymentDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateDisbursementStatus(id, tenantId, data) {
    const { status, transactionRef, bankAccount, failureReason } = data;
    
    const updateData = { status };
    if (transactionRef) updateData.transactionRef = transactionRef;
    if (bankAccount) updateData.bankAccount = bankAccount;
    if (failureReason) updateData.failureReason = failureReason;
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      
      // Update payslip status
      const disbursement = await prisma.salaryDisbursement.findFirst({
        where: { id, tenantId },
        include: { payrollCycle: { include: { payslips: true } } }
      });
      
      if (disbursement) {
        const payslip = disbursement.payrollCycle.payslips.find(
          p => p.employeeId === disbursement.employeeId
        );
        
        if (payslip) {
          await prisma.payslip.update({
            where: { id: payslip.id },
            data: { status: 'PAID' }
          });
        }
      }
    }
    
    return prisma.salaryDisbursement.update({
      where: { id, tenantId },
      data: updateData
    });
  }

  // ==========================================
  // REPORTS & ANALYTICS
  // ==========================================

  async getPayrollSummary(tenantId, startDate, endDate) {
    const payslips = await prisma.payslip.findMany({
      where: {
        tenantId,
        generatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    return {
      totalEmployees: payslips.length,
      totalGrossSalary: payslips.reduce((sum, p) => sum + p.grossSalary, 0),
      totalDeductions: payslips.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetSalary: payslips.reduce((sum, p) => sum + p.netSalary, 0),
      totalTax: payslips.reduce((sum, p) => sum + p.taxDeductions, 0),
      totalPF: payslips.reduce((sum, p) => sum + p.providentFund, 0),
      averageSalary: payslips.length > 0 
        ? payslips.reduce((sum, p) => sum + p.netSalary, 0) / payslips.length 
        : 0
    };
  }
}

export default new PayrollService();
