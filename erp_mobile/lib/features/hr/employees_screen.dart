import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';
import '../widgets/status_badge.dart';

class EmployeesScreen extends StatelessWidget {
  const EmployeesScreen({super.key});

  Future<List<dynamic>> _fetchEmployees(String query, int page) async {
    final data = await apiService.getList(
      kEmployeesEndpoint,
      queryParams: {
        'search': query,
        'page': page,
        'limit': 20,
      },
    );
    if (data is Map) {
      return List.from(
          data['employees'] ?? data['data'] ?? data['items'] ?? []);
    }
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Employees',
      color: AppColors.hrColor,
      icon: Icons.badge_rounded,
      endpoint: kEmployeesEndpoint,
      fetcher: _fetchEmployees,
      onAdd: () {},
      itemBuilder: (employee) => _EmployeeCard(employee: employee),
    );
  }
}

class _EmployeeCard extends StatelessWidget {
  final Map<String, dynamic> employee;
  const _EmployeeCard({required this.employee});

  @override
  Widget build(BuildContext context) {
    final name = '${employee['firstName'] ?? ''} ${employee['lastName'] ?? ''}'.trim();
    final email = employee['email'] ?? '';
    final department = employee['department']?['name'] ?? employee['departmentName'] ?? '';
    final position = employee['position'] ?? employee['jobTitle'] ?? '';
    final status = employee['status'] ?? 'ACTIVE';
    final avatar = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.hrColor.withOpacity(0.15),
            child: Text(
              avatar,
              style: const TextStyle(
                  color: AppColors.hrColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 18),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name.isEmpty ? email : name,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                      fontSize: 15),
                ),
                if (position.isNotEmpty)
                  Text(position,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                if (department.isNotEmpty)
                  Text(department,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.textLight)),
              ],
            ),
          ),
          StatusBadge(status: status),
        ],
      ),
    );
  }
}
