import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/status_badge.dart';

class EmployeeDetailScreen extends StatefulWidget {
  final String id;
  const EmployeeDetailScreen({super.key, required this.id});

  @override
  State<EmployeeDetailScreen> createState() => _EmployeeDetailScreenState();
}

class _EmployeeDetailScreenState extends State<EmployeeDetailScreen> {
  Map<String, dynamic>? _employee;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await apiService.get('$kEmployeesEndpoint/${widget.id}');
      setState(() {
        _employee = data['employee'] ?? data;
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
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.hrColor)),
      );
    }
    if (_error != null || _employee == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Employee')),
        body: Center(child: Text(_error ?? 'Not found')),
      );
    }

    final emp = _employee!;
    final name =
        '${emp['firstName'] ?? ''} ${emp['lastName'] ?? ''}'.trim();
    final email = emp['email'] ?? '';
    final phone = emp['phone'] ?? emp['phoneNumber'] ?? '';
    final department = emp['department']?['name'] ?? '';
    final position = emp['position'] ?? emp['jobTitle'] ?? '';
    final status = emp['status'] ?? 'ACTIVE';
    final employeeId = emp['employeeId'] ?? emp['id'] ?? '';
    final joinDate = emp['dateOfJoining'] ?? emp['hireDate'] ?? emp['createdAt'];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.hrColor,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: AppColors.hrColor,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 50),
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : '?',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(name,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold)),
                      Text(position,
                          style: TextStyle(
                              color: Colors.white.withOpacity(0.8),
                              fontSize: 13)),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Center(child: StatusBadge(status: status)),
                  const SizedBox(height: 20),
                  _section('Employee Information', [
                    _detail('Employee ID', employeeId.toString()),
                    _detail('Department', department),
                    _detail('Position', position),
                    _detail('Join Date', _formatDate(joinDate)),
                  ]),
                  const SizedBox(height: 16),
                  _section('Contact', [
                    _detail('Email', email, icon: Icons.email_outlined),
                    _detail('Phone', phone, icon: Icons.phone_outlined),
                  ]),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _detail(String label, String value, {IconData? icon}) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          if (icon != null) ...[
            Icon(icon, size: 16, color: AppColors.textSecondary),
            const SizedBox(width: 8),
          ],
          SizedBox(
            width: 110,
            child: Text(label,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary)),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w500)),
          ),
        ],
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
