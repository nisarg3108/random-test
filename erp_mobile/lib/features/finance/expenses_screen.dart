import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';
import '../widgets/status_badge.dart';

class ExpensesScreen extends StatelessWidget {
  const ExpensesScreen({super.key});

  Future<List<dynamic>> _fetch(String query, int page) async {
    final data = await apiService.getList(
      kExpensesEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) {
      return List.from(data['expenseClaims'] ?? data['expenses'] ?? data['data'] ?? []);
    }
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Expense Claims',
      color: AppColors.warning,
      icon: Icons.money_off_rounded,
      endpoint: kExpensesEndpoint,
      fetcher: _fetch,
      onAdd: () {},
      itemBuilder: (e) => _ExpenseCard(expense: e),
    );
  }
}

class _ExpenseCard extends StatelessWidget {
  final Map<String, dynamic> expense;
  const _ExpenseCard({required this.expense});

  @override
  Widget build(BuildContext context) {
    final title = expense['title'] ?? expense['description'] ?? 'Expense';
    final amount = expense['amount'] ?? expense['totalAmount'] ?? 0;
    final status = expense['status'] ?? 'PENDING';
    final category = expense['category']?['name'] ??
        expense['expenseCategory'] ?? '';
    final date = expense['date'] ?? expense['expenseDate'] ?? expense['createdAt'];
    final employee = expense['employee'];
    final empName = employee != null
        ? '${employee['firstName'] ?? ''} ${employee['lastName'] ?? ''}'.trim()
        : expense['employeeName'] ?? '';

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
              Expanded(
                child: Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary)),
              ),
              Text(
                '\$${(num.tryParse(amount.toString()) ?? 0).toStringAsFixed(2)}',
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: AppColors.financeColor),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (empName.isNotEmpty) ...[
                const Icon(Icons.person_outline,
                    size: 13, color: AppColors.textLight),
                const SizedBox(width: 4),
                Text(empName,
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
                const SizedBox(width: 10),
              ],
              if (category.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(category,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.warning)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              StatusBadge(status: status),
              const Spacer(),
              if (date != null)
                Text(_formatDate(date),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textLight)),
            ],
          ),
          if (status == 'PENDING') ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _updateStatus(context, expense['id'], 'APPROVED'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.success,
                      side: const BorderSide(color: AppColors.success),
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Approve', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _updateStatus(context, expense['id'], 'REJECTED'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('Reject', style: TextStyle(fontSize: 12)),
                  ),
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
      await apiService.patch('$kExpensesEndpoint/$id', {'status': status});
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Expense $status'.toLowerCase()),
          backgroundColor: status == 'APPROVED' ? AppColors.success : AppColors.error,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  String _formatDate(dynamic date) {
    final d = DateTime.tryParse(date.toString());
    if (d == null) return date.toString();
    return '${d.day}/${d.month}/${d.year}';
  }
}
