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

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* Global Middlewares */
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/inventory', inventoryRoutes);
app.use('/api/items', inventoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/system-options', systemOptionsRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/employee', employeeDashboardRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/hr/disbursements', disbursementRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/expense-claims', expenseClaimRoutes);
app.use('/api/finance-dashboard', financeDashboardRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/ap', apRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', projectMemberRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/manufacturing', manufacturingRoutes);

app.use('/api/workflows', workflowRoutes);
app.use('/api/approvals', approvalRoutes);

// Asset Management Routes
app.use('/api/assets', assetRoutes);
app.use('/api/asset-allocations', allocationRoutes);
app.use('/api/asset-maintenance', maintenanceRoutes);
app.use('/api/asset-depreciation', depreciationRoutes);

// Document Management Routes
app.use('/api/documents', documentRoutes);

// Reports & Analytics Routes
app.use('/api/reports', reportRoutes);
app.use('/api/reporting', reportingRoutes);

// Communication Module Routes
app.use('/api/communication', communicationRoutes);

// Data Import/Export Routes
app.use('/api/data', dataImportExportRoutes);



/* Error Handler */
app.use(errorHandler);

export default app;
