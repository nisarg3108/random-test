import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_provider.dart';
import '../features/auth/splash_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/hr/hr_screen.dart';
import '../features/hr/employees_screen.dart';
import '../features/hr/leave_requests_screen.dart';
import '../features/hr/attendance_screen.dart';
import '../features/hr/employee_detail_screen.dart';
import '../features/payroll/payroll_screen.dart';
import '../features/payroll/payslips_screen.dart';
import '../features/payroll/payroll_cycles_screen.dart';
import '../features/payroll/disbursements_screen.dart';
import '../features/inventory/stock_movements_screen.dart';
import '../features/finance/bills_screen.dart';
import '../features/crm/crm_screen.dart';
import '../features/crm/customers_screen.dart';
import '../features/crm/leads_screen.dart';
import '../features/crm/pipeline_screen.dart';
import '../features/inventory/inventory_screen.dart';
import '../features/inventory/stock_items_screen.dart';
import '../features/inventory/warehouses_screen.dart';
import '../features/finance/finance_screen.dart';
import '../features/finance/invoices_screen.dart';
import '../features/finance/expenses_screen.dart';
import '../features/more/more_screen.dart';
import 'main_shell.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorKey =
    GlobalKey<NavigatorState>(debugLabel: 'shell');

GoRouter createRouter(BuildContext context) {
  final authProvider = Provider.of<AuthProvider>(context, listen: false);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthenticated =
          authProvider.status == AuthStatus.authenticated;
      final isLoading = authProvider.status == AuthStatus.initial ||
          authProvider.status == AuthStatus.loading;
      final isLoginPage = state.matchedLocation == '/login';
      final isSplash = state.matchedLocation == '/splash';

      if (isSplash) return null;
      if (isLoading) return '/splash';
      if (!isAuthenticated && !isLoginPage) return '/login';
      if (isAuthenticated && isLoginPage) return '/dashboard';
      return null;
    },
    refreshListenable: authProvider,
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          // HR Routes
          GoRoute(
            path: '/hr',
            builder: (context, state) => const HRScreen(),
            routes: [
              GoRoute(
                path: 'employees',
                builder: (context, state) => const EmployeesScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (context, state) =>
                        EmployeeDetailScreen(id: state.pathParameters['id']!),
                  ),
                ],
              ),
              GoRoute(
                path: 'leaves',
                builder: (context, state) => const LeaveRequestsScreen(),
              ),
              GoRoute(
                path: 'attendance',
                builder: (context, state) => const AttendanceScreen(),
              ),
            ],
          ),
          // Payroll Routes
          GoRoute(
            path: '/payroll',
            builder: (context, state) => const PayrollScreen(),
            routes: [
              GoRoute(
                path: 'payslips',
                builder: (context, state) => const PayslipsScreen(),
              ),
              GoRoute(
                path: 'cycles',
                builder: (context, state) => const PayrollCyclesScreen(),
              ),
              GoRoute(
                path: 'disbursements',
                builder: (context, state) => const DisbursementsScreen(),
              ),
            ],
          ),
          // CRM Routes
          GoRoute(
            path: '/crm',
            builder: (context, state) => const CRMScreen(),
            routes: [
              GoRoute(
                path: 'customers',
                builder: (context, state) => const CustomersScreen(),
              ),
              GoRoute(
                path: 'leads',
                builder: (context, state) => const LeadsScreen(),
              ),
              GoRoute(
                path: 'pipeline',
                builder: (context, state) => const PipelineScreen(),
              ),
            ],
          ),
          // Inventory Routes
          GoRoute(
            path: '/inventory',
            builder: (context, state) => const InventoryScreen(),
            routes: [
              GoRoute(
                path: 'items',
                builder: (context, state) => const StockItemsScreen(),
              ),
              GoRoute(
                path: 'warehouses',
                builder: (context, state) => const WarehousesScreen(),
              ),
              GoRoute(
                path: 'movements',
                builder: (context, state) => const StockMovementsScreen(),
              ),
            ],
          ),
          // Finance Routes
          GoRoute(
            path: '/finance',
            builder: (context, state) => const FinanceScreen(),
            routes: [
              GoRoute(
                path: 'invoices',
                builder: (context, state) => const InvoicesScreen(),
              ),
              GoRoute(
                path: 'expenses',
                builder: (context, state) => const ExpensesScreen(),
              ),
              GoRoute(
                path: 'bills',
                builder: (context, state) => const BillsScreen(),
              ),
            ],
          ),
          // More
          GoRoute(
            path: '/more',
            builder: (context, state) => const MoreScreen(),
          ),
        ],
      ),
    ],
  );
}
