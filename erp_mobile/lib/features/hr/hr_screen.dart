import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';
import '../widgets/stat_card.dart';
import '../widgets/section_header.dart';

class HRScreen extends StatefulWidget {
  const HRScreen({super.key});

  @override
  State<HRScreen> createState() => _HRScreenState();
}

class _HRScreenState extends State<HRScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final data = await apiService.get('/employees/stats');
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
                color: AppColors.hrColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.people_rounded,
                  color: AppColors.hrColor, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('HR Module',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.textPrimary)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        color: AppColors.hrColor,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_loading)
              const Center(child: CircularProgressIndicator(color: AppColors.hrColor))
            else ...[
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  StatCard(
                    title: 'Total Employees',
                    value: '${_stats?['total'] ?? _stats?['totalEmployees'] ?? 0}',
                    icon: Icons.people_rounded,
                    color: AppColors.hrColor,
                    onTap: () => context.go('/hr/employees'),
                  ),
                  StatCard(
                    title: 'Active',
                    value: '${_stats?['active'] ?? _stats?['activeEmployees'] ?? 0}',
                    icon: Icons.check_circle_outline_rounded,
                    color: AppColors.success,
                    onTap: () => context.go('/hr/employees'),
                  ),
                  StatCard(
                    title: 'Pending Leaves',
                    value: '${_stats?['pendingLeaves'] ?? 0}',
                    icon: Icons.event_note_rounded,
                    color: AppColors.warning,
                    onTap: () => context.go('/hr/leaves'),
                  ),
                  StatCard(
                    title: 'Present Today',
                    value: '${_stats?['presentToday'] ?? _stats?['attendance'] ?? 0}',
                    icon: Icons.how_to_reg_rounded,
                    color: AppColors.info,
                    onTap: () => context.go('/hr/attendance'),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 24),
            const SectionHeader(title: 'HR Functions'),
            const SizedBox(height: 12),
            _buildMenuItem(
              context,
              icon: Icons.badge_rounded,
              label: 'Employees',
              subtitle: 'Manage employee records',
              color: AppColors.hrColor,
              route: '/hr/employees',
            ),
            _buildMenuItem(
              context,
              icon: Icons.event_note_rounded,
              label: 'Leave Requests',
              subtitle: 'Approve & manage leave',
              color: AppColors.warning,
              route: '/hr/leaves',
            ),
            _buildMenuItem(
              context,
              icon: Icons.how_to_reg_rounded,
              label: 'Attendance',
              subtitle: 'Track daily attendance',
              color: AppColors.info,
              route: '/hr/attendance',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String subtitle,
    required Color color,
    required String route,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: ListTile(
        onTap: () => context.go(route),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        subtitle: Text(subtitle,
            style: const TextStyle(
                fontSize: 12, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.chevron_right_rounded,
            color: AppColors.textLight),
      ),
    );
  }
}
