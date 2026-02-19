import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';
import '../widgets/stat_card.dart';

class PayrollScreen extends StatefulWidget {
  const PayrollScreen({super.key});

  @override
  State<PayrollScreen> createState() => _PayrollScreenState();
}

class _PayrollScreenState extends State<PayrollScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await apiService.get('/payroll/stats');
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
                color: AppColors.payrollColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.account_balance_wallet_rounded,
                  color: AppColors.payrollColor, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('Payroll',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.textPrimary)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.payrollColor,
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
                    title: 'Active Cycles',
                    value: '${_stats?['activeCycles'] ?? 0}',
                    icon: Icons.loop_rounded,
                    color: AppColors.payrollColor,
                  ),
                  StatCard(
                    title: 'Total Payslips',
                    value: '${_stats?['totalPayslips'] ?? 0}',
                    icon: Icons.receipt_rounded,
                    color: AppColors.info,
                  ),
                  StatCard(
                    title: 'Pending Disbursement',
                    value: '${_stats?['pendingDisbursements'] ?? 0}',
                    icon: Icons.pending_actions_rounded,
                    color: AppColors.warning,
                  ),
                  StatCard(
                    title: 'Total Disbursed',
                    value: '\$${_formatAmt(_stats?['totalDisbursed'] ?? 0)}',
                    icon: Icons.payments_rounded,
                    color: AppColors.success,
                  ),
                ],
              ),
            const SizedBox(height: 24),
            _menuItem(context, Icons.loop_rounded, 'Payroll Cycles',
                'Manage payroll runs', AppColors.payrollColor, '/payroll/cycles'),
            _menuItem(context, Icons.receipt_rounded, 'Payslips',
                'View employee payslips', AppColors.info, '/payroll/payslips'),
            _menuItem(context, Icons.payments_rounded, 'Disbursements',
                'Payment disbursement records', AppColors.success, '/payroll/disbursements'),
          ],
        ),
      ),
    );
  }

  Widget _menuItem(BuildContext ctx, IconData icon, String label, String sub,
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
            style: const TextStyle(
                fontSize: 12, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.chevron_right_rounded,
            color: AppColors.textLight),
      ),
    );
  }

  String _formatAmt(dynamic v) {
    final n = num.tryParse(v.toString()) ?? 0;
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toStringAsFixed(0);
  }
}
