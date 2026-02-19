import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';
import '../widgets/status_badge.dart';

class LeaveRequestsScreen extends StatelessWidget {
  const LeaveRequestsScreen({super.key});

  Future<List<dynamic>> _fetchLeaves(String query, int page) async {
    final data = await apiService.getList(
      kLeaveRequestsEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) {
      return List.from(data['leaveRequests'] ?? data['data'] ?? []);
    }
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Leave Requests',
      color: AppColors.warning,
      icon: Icons.event_note_rounded,
      endpoint: kLeaveRequestsEndpoint,
      fetcher: _fetchLeaves,
      itemBuilder: (leave) => _LeaveCard(leave: leave),
    );
  }
}

class _LeaveCard extends StatelessWidget {
  final Map<String, dynamic> leave;
  const _LeaveCard({required this.leave});

  @override
  Widget build(BuildContext context) {
    final employee = leave['employee'];
    final name = employee != null
        ? '${employee['firstName'] ?? ''} ${employee['lastName'] ?? ''}'.trim()
        : leave['employeeName'] ?? 'Employee';
    final leaveType = leave['leaveType']?['name'] ?? leave['type'] ?? 'Leave';
    final startDate = _formatDate(leave['startDate']);
    final endDate = _formatDate(leave['endDate']);
    final days = leave['days'] ?? leave['numberOfDays'] ?? '';
    final status = leave['status'] ?? 'PENDING';
    final reason = leave['reason'] ?? '';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.person_outline, size: 16, color: AppColors.textSecondary),
              const SizedBox(width: 6),
              Expanded(
                child: Text(name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ),
              StatusBadge(status: status),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _chip(leaveType, AppColors.warning),
              const SizedBox(width: 8),
              if (days != '') _chip('$days days', AppColors.info),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.date_range, size: 14, color: AppColors.textLight),
              const SizedBox(width: 4),
              Text('$startDate → $endDate',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
          if (reason.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(reason,
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                maxLines: 2,
                overflow: TextOverflow.ellipsis),
          ],
          if (status == 'PENDING') ...[
            const SizedBox(height: 10),
            Row(
              children: [
                _actionBtn(
                  'Approve',
                  AppColors.success,
                  () => _updateStatus(context, leave['id'], 'APPROVED'),
                ),
                const SizedBox(width: 8),
                _actionBtn(
                  'Reject',
                  AppColors.error,
                  () => _updateStatus(context, leave['id'], 'REJECTED'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _updateStatus(BuildContext context, dynamic id, String status) async {
    try {
      await apiService.patch('$kLeaveRequestsEndpoint/$id', {'status': status});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Leave request $status'.toLowerCase()),
          backgroundColor: status == 'APPROVED' ? AppColors.success : AppColors.error,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }

  Widget _actionBtn(String label, Color color, VoidCallback onTap) {
    return Expanded(
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(color: color),
          padding: const EdgeInsets.symmetric(vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: Text(label, style: const TextStyle(fontSize: 12)),
      ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return '';
    final d = DateTime.tryParse(date.toString());
    if (d == null) return date.toString();
    return '${d.day}/${d.month}/${d.year}';
  }
}
