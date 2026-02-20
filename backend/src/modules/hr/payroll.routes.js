import express from 'express';
import payrollController from './payroll.controller.js';
import { requireAuth as authenticate } from '../../core/auth/auth.middleware.js';

const router = express.Router();

// ==========================================
// SALARY COMPONENTS ROUTES
// ==========================================

// Create salary component
router.post('/components', authenticate, payrollController.createSalaryComponent);

// Get all salary components
router.get('/components', authenticate, payrollController.getSalaryComponents);

// Update salary component
router.put('/components/:id', authenticate, payrollController.updateSalaryComponent);

// ==========================================
// TAX CONFIGURATION ROUTES
// ==========================================

// Create tax configuration
router.post('/tax-config', authenticate, payrollController.createTaxConfiguration);

// Get tax configurations
router.get('/tax-config', authenticate, payrollController.getTaxConfigurations);

// Calculate tax
router.post('/tax-config/calculate', authenticate, payrollController.calculateTax);

// ==========================================
// PAYROLL CYCLE ROUTES
// ==========================================

// Create payroll cycle
router.post('/cycles', authenticate, payrollController.createPayrollCycle);

// Get all payroll cycles
router.get('/cycles', authenticate, payrollController.getPayrollCycles);

// Get payroll cycle by ID
router.get('/cycles/:id', authenticate, payrollController.getPayrollCycleById);

// Generate payslips for a cycle
router.post('/cycles/:cycleId/generate-payslips', authenticate, payrollController.generatePayslips);

// Create disbursements for a cycle
router.post('/cycles/:cycleId/disbursements', authenticate, payrollController.createDisbursements);

// ==========================================
// PAYSLIP ROUTES
// ==========================================

// Get all payslips
router.get('/payslips', authenticate, payrollController.getPayslips);

// Get payslip by ID
router.get('/payslips/:id', authenticate, payrollController.getPayslipById);

// Approve payslip
router.post('/payslips/:id/approve', authenticate, payrollController.approvePayslip);

// ==========================================
// DISBURSEMENT ROUTES
// ==========================================

// Get all disbursements
router.get('/disbursements', authenticate, payrollController.getDisbursements);

// Update disbursement status
router.put('/disbursements/:id/status', authenticate, payrollController.updateDisbursementStatus);

// ==========================================
// PAYROLL CONFIG ROUTES
// ==========================================

// Get payroll statutory config (PF/ESI/gratuity rates)
router.get('/config', authenticate, payrollController.getPayrollConfig);

// Update payroll statutory config
router.put('/config', authenticate, payrollController.updatePayrollConfig);

// ==========================================
// REPORTS ROUTES
// ==========================================

// Get payroll summary
router.get('/reports/summary', authenticate, payrollController.getPayrollSummary);

export default router;
