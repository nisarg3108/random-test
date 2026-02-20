import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import payrollService from '../../../src/modules/hr/payroll.service.js';

describe('PayrollService - Statutory Deductions & Gratuity', () => {
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    jest.clearAllMocks();
  });

  // ============ getPayrollRules Tests ============
  describe('getPayrollRules', () => {
    it('should return default rules when no config exists', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue(null);

      const rules = await payrollService.getPayrollRules('tenant-123');

      expect(rules.pfRate).toBe(0.12);
      expect(rules.pfWageLimit).toBe(15000);
      expect(rules.esiRate).toBe(0.0075);
      expect(rules.esiWageLimit).toBe(21000);
      expect(rules.gratuityEnabled).toBe(false);
      expect(rules.gratuityMinYears).toBe(5);
    });

    it('should override defaults with tenant config values', async () => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue({
        businessRules: {
          payroll: {
            pfRate: 0.10,
            esiRate: 0.005,
            gratuityEnabled: true,
            gratuityMinYears: 3,
          },
        },
      });

      const rules = await payrollService.getPayrollRules('tenant-456');

      expect(rules.pfRate).toBe(0.10);
      expect(rules.esiRate).toBe(0.005);
      expect(rules.gratuityEnabled).toBe(true);
      expect(rules.gratuityMinYears).toBe(3);
    });
  });

  // ============ calculateStatutoryDeductions Tests ============
  describe('calculateStatutoryDeductions', () => {
    beforeEach(() => {
      mockPrisma.companyConfig.findUnique.mockResolvedValue({
        businessRules: {
          payroll: {
            pfRate: 0.12,
            pfWageLimit: 15000,
            esiRate: 0.0075,
            esiWageLimit: 21000,
          },
        },
      });
    });

    it('should calculate PF capped at wage limit', async () => {
      const deductions = await payrollService.calculateStatutoryDeductions({
        basicSalary: 20000,
        grossSalary: 22000,
        tenantId: 'tenant-123',
      });

      // PF = min(20000, 15000) * 0.12 = 1800
      expect(deductions.PF).toBe(1800);
    });

    it('should calculate ESI up to wage limit', async () => {
      const deductions = await payrollService.calculateStatutoryDeductions({
        basicSalary: 15000,
        grossSalary: 18000,
        tenantId: 'tenant-123',
      });

      // ESI = 18000 * 0.0075 = 135
      expect(deductions.ESI).toBe(135);
    });

    it('should not deduct ESI if grossSalary exceeds wage limit', async () => {
      const deductions = await payrollService.calculateStatutoryDeductions({
        basicSalary: 15000,
        grossSalary: 25000,
        tenantId: 'tenant-123',
      });

      // ESI only applies if grossSalary <= 21000
      expect(deductions.ESI).toBe(0);
    });

    it('should return zero PT if no tax config found', async () => {
      mockPrisma.taxConfiguration.findFirst.mockResolvedValue(null);

      const deductions = await payrollService.calculateStatutoryDeductions({
        basicSalary: 20000,
        grossSalary: 22000,
        tenantId: 'tenant-123',
      });

      expect(deductions.PROFESSIONAL_TAX).toBe(0);
    });
  });

  // ============ calculateGratuityAccrual Tests ============
  describe('calculateGratuityAccrual', () => {
    let rules;

    beforeEach(() => {
      rules = {
        gratuityEnabled: true,
        gratuityMinYears: 5,
        gratuityDaysFactor: 15,
        gratuityDivisor: 26,
      };
    });

    it('should return zero if gratuity is disabled', () => {
      const disabledRules = { ...rules, gratuityEnabled: false };

      const gratuity = payrollService.calculateGratuityAccrual({
        basicSalary: 20000,
        joiningDate: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
        rules: disabledRules,
      });

      expect(gratuity).toBe(0);
    });

    it('should not accrue if tenure is below minimum years', () => {
      const recentJoiningDate = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000);

      const gratuity = payrollService.calculateGratuityAccrual({
        basicSalary: 20000,
        joiningDate: recentJoiningDate,
        rules,
      });

      // 3 years < 5 years minimum
      expect(gratuity).toBe(0);
    });

    it('should accrue gratuity at minimum years threshold', () => {
      const fiveYearsAgo = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);

      const gratuity = payrollService.calculateGratuityAccrual({
        basicSalary: 26000,
        joiningDate: fiveYearsAgo,
        rules,
      });

      // Accrual = (26000 / 26) * 15 / 12 = 1250
      expect(gratuity).toBe(1250);
    });

    it('should use provided gratuity parameters', () => {
      const fiveYearsAgo = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
      const customRules = {
        gratuityEnabled: true,
        gratuityMinYears: 1,
        gratuityDaysFactor: 20,
        gratuityDivisor: 30,
      };

      const gratuity = payrollService.calculateGratuityAccrual({
        basicSalary: 30000,
        joiningDate: fiveYearsAgo,
        rules: customRules,
      });

      // Accrual = (30000 / 30) * 20 / 12 = 1666.67 → 1667
      expect(gratuity).toBe(1667);
    });
  });

  // ============ mergeDeductions Tests ============
  describe('mergeDeductions', () => {
    it('should merge statutory deductions with component deductions', () => {
      const componentDeductions = {
        HEALTH_INSURANCE: 5000,
        LOAN_REPAYMENT: 2000,
      };

      const statutoryDeductions = {
        PF: 1800,
        ESI: 150,
        PROFESSIONAL_TAX: 320,
      };

      const result = payrollService.mergeDeductions(componentDeductions, statutoryDeductions);

      expect(result.merged.HEALTH_INSURANCE).toBe(5000);
      expect(result.merged.LOAN_REPAYMENT).toBe(2000);
      expect(result.merged.PF).toBe(1800);
      expect(result.merged.ESI).toBe(150);
      expect(result.merged.PROFESSIONAL_TAX).toBe(320);
      expect(result.total).toBe(9270);
    });

    it('should not add statutory if component deduction already exists', () => {
      const componentDeductions = {
        PF: 1500,
      };

      const statutoryDeductions = {
        PF: 1800,
      };

      const result = payrollService.mergeDeductions(componentDeductions, statutoryDeductions);

      // Component PF is kept, statutory is not added (no double-count)
      expect(result.merged.PF).toBe(1500);
      expect(result.total).toBe(1500);
    });

    it('should handle empty component deductions', () => {
      const componentDeductions = {};

      const statutoryDeductions = {
        PF: 1800,
        ESI: 150,
      };

      const result = payrollService.mergeDeductions(componentDeductions, statutoryDeductions);

      expect(result.merged.PF).toBe(1800);
      expect(result.merged.ESI).toBe(150);
      expect(result.total).toBe(1950);
    });

    it('should handle zero-value deductions by skipping them', () => {
      const componentDeductions = {
        HEALTH_INSURANCE: 5000,
      };

      const statutoryDeductions = {
        PF: 0,
        ESI: 150,
      };

      const result = payrollService.mergeDeductions(componentDeductions, statutoryDeductions);

      // Zero-value deductions are skipped
      expect(result.merged.PF).toBeUndefined();
      expect(result.merged.ESI).toBe(150);
      expect(result.total).toBe(5150);
    });
  });
});
