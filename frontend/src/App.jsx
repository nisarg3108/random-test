import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { getToken } from './store/auth.store';
import Login from './auth/Login';
import Register from './auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import InviteUser from './pages/InviteUser';
import AcceptInvite from './pages/AcceptInvite';
import { useDashboardStore } from './store/dashboard.store';
import { useInventoryStore } from './store/inventory.store';
import Landing from './pages/Landing';

// Inventory
import InventoryList from './pages/inventory/InventoryList';
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import WarehouseList from './pages/inventory/WarehouseList';
import WarehouseDashboard from './pages/inventory/WarehouseDashboard';
import StockMovements from './pages/inventory/StockMovements';
import InventoryApprovals from './pages/inventory/InventoryApprovals';

// Manufacturing
import BOMList from './pages/manufacturing/BOMList';
import WorkOrderList from './pages/manufacturing/WorkOrderList';

// Accounting
import ChartOfAccounts from './pages/accounting/ChartOfAccounts';
import GeneralLedger from './pages/accounting/GeneralLedger';
import JournalEntry from './pages/accounting/JournalEntry';

// HR
import HRDashboard from './pages/hr/HRDashboard';
import EmployeeList from './pages/hr/EmployeeList';
import LeaveRequestList from './pages/hr/LeaveRequestList';
import LeaveTypeList from './pages/hr/LeaveTypeList';

// Attendance
import AttendanceDashboard from './pages/hr/AttendanceDashboard';

// Payroll
import { 
  PayrollDashboard, 
  PayrollCyclesList, 
  PayrollCycleDetails, 
  PayslipDetails,
  DisbursementList
} from './pages/hr/payroll';

// Employee Self-Service
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeDashboardNew from './pages/employee/EmployeeDashboardNew';
import EmployeeLeaveRequest from './pages/employee/EmployeeLeaveRequest';
import WorkReports from './pages/employee/WorkReports';
import TaskManagement from './pages/employee/TaskManagement';
import SalaryManagement from './pages/employee/SalaryManagement';

// Finance
import FinanceDashboard from './pages/finance/FinanceDashboard';
import ExpenseCategoryList from './pages/finance/ExpenseCategoryList';
import ExpenseClaimList from './pages/finance/ExpenseClaimList';
import FinanceApprovals from './pages/finance/FinanceApprovals';
import BillingDashboard from './pages/subscription/BillingDashboardEnhanced';

// CRM
import Customers from './pages/crm/Customers';
import CustomerDetails from './pages/crm/CustomerDetails';
import Contacts from './pages/crm/Contacts';
import Leads from './pages/crm/Leads';
import LeadDetails from './pages/crm/LeadDetails';
import SalesPipeline from './pages/crm/SalesPipeline';
import DealDetails from './pages/crm/DealDetails';
import Communications from './pages/crm/Communications';
import CRMDashboard from './pages/crm/CRMDashboard';

// Sales
import QuotationsList from './pages/sales/QuotationsList';
import SalesOrdersList from './pages/sales/SalesOrdersList';
import InvoicesList from './pages/sales/InvoicesList';
import OrderTracking from './pages/sales/OrderTracking';
import SalesAnalytics from './pages/sales/SalesAnalyticsDashboard';

// Purchase
import {
  VendorsList,
  PurchaseOrdersList,
  PurchaseRequisitions,
  SupplierEvaluation,
  PurchaseAnalytics,
  GoodsReceiptList
} from './pages/purchase';

// Accounts Payable
import {
  BillsList,
  PaymentsList,
  AgingReport
} from './pages/ap';

// Projects
import { ProjectList, ProjectDetails } from './pages/projects';
import TimesheetEntry from './pages/projects/TimesheetEntry';
import MyTimesheets from './pages/projects/MyTimesheets';
import TimesheetApprovals from './pages/projects/TimesheetApprovals';

// Assets
import AssetDashboard from './pages/assets/AssetDashboard';
import AssetList from './pages/assets/AssetList';
import AssetForm from './pages/assets/AssetForm';
import AssetAllocations from './pages/assets/AssetAllocations';
import AssetMaintenance from './pages/assets/AssetMaintenance';
import AssetDepreciation from './pages/assets/AssetDepreciation';
import AssetCategoryList from './pages/assets/AssetCategoryList';

// Documents
import DocumentsPage from './pages/Documents/DocumentsPage';

