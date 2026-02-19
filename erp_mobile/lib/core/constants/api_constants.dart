// API Base URL - Change this to your backend URL
const String kBaseUrl = 'http://localhost:5000/api';
// For production, use: 'https://your-backend-domain.com/api'

// Auth Endpoints
const String kLoginEndpoint = '/auth/login';
const String kLogoutEndpoint = '/auth/logout';
const String kRefreshEndpoint = '/auth/refresh';
const String kProfileEndpoint = '/auth/me';

// Dashboard
const String kDashboardEndpoint = '/dashboard';
const String kDashboardStatsEndpoint = '/dashboard/stats';

// HR Endpoints
const String kEmployeesEndpoint = '/employees';
const String kLeaveRequestsEndpoint = '/leave-requests';
const String kLeaveTypesEndpoint = '/leave-types';
const String kAttendanceEndpoint = '/attendance';

// Payroll Endpoints
const String kPayrollEndpoint = '/payroll';
const String kPayrollCyclesEndpoint = '/payroll/cycles';
const String kPayslipsEndpoint = '/payroll/payslips';

// CRM Endpoints
const String kCustomersEndpoint = '/crm/customers';
const String kLeadsEndpoint = '/crm/leads';
const String kPipelineEndpoint = '/crm/pipeline';
const String kContactsEndpoint = '/crm/contacts';
const String kDealsEndpoint = '/crm/deals';

// Inventory Endpoints
const String kInventoryEndpoint = '/inventory';
const String kInventoryItemsEndpoint = '/inventory/items';
const String kWarehousesEndpoint = '/inventory/warehouses';
const String kStockMovementsEndpoint = '/inventory/stock-movements';

// Finance Endpoints
const String kFinanceEndpoint = '/finance';
const String kInvoicesEndpoint = '/finance/invoices';
const String kExpensesEndpoint = '/finance/expense-claims';
const String kPaymentsEndpoint = '/finance/payments';
const String kBillsEndpoint = '/ap/bills';

// Sales Endpoints
const String kSalesOrdersEndpoint = '/sales/orders';
const String kQuotationsEndpoint = '/sales/quotations';

// Projects
const String kProjectsEndpoint = '/projects';

// Assets
const String kAssetsEndpoint = '/assets';

// Documents
const String kDocumentsEndpoint = '/documents';

// Pagination
const int kDefaultPageSize = 20;

// Storage Keys
const String kTokenKey = 'auth_token';
const String kUserKey = 'user_data';
const String kRefreshTokenKey = 'refresh_token';
