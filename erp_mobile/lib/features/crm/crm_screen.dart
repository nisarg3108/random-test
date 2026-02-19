import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';
import '../widgets/stat_card.dart';

class CRMScreen extends StatefulWidget {
  const CRMScreen({super.key});

  @override
  State<CRMScreen> createState() => _CRMScreenState();
}

class _CRMScreenState extends State<CRMScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await apiService.get('/crm/dashboard');
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
                color: AppColors.crmColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.business_center_rounded,
                  color: AppColors.crmColor, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('CRM',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.textPrimary)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.crmColor,
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
                    title: 'Total Customers',
                    value: '${_stats?['totalCustomers'] ?? _stats?['customers'] ?? 0}',
                    icon: Icons.groups_rounded,
                    color: AppColors.crmColor,
                  ),
                  StatCard(
                    title: 'Open Leads',
                    value: '${_stats?['openLeads'] ?? _stats?['leads'] ?? 0}',
                    icon: Icons.trending_up_rounded,
                    color: AppColors.info,
                  ),
                  StatCard(
                    title: 'Active Deals',
                    value: '${_stats?['activeDeals'] ?? _stats?['deals'] ?? 0}',
                    icon: Icons.handshake_outlined,
                    color: AppColors.success,
                  ),
                  StatCard(
                    title: 'Pipeline Value',
                    value: '\$${_fmt(_stats?['pipelineValue'] ?? 0)}',
                    icon: Icons.attach_money_rounded,
                    color: AppColors.payrollColor,
                  ),
                ],
              ),
            const SizedBox(height: 24),
            _menu(context, Icons.groups_rounded, 'Customers',
                'Manage customer accounts', AppColors.crmColor, '/crm/customers'),
            _menu(context, Icons.trending_up_rounded, 'Leads',
                'Track & convert leads', AppColors.info, '/crm/leads'),
            _menu(context, Icons.view_kanban_rounded, 'Sales Pipeline',
                'Manage deals & stages', AppColors.success, '/crm/pipeline'),
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
