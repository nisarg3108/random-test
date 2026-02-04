import payrollService from './payroll.service.js';

class PayrollController {
  // ==========================================
  // ATTENDANCE
  // ==========================================

  async markAttendance(req, res) {
    try {
      const { tenantId } = req.user;
      const attendance = await payrollService.markAttendance({
        ...req.body,
        tenantId
      });
      res.json(attendance);
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAttendance(req, res) {
    try {
      const { tenantId } = req.user;
      const attendance = await payrollService.getAttendance(tenantId, req.query);
      res.json(attendance);
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getAttendanceSummary(req, res) {
    try {
      const { tenantId } = req.user;
      const { employeeId, startDate, endDate } = req.query;
      const summary = await payrollService.getAttendanceSummary(
        tenantId,
        employeeId,
        startDate,
        endDate
      );
      res.json(summary);
    } catch (error) {
      console.error('Get attendance summary error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // SALARY COMPONENTS
  // ==========================================

  async createSalaryComponent(req, res) {
    try {
      const { tenantId } = req.user;
      const component = await payrollService.createSalaryComponent({
        ...req.body,
        tenantId
      });
      res.json(component);
    } catch (error) {
      console.error('Create salary component error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSalaryComponents(req, res) {
    try {
      const { tenantId } = req.user;
      const components = await payrollService.getSalaryComponents(tenantId, req.query);
      res.json(components);
    } catch (error) {
      console.error('Get salary components error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateSalaryComponent(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const component = await payrollService.updateSalaryComponent(id, tenantId, req.body);
      res.json(component);
    } catch (error) {
      console.error('Update salary component error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // TAX CONFIGURATION
  // ==========================================

  async createTaxConfiguration(req, res) {
    try {
      const { tenantId } = req.user;
      const taxConfig = await payrollService.createTaxConfiguration({
        ...req.body,
        tenantId
      });
      res.json(taxConfig);
    } catch (error) {
      console.error('Create tax configuration error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTaxConfigurations(req, res) {
    try {
      const { tenantId } = req.user;
      const taxConfigs = await payrollService.getTaxConfigurations(tenantId);
      res.json(taxConfigs);
    } catch (error) {
      console.error('Get tax configurations error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async calculateTax(req, res) {
    try {
      const { tenantId } = req.user;
      const { annualIncome, taxType } = req.body;
      const taxResult = await payrollService.calculateTax(annualIncome, taxType, tenantId);
      res.json(taxResult);
    } catch (error) {
      console.error('Calculate tax error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // PAYROLL CYCLE
  // ==========================================

  async createPayrollCycle(req, res) {
    try {
      const { tenantId } = req.user;
      const cycle = await payrollService.createPayrollCycle({
        ...req.body,
        tenantId
      });
      res.json(cycle);
    } catch (error) {
      console.error('Create payroll cycle error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPayrollCycles(req, res) {
    try {
      const { tenantId } = req.user;
      const cycles = await payrollService.getPayrollCycles(tenantId, req.query);
      res.json(cycles);
    } catch (error) {
      console.error('Get payroll cycles error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPayrollCycleById(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const cycle = await payrollService.getPayrollCycleById(id, tenantId);
      if (!cycle) {
        return res.status(404).json({ error: 'Payroll cycle not found' });
      }
      res.json(cycle);
    } catch (error) {
      console.error('Get payroll cycle error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // PAYSLIPS
  // ==========================================

  async generatePayslips(req, res) {
    try {
      const { tenantId, userId } = req.user;
      const { cycleId } = req.params;
      const result = await payrollService.generatePayslips(cycleId, tenantId, userId);
      res.json(result);
    } catch (error) {
      console.error('Generate payslips error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPayslips(req, res) {
    try {
      const { tenantId } = req.user;
      const payslips = await payrollService.getPayslips(tenantId, req.query);
      res.json(payslips);
    } catch (error) {
      console.error('Get payslips error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getPayslipById(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const payslip = await payrollService.getPayslipById(id, tenantId);
      if (!payslip) {
        return res.status(404).json({ error: 'Payslip not found' });
      }
      res.json(payslip);
    } catch (error) {
      console.error('Get payslip error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async approvePayslip(req, res) {
    try {
      const { tenantId, userId } = req.user;
      const { id } = req.params;
      const payslip = await payrollService.approvePayslip(id, tenantId, userId);
      res.json(payslip);
    } catch (error) {
      console.error('Approve payslip error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // DISBURSEMENTS
  // ==========================================

  async createDisbursements(req, res) {
    try {
      const { tenantId } = req.user;
      const { cycleId } = req.params;
      const disbursements = await payrollService.createDisbursements(cycleId, tenantId);
      res.json(disbursements);
    } catch (error) {
      console.error('Create disbursements error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getDisbursements(req, res) {
    try {
      const { tenantId } = req.user;
      const disbursements = await payrollService.getDisbursements(tenantId, req.query);
      res.json(disbursements);
    } catch (error) {
      console.error('Get disbursements error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateDisbursementStatus(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const disbursement = await payrollService.updateDisbursementStatus(
        id,
        tenantId,
        req.body
      );
      res.json(disbursement);
    } catch (error) {
      console.error('Update disbursement status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // REPORTS
  // ==========================================

  async getPayrollSummary(req, res) {
    try {
      const { tenantId } = req.user;
      const { startDate, endDate } = req.query;
      const summary = await payrollService.getPayrollSummary(tenantId, startDate, endDate);
      res.json(summary);
    } catch (error) {
      console.error('Get payroll summary error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PayrollController();
