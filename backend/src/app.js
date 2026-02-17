import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dbTestRoutes from './routes/db-test.routes.js';
import healthRoutes from './routes/health.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import realtimeRoutes from './routes/realtime.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { requireModuleEntitlement } from './middlewares/entitlement.middleware.js';
import { requireAuth } from './core/auth/auth.middleware.js';
import protectedRoutes from './routes/protected.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './users/user.routes.js';
import inviteRoutes from './invites/invite.routes.js';
import authRoutes from './core/auth/auth.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import warehouseRoutes from './modules/inventory/warehouse.routes.js';
import stockMovementRoutes from './modules/inventory/stock-movement.routes.js';
import departmentRoutes from './core/department/department.routes.js';
import auditRoutes from './core/audit/audit.routes.js';
import systemOptionsRoutes from './core/system/systemOptions.routes.js';
import rbacRoutes from './core/rbac/rbac.routes.js';
import approvalRoutes from './core/workflow/approval.routes.js';
import workflowRoutes from './core/workflow/workflow.routes.js';
import employeeRoutes from './modules/hr/employee.routes.js';
import leaveTypeRoutes from './modules/hr/leaveType.routes.js';
import leaveRequestRoutes from './modules/hr/leaveRequest.routes.js';
import employeeDashboardRoutes from './modules/hr/employee.dashboard.routes.js';
import payrollRoutes from './modules/hr/payroll.routes.js';
import disbursementRoutes from './modules/hr/disbursement.routes.js';
import taskRoutes from './modules/hr/task.routes.js';
import attendanceRoutes from './modules/hr/attendance.routes.js';
import expenseCategoryRoutes from './modules/finance/expenseCategory.routes.js';
import expenseClaimRoutes from './modules/finance/expenseClaim.routes.js';
import accountingRoutes from './modules/finance/accounting.routes.js';
import financeDashboardRoutes from './routes/finance-dashboard.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import passwordResetRoutes from './modules/auth/passwordReset.routes.js';
import companyRoutes from './modules/company/companyRoutes.js';
import branchRoutes from './modules/company/branch.routes.js';
import crmRoutes from './modules/crm/crm.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import purchaseRoutes from './modules/purchase/purchase.routes.js';
import apRoutes from './modules/ap/ap.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import projectMemberRoutes from './modules/projects/project-member.routes.js';
import timesheetRoutes from './modules/projects/timesheet.routes.js';
import manufacturingRoutes from './modules/manufacturing/manufacturing.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import allocationRoutes from './modules/assets/allocation.routes.js';
import maintenanceRoutes from './modules/assets/maintenance.routes.js';
import depreciationRoutes from './modules/assets/depreciation.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import reportingRoutes from './modules/reports/reporting.routes.js';
import communicationRoutes from './modules/communication/communication.routes.js';
import dataImportExportRoutes from './modules/utils/data-import-export.routes.js';
import billingRoutes from './modules/subscription/billing.routes.js';
import missingRoutes from './routes/missing-routes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* Global Middlewares */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

