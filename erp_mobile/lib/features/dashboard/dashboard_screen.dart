import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../widgets/stat_card.dart';
import '../widgets/section_header.dart';
import '../widgets/module_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await apiService.get('/dashboard/stats');
      setState(() {
        _stats = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _loadStats,
        color: AppColors.primary,
        child: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              expandedHeight: 130,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.primary,
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_none_rounded,
                      color: Colors.white),
                  onPressed: () {},
                ),
                IconButton(
                  icon: const Icon(Icons.account_circle_outlined,
                      color: Colors.white),
                  onPressed: () => context.go('/more'),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.secondary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  padding:
                      const EdgeInsets.only(left: 20, right: 20, bottom: 16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Hello, ${user?.name.split(' ').first ?? 'User'} 👋',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.tenantName ?? AppStrings.appName,
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            if (_loading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.error, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        'Failed to load dashboard',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _loadStats,
                        icon: const Icon(Icons.refresh),
                        label: const Text(AppStrings.retry),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Stats Grid
                      const SectionHeader(title: 'Overview'),
                      const SizedBox(height: 12),
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.5,
                        children: [
                          StatCard(
                            title: AppStrings.totalEmployees,
                            value:
                                '${_stats?['totalEmployees'] ?? _stats?['employees'] ?? 0}',
                            icon: Icons.people_rounded,
                            color: AppColors.hrColor,
                          ),
                          StatCard(
                            title: AppStrings.pendingLeaves,
                            value:
                                '${_stats?['pendingLeaves'] ?? _stats?['leaveRequests'] ?? 0}',
                            icon: Icons.event_note_rounded,
                            color: AppColors.warning,
                          ),
                          StatCard(
                            title: AppStrings.openLeads,
                            value: '${_stats?['openLeads'] ?? _stats?['leads'] ?? 0}',
                            icon: Icons.trending_up_rounded,
                            color: AppColors.crmColor,
                          ),
                          StatCard(
                            title: AppStrings.overdueInvoices,
                            value:
                                '${_stats?['overdueInvoices'] ?? _stats?['invoices'] ?? 0}',
                            icon: Icons.receipt_long_rounded,
                            color: AppColors.error,
                          ),
                          StatCard(
                            title: AppStrings.stockAlerts,
                            value:
                                '${_stats?['lowStockItems'] ?? _stats?['stockAlerts'] ?? 0}',
                            icon: Icons.inventory_2_rounded,
                            color: AppColors.inventoryColor,
                          ),
                          StatCard(
                            title: AppStrings.totalRevenue,
                            value:
                                '\$${_formatAmount(_stats?['totalRevenue'] ?? _stats?['revenue'] ?? 0)}',
                            icon: Icons.attach_money_rounded,
                            color: AppColors.success,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      // Quick Access Modules
                      const SectionHeader(title: 'Modules'),
                      const SizedBox(height: 12),
                      GridView.count(
                        crossAxisCount: 3,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        children: [
                          ModuleCard(
                            icon: Icons.people_rounded,
                            label: 'HR',
                            color: AppColors.hrColor,
                            onTap: () => context.go('/hr'),
                          ),
                          ModuleCard(
                            icon: Icons.account_balance_wallet_rounded,
                            label: 'Payroll',
                            color: AppColors.payrollColor,
                            onTap: () => context.go('/payroll'),
                          ),
                          ModuleCard(
                            icon: Icons.business_center_rounded,
                            label: 'CRM',
                            color: AppColors.crmColor,
                            onTap: () => context.go('/crm'),
                          ),
                          ModuleCard(
                            icon: Icons.inventory_rounded,
                            label: 'Inventory',
                            color: AppColors.inventoryColor,
                            onTap: () => context.go('/inventory'),
                          ),
                          ModuleCard(
                            icon: Icons.receipt_long_rounded,
                            label: 'Finance',
                            color: AppColors.financeColor,
                            onTap: () => context.go('/finance'),
                          ),
                          ModuleCard(
                            icon: Icons.folder_rounded,
                            label: 'More',
                            color: AppColors.projectColor,
                            onTap: () => context.go('/more'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatAmount(dynamic value) {
    final num amount = num.tryParse(value.toString()) ?? 0;
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(1)}K';
    }
    return amount.toStringAsFixed(0);
  }
}
