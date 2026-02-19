import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';
import '../widgets/stat_card.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await apiService.get('/finance/dashboard');
      setState(() {
        _stats = data;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.financeColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.receipt_long_rounded,
                  color: AppColors.financeColor, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('Finance',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.textPrimary)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.financeColor,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (!_loading)
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  StatCard(
                    title: 'Total Revenue',
                    value: '\$${_fmt(_stats?['totalRevenue'] ?? _stats?['revenue'] ?? 0)}',
                    icon: Icons.trending_up_rounded,
                    color: AppColors.success,
                  ),
                  StatCard(
                    title: 'Outstanding',
                    value: '\$${_fmt(_stats?['outstanding'] ?? _stats?['outstandingAmount'] ?? 0)}',
                    icon: Icons.pending_rounded,
                    color: AppColors.warning,
                  ),
                  StatCard(
                    title: 'Overdue',
                    value: '${_stats?['overdueCount'] ?? _stats?['overdueInvoices'] ?? 0}',
                    icon: Icons.warning_rounded,
                    color: AppColors.error,
                  ),
                  StatCard(
                    title: 'Expenses',
                    value: '\$${_fmt(_stats?['totalExpenses'] ?? _stats?['expenses'] ?? 0)}',
                    icon: Icons.payments_rounded,
                    color: AppColors.financeColor,
                  ),
                ],
              ),
            const SizedBox(height: 24),
            _menu(context, Icons.receipt_long_rounded, 'Invoices',
                'Manage sales invoices', AppColors.financeColor, '/finance/invoices'),
            _menu(context, Icons.money_off_rounded, 'Expenses',
                'Expense claims & reports', AppColors.warning, '/finance/expenses'),
            _menu(context, Icons.account_balance_rounded, 'Accounts Payable',
                'Bills & vendor payments', AppColors.primary, '/finance/bills'),
          ],
        ),
      ),
    );
  }

  Widget _menu(BuildContext ctx, IconData icon, String label, String sub,
      Color color, String route) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border)),
      child: ListTile(
        onTap: () => ctx.go(route),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        subtitle: Text(sub,
            style:
                const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        trailing:
            const Icon(Icons.chevron_right_rounded, color: AppColors.textLight),
      ),
    );
  }

  String _fmt(dynamic v) {
    final n = num.tryParse(v.toString()) ?? 0;
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toStringAsFixed(0);
  }
}
