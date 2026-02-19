import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({super.key});

  Future<List<dynamic>> _fetchAttendance(String query, int page) async {
    final today = DateTime.now();
    final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final data = await apiService.getList(
      kAttendanceEndpoint,
      queryParams: {
        'date': dateStr,
        'search': query,
        'page': page,
        'limit': 20,
      },
    );
    if (data is Map) {
      return List.from(data['attendance'] ?? data['records'] ?? data['data'] ?? []);
    }
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: "Today's Attendance",
      color: AppColors.info,
      icon: Icons.how_to_reg_rounded,
      endpoint: kAttendanceEndpoint,
      fetcher: _fetchAttendance,
      itemBuilder: (record) => _AttendanceCard(record: record),
    );
  }
}

class _AttendanceCard extends StatelessWidget {
  final Map<String, dynamic> record;
  const _AttendanceCard({required this.record});

  @override
  Widget build(BuildContext context) {
    final employee = record['employee'];
    final name = employee != null
        ? '${employee['firstName'] ?? ''} ${employee['lastName'] ?? ''}'.trim()
        : record['employeeName'] ?? 'Employee';
    final checkIn = record['checkIn'] ?? record['checkInTime'];
    final checkOut = record['checkOut'] ?? record['checkOutTime'];
    final status = record['status'] ?? (checkIn != null ? 'PRESENT' : 'ABSENT');
    final hours = record['hoursWorked'] ?? record['totalHours'];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: _statusColor(status).withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              status == 'PRESENT' || status == 'CHECKED_IN'
                  ? Icons.check_rounded
                  : Icons.close_rounded,
              color: _statusColor(status),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (checkIn != null)
                      _timeChip('In: ${_formatTime(checkIn)}', AppColors.success),
                    if (checkIn != null && checkOut != null) const SizedBox(width: 6),
                    if (checkOut != null)
                      _timeChip('Out: ${_formatTime(checkOut)}', AppColors.info),
                    if (hours != null) ...[
                      const SizedBox(width: 6),
                      _timeChip('$hours hrs', AppColors.warning),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _statusColor(status).withOpacity(0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              status,
              style: TextStyle(
                  color: _statusColor(status),
                  fontSize: 11,
                  fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String s) {
    switch (s.toUpperCase()) {
      case 'PRESENT':
      case 'CHECKED_IN':
        return AppColors.success;
      case 'ABSENT':
        return AppColors.error;
      case 'LATE':
        return AppColors.warning;
      default:
        return AppColors.textSecondary;
    }
  }

  Widget _timeChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500)),
    );
  }

  String _formatTime(dynamic time) {
    if (time == null) return '';
    final d = DateTime.tryParse(time.toString());
    if (d == null) return time.toString();
    final h = d.hour.toString().padLeft(2, '0');
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