// Communication
import MessagingPage from './pages/communication/MessagingPage';
import AnnouncementsPage from './pages/communication/AnnouncementsPage';
import ChannelsPage from './pages/communication/ChannelsPage';

// Departments
import DepartmentList from './pages/departments/DepartmentList';

// RBAC
import RolesList from './pages/rbac/RolesList';
import PermissionMatrix from './pages/rbac/PermissionMatrix';
import RoleManagement from './pages/RoleManagement';

// Company
import CompanySettings from './pages/company/CompanySettings';
import CompanySetupWizard from './components/CompanySetupWizard';

// Workflows
import WorkflowList from './pages/workflows/WorkflowList';
import ApprovalQueue from './pages/workflows/ApprovalQueue';
import ApprovalsPage from './pages/ApprovalsPage';
import ApprovalDashboardSimple from './pages/ApprovalDashboardSimple';

// Audit & Reports
import AuditLogs from './pages/audit/AuditLogs';
import {
  ReportsDashboard,
  ProfitLossReport,
  BalanceSheetReport,
  HRAnalyticsReport,
  InventoryReport,
  CustomReportBuilder,
  SavedReportDetails,
} from './pages/reports';

// System
import SystemOptions from './pages/SystemOptions';
import NotificationsPage from './pages/NotificationsPage';

// Theme Demo
import ThemeDemo from './pages/ThemeDemo';

