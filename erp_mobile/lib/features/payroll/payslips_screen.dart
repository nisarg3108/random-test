import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';
import '../widgets/status_badge.dart';

class PayslipsScreen extends StatelessWidget {
  const PayslipsScreen({super.key});

  Future<List<dynamic>> _fetch(String query, int page) async {
    final data = await apiService.getList(
      kPayslipsEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) return List.from(data['payslips'] ?? data['data'] ?? []);
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Payslips',
      color: AppColors.payrollColor,
      icon: Icons.receipt_rounded,
      endpoint: kPayslipsEndpoint,
      fetcher: _fetch,
      itemBuilder: (p) => _PayslipCard(payslip: p),
    );
  }
}

class _PayslipCard extends StatelessWidget {
  final Map<String, dynamic> payslip;
  const _PayslipCard({required this.payslip});

  @override
  Widget build(BuildContext context) {
    final employee = payslip['employee'];
    final name = employee != null
        ? '${employee['firstName'] ?? ''} ${employee['lastName'] ?? ''}'.trim()
        : payslip['employeeName'] ?? 'Employee';
    final period = payslip['period'] ?? payslip['payPeriod'] ?? '';
    final gross = payslip['grossSalary'] ?? payslip['gross'] ?? 0;
    final net = payslip['netSalary'] ?? payslip['net'] ?? 0;
    final status = payslip['status'] ?? 'DRAFT';

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
              const Icon(Icons.person_outline,
                  size: 16, color: AppColors.textSecondary),
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
          if (period.isNotEmpty)
            Text('Period: $period',
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Row(
            children: [
              _amtBox('Gross', gross, AppColors.info),
              const SizedBox(width: 12),
              _amtBox('Net Pay', net, AppColors.success),
            ],
          ),
        ],
      ),
    );
  }

  Widget _amtBox(String label, dynamic value, Color color) {
    final n = num.tryParse(value.toString()) ?? 0;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(fontSize: 11, color: color)),
            const SizedBox(height: 2),
            Text(
              '\$${n.toStringAsFixed(2)}',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: color),
            ),
          ],
        ),
      ),
    );
  }
}