/* Routes */
app.get('/', (req, res) => {
  res.json({ message: 'ERP System Backend API is running!', version: '1.0.0' });
});
app.use('/api/health', healthRoutes);
app.use('/api/db-test', dbTestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invites', inviteRoutes);

/* Module Routes with Entitlement Checks */

// Inventory Module Routes
app.use('/api/inventory', requireAuth, requireModuleEntitlement('INVENTORY'), inventoryRoutes);
app.use('/api/items', requireAuth, requireModuleEntitlement('INVENTORY'), inventoryRoutes);
app.use('/api/warehouses', requireAuth, requireModuleEntitlement('INVENTORY'), warehouseRoutes);
app.use('/api/stock-movements', requireAuth, requireModuleEntitlement('INVENTORY'), stockMovementRoutes);

// Core Routes (no entitlement checks)
app.use('/api/departments', departmentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/system-options', systemOptionsRoutes);
app.use('/api/rbac', rbacRoutes);

// HR Module Routes
app.use('/api/employees', requireAuth, requireModuleEntitlement('HR'), employeeRoutes);
app.use('/api/leave-types', requireAuth, requireModuleEntitlement('HR'), leaveTypeRoutes);
app.use('/api/leave-requests', requireAuth, requireModuleEntitlement('HR'), leaveRequestRoutes);
app.use('/api/employee', requireAuth, requireModuleEntitlement('HR'), employeeDashboardRoutes);
app.use('/api/payroll', requireAuth, requireModuleEntitlement('PAYROLL'), payrollRoutes);
app.use('/api/hr/disbursements', requireAuth, requireModuleEntitlement('PAYROLL'), disbursementRoutes);
app.use('/api/tasks', requireAuth, requireModuleEntitlement('HR'), taskRoutes);
app.use('/api/attendance', requireAuth, requireModuleEntitlement('HR'), attendanceRoutes);

// Finance Module Routes
app.use('/api/expense-categories', requireAuth, requireModuleEntitlement('FINANCE'), expenseCategoryRoutes);
app.use('/api/expense-claims', requireAuth, requireModuleEntitlement('FINANCE'), expenseClaimRoutes);
app.use('/api/finance-dashboard', requireAuth, requireModuleEntitlement('FINANCE'), financeDashboardRoutes);
app.use('/api/finance', requireAuth, requireModuleEntitlement('FINANCE'), financeRoutes);
app.use('/api/accounting', requireAuth, requireModuleEntitlement('FINANCE'), accountingRoutes);

// Notification Routes (no entitlement checks - system-wide)
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', passwordResetRoutes);

// Company Routes (no entitlement checks - core)
app.use('/api/company', companyRoutes);
app.use('/api/branches', branchRoutes);

// CRM Module Routes
app.use('/api/crm', requireAuth, requireModuleEntitlement('CRM'), crmRoutes);

// Sales Module Routes
app.use('/api/sales', requireAuth, requireModuleEntitlement('SALES'), salesRoutes);

// Purchase Module Routes
app.use('/api/purchase', requireAuth, requireModuleEntitlement('PURCHASE'), purchaseRoutes);

// Accounts Payable Module Routes
app.use('/api/ap', requireAuth, requireModuleEntitlement('PURCHASE'), apRoutes);

// Projects Module Routes
app.use('/api/projects', requireAuth, requireModuleEntitlement('PROJECTS'), projectRoutes);
app.use('/api/projects', requireAuth, requireModuleEntitlement('PROJECTS'), projectMemberRoutes);
app.use('/api/timesheets', requireAuth, requireModuleEntitlement('PROJECTS'), timesheetRoutes);

// Manufacturing Module Routes
app.use('/api/manufacturing', requireAuth, requireModuleEntitlement('MANUFACTURING'), manufacturingRoutes);

// Workflow & Approvals Routes
app.use('/api/workflows', requireAuth, requireModuleEntitlement('WORKFLOWS'), workflowRoutes);
app.use('/api/approvals', requireAuth, requireModuleEntitlement('APPROVALS'), approvalRoutes);

// Asset Management Routes
app.use('/api/assets', requireAuth, requireModuleEntitlement('ASSETS'), assetRoutes);
app.use('/api/asset-allocations', requireAuth, requireModuleEntitlement('ASSETS'), allocationRoutes);
app.use('/api/asset-maintenance', requireAuth, requireModuleEntitlement('ASSETS'), maintenanceRoutes);
app.use('/api/asset-depreciation', requireAuth, requireModuleEntitlement('ASSETS'), depreciationRoutes);

// Document Management Routes
app.use('/api/documents', requireAuth, requireModuleEntitlement('DOCUMENTS'), documentRoutes);

// Reports & Analytics Routes
app.use('/api/reports', requireAuth, requireModuleEntitlement('REPORTS'), reportRoutes);
app.use('/api/reporting', requireAuth, requireModuleEntitlement('REPORTS'), reportingRoutes);

// Communication Module Routes
app.use('/api/communication', requireAuth, requireModuleEntitlement('COMMUNICATION'), communicationRoutes);

// Data Import/Export Routes (no entitlement checks - core utility)
app.use('/api/data', dataImportExportRoutes);

// Billing & Subscription Routes
app.use('/api/billing', billingRoutes);

// Missing routes (minimal implementations)
app.use('/api', missingRoutes);



/* Error Handler */
app.use(errorHandler);

export default app;