function App() {
  const initializeDashboardRealTime = useDashboardStore(state => state.initializeRealTime);
  const initializeInventoryRealTime = useInventoryStore(state => state.initializeRealTime);
  const disconnectDashboardRealTime = useDashboardStore(state => state.disconnectRealTime);
  const disconnectInventoryRealTime = useInventoryStore(state => state.disconnectRealTime);

  useEffect(() => {
    // Initialize real-time connections when app starts
    const token = getToken();
    if (token) {
      initializeDashboardRealTime();
      initializeInventoryRealTime();
    }

    // Cleanup on unmount
    return () => {
      disconnectDashboardRealTime();
      disconnectInventoryRealTime();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invite"
          element={
            <ProtectedRoute>
              <InviteUser />
            </ProtectedRoute>
          }
        />

        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Inventory Routes */}
        <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
        <Route path="/inventory-dashboard" element={<ProtectedRoute><InventoryDashboard /></ProtectedRoute>} />
        <Route path="/inventory/approvals" element={<ProtectedRoute><InventoryApprovals /></ProtectedRoute>} />
        <Route path="/warehouses" element={<ProtectedRoute><WarehouseList /></ProtectedRoute>} />
        <Route path="/warehouse" element={<ProtectedRoute><WarehouseList /></ProtectedRoute>} />
        <Route path="/warehouses/dashboard" element={<ProtectedRoute><WarehouseDashboard /></ProtectedRoute>} />
        <Route path="/warehouse/receipts" element={<ProtectedRoute><GoodsReceiptList /></ProtectedRoute>} />
        <Route path="/warehouse/dispatch" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
        <Route path="/stock-movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
        
        {/* Manufacturing Routes */}
        <Route path="/manufacturing/boms" element={<ProtectedRoute><BOMList /></ProtectedRoute>} />
        <Route path="/manufacturing/work-orders" element={<ProtectedRoute><WorkOrderList /></ProtectedRoute>} />
        
        {/* Accounting Routes */}
        <Route path="/accounting/chart-of-accounts" element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>} />
        <Route path="/accounting/charts" element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>} />
        <Route path="/accounting/general-ledger" element={<ProtectedRoute><GeneralLedger /></ProtectedRoute>} />
        <Route path="/accounting/ledger" element={<ProtectedRoute><GeneralLedger /></ProtectedRoute>} />
        <Route path="/accounting/journal-entry" element={<ProtectedRoute><JournalEntry /></ProtectedRoute>} />
        <Route path="/accounting/journal" element={<ProtectedRoute><JournalEntry /></ProtectedRoute>} />
        <Route path="/accounting/reports" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
        
        {/* HR Routes */}
        <Route path="/hr" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
        <Route path="/hr/employees" element={<ProtectedRoute><EmployeeList /></ProtectedRoute>} />
        <Route path="/hr/leave-requests" element={<ProtectedRoute><LeaveRequestList /></ProtectedRoute>} />
        <Route path="/hr/leave-types" element={<ProtectedRoute><LeaveTypeList /></ProtectedRoute>} />
        <Route path="/hr/approvals" element={<ProtectedRoute><ApprovalsPage filterModule="HR" /></ProtectedRoute>} />
        
        {/* Attendance Routes */}
        <Route path="/hr/attendance" element={<ProtectedRoute><AttendanceDashboard /></ProtectedRoute>} />
        
        {/* Payroll Routes */}
        <Route path="/hr/payroll" element={<ProtectedRoute><PayrollDashboard /></ProtectedRoute>} />
        <Route path="/hr/payroll/cycles" element={<ProtectedRoute><PayrollCyclesList /></ProtectedRoute>} />
        <Route path="/hr/payroll/cycles/:id" element={<ProtectedRoute><PayrollCycleDetails /></ProtectedRoute>} />
        <Route path="/hr/payroll/payslips/:id" element={<ProtectedRoute><PayslipDetails /></ProtectedRoute>} />
        <Route path="/hr/payroll/disbursements" element={<ProtectedRoute><DisbursementList /></ProtectedRoute>} />
        
        {/* Employee Self-Service Routes */}
        <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/employee/dashboard" element={<ProtectedRoute><EmployeeDashboardNew /></ProtectedRoute>} />
        <Route path="/employee/leave-request" element={<ProtectedRoute><EmployeeLeaveRequest /></ProtectedRoute>} />
        <Route path="/employee/work-reports" element={<ProtectedRoute><WorkReports /></ProtectedRoute>} />
        <Route path="/employee/tasks" element={<ProtectedRoute><TaskManagement /></ProtectedRoute>} />
        <Route path="/hr/salary-management" element={<ProtectedRoute><SalaryManagement /></ProtectedRoute>} />
        
        {/* Finance Routes */}
        <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
        <Route path="/finance/expense-categories" element={<ProtectedRoute><ExpenseCategoryList /></ProtectedRoute>} />
        <Route path="/finance/expense-claims" element={<ProtectedRoute><ExpenseClaimList /></ProtectedRoute>} />
        <Route path="/finance/approvals" element={<ProtectedRoute><FinanceApprovals /></ProtectedRoute>} />
        <Route path="/subscription/billing" element={<ProtectedRoute><BillingDashboard /></ProtectedRoute>} />
        <Route path="/subscription/pricing" element={<ProtectedRoute><BillingDashboard /></ProtectedRoute>} />

        {/* CRM Routes */}
        <Route path="/crm" element={<ProtectedRoute><CRMDashboard /></ProtectedRoute>} />
        <Route path="/crm/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/crm/customers/:id" element={<ProtectedRoute><CustomerDetails /></ProtectedRoute>} />
        <Route path="/crm/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/crm/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/crm/leads/:id" element={<ProtectedRoute><LeadDetails /></ProtectedRoute>} />
        <Route path="/crm/pipeline" element={<ProtectedRoute><SalesPipeline /></ProtectedRoute>} />
        <Route path="/crm/deals/:id" element={<ProtectedRoute><DealDetails /></ProtectedRoute>} />
        <Route path="/crm/communications" element={<ProtectedRoute><Communications /></ProtectedRoute>} />

        {/* Sales Routes */}
        <Route path="/sales/quotations" element={<ProtectedRoute><QuotationsList /></ProtectedRoute>} />
        <Route path="/sales/orders" element={<ProtectedRoute><SalesOrdersList /></ProtectedRoute>} />
        <Route path="/sales/invoices" element={<ProtectedRoute><InvoicesList /></ProtectedRoute>} />
        <Route path="/sales/tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
        <Route path="/sales/analytics" element={<ProtectedRoute><SalesAnalytics /></ProtectedRoute>} />
        
        {/* Purchase Routes */}
        <Route path="/purchase/vendors" element={<ProtectedRoute><VendorsList /></ProtectedRoute>} />
        <Route path="/purchase/orders" element={<ProtectedRoute><PurchaseOrdersList /></ProtectedRoute>} />
        <Route path="/purchase/requisitions" element={<ProtectedRoute><PurchaseRequisitions /></ProtectedRoute>} />
        <Route path="/purchase/receipts" element={<ProtectedRoute><GoodsReceiptList /></ProtectedRoute>} />
        <Route path="/purchase/evaluations" element={<ProtectedRoute><SupplierEvaluation /></ProtectedRoute>} />
        <Route path="/purchase/analytics" element={<ProtectedRoute><PurchaseAnalytics /></ProtectedRoute>} />

        {/* Accounts Payable Routes */}
        <Route path="/ap/bills" element={<ProtectedRoute><BillsList /></ProtectedRoute>} />
        <Route path="/ap/payments" element={<ProtectedRoute><PaymentsList /></ProtectedRoute>} />
        <Route path="/ap/aging" element={<ProtectedRoute><AgingReport /></ProtectedRoute>} />
        
        {/* Project Management Routes */}
        <Route path="/projects" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="/projects/timesheet/entry" element={<ProtectedRoute><TimesheetEntry /></ProtectedRoute>} />
        <Route path="/projects/timesheet/my" element={<ProtectedRoute><MyTimesheets /></ProtectedRoute>} />
        <Route path="/projects/timesheet/approvals" element={<ProtectedRoute><TimesheetApprovals /></ProtectedRoute>} />
        
        {/* Asset Management Routes */}
        <Route path="/assets" element={<ProtectedRoute><AssetDashboard /></ProtectedRoute>} />
        <Route path="/assets/list" element={<ProtectedRoute><AssetList /></ProtectedRoute>} />        <Route path="/assets/categories" element={<ProtectedRoute><AssetCategoryList /></ProtectedRoute>} />        <Route path="/assets/new" element={<ProtectedRoute><AssetForm /></ProtectedRoute>} />
        <Route path="/assets/:id/edit" element={<ProtectedRoute><AssetForm /></ProtectedRoute>} />
        <Route path="/assets/allocations" element={<ProtectedRoute><AssetAllocations /></ProtectedRoute>} />
        <Route path="/assets/maintenance" element={<ProtectedRoute><AssetMaintenance /></ProtectedRoute>} />
        <Route path="/assets/depreciation" element={<ProtectedRoute><AssetDepreciation /></ProtectedRoute>} />
        
        {/* Document Management Routes */}
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
        
        {/* Communication Routes */}
        <Route path="/communication/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
        <Route path="/communication/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
        <Route path="/communication/channels" element={<ProtectedRoute><ChannelsPage /></ProtectedRoute>} />
        
        {/* Department Routes */}
        <Route path="/departments" element={<ProtectedRoute><DepartmentList /></ProtectedRoute>} />
        
        {/* RBAC Routes */}
        <Route path="/roles" element={<ProtectedRoute><RolesList /></ProtectedRoute>} />
        <Route path="/role-management" element={<ProtectedRoute><RoleManagement /></ProtectedRoute>} />
        <Route path="/permissions" element={<ProtectedRoute><PermissionMatrix /></ProtectedRoute>} />
        
        {/* Company Routes */}
        <Route path="/company" element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
        <Route path="/company/setup" element={<ProtectedRoute><CompanySetupWizard onComplete={() => (window.location.href = '/dashboard')} /></ProtectedRoute>} />
        
        {/* Workflow Routes */}
        <Route path="/workflows" element={<ProtectedRoute><WorkflowList /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
        <Route path="/approvals/dashboard" element={<ProtectedRoute><ApprovalDashboardSimple /></ProtectedRoute>} />
        <Route path="/approval-queue" element={<ProtectedRoute><ApprovalQueue /></ProtectedRoute>} />
        <Route path="/approval-dashboard" element={<ProtectedRoute><ApprovalDashboardSimple /></ProtectedRoute>} />
        
        {/* Audit & Reports Routes */}
        <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
        <Route path="/reports/financial/profit-loss" element={<ProtectedRoute><ProfitLossReport /></ProtectedRoute>} />
        <Route path="/reports/financial/balance-sheet" element={<ProtectedRoute><BalanceSheetReport /></ProtectedRoute>} />
        <Route path="/reports/hr/analytics" element={<ProtectedRoute><HRAnalyticsReport /></ProtectedRoute>} />
        <Route path="/reports/inventory" element={<ProtectedRoute><InventoryReport /></ProtectedRoute>} />
        <Route path="/reports/custom" element={<ProtectedRoute><CustomReportBuilder /></ProtectedRoute>} />
        <Route path="/reports/saved/:id" element={<ProtectedRoute><SavedReportDetails /></ProtectedRoute>} />
        
        {/* System Routes */}
        <Route path="/system-options" element={<ProtectedRoute><SystemOptions /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        
        {/* Theme Demo */}
        <Route path="/theme-demo" element={<ThemeDemo />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;