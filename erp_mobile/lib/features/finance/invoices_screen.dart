import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';
import '../widgets/status_badge.dart';

class InvoicesScreen extends StatelessWidget {
  const InvoicesScreen({super.key});

  Future<List<dynamic>> _fetch(String query, int page) async {
    final data = await apiService.getList(
      kInvoicesEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) {
      return List.from(data['invoices'] ?? data['data'] ?? []);
    }
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Invoices',
      color: AppColors.financeColor,
      icon: Icons.receipt_long_rounded,
      endpoint: kInvoicesEndpoint,
      fetcher: _fetch,
      onAdd: () {},
      itemBuilder: (inv) => _InvoiceCard(invoice: inv),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  final Map<String, dynamic> invoice;
  const _InvoiceCard({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final number = invoice['invoiceNumber'] ?? invoice['number'] ?? '#';
    final customer = invoice['customer']?['name'] ??
        invoice['customerName'] ?? invoice['clientName'] ?? '';
    final total = invoice['total'] ?? invoice['totalAmount'] ?? invoice['amount'] ?? 0;
    final paid = invoice['paidAmount'] ?? invoice['amountPaid'] ?? 0;
    final status = invoice['status'] ?? 'DRAFT';
    final date = invoice['invoiceDate'] ?? invoice['createdAt'];
    final dueDate = invoice['dueDate'];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: status == 'OVERDUE' ? AppColors.error : AppColors.border,
          width: status == 'OVERDUE' ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                number,
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    fontSize: 15),
              ),
              const Spacer(),
              StatusBadge(status: status),
            ],
          ),
          const SizedBox(height: 6),
          if (customer.isNotEmpty)
            Text(customer,
                style: const TextStyle(
                    fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Row(
            children: [
              _amtCol('Total', total, AppColors.textPrimary),
              const SizedBox(width: 16),
              _amtCol('Paid', paid, AppColors.success),
              const SizedBox(width: 16),
              _amtCol(
                'Balance',
                (num.tryParse(total.toString()) ?? 0) -
                    (num.tryParse(paid.toString()) ?? 0),
                status == 'OVERDUE' ? AppColors.error : AppColors.warning,
              ),
            ],
          ),
          if (date != null || dueDate != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today,
                    size: 12, color: AppColors.textLight),
                const SizedBox(width: 4),
                Text(
                  [
                    if (date != null) 'Issued: ${_fmt(date)}',
                    if (dueDate != null) 'Due: ${_fmt(dueDate)}',
                  ].join('  |  '),
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textSecondary),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _amtCol(String label, dynamic value, Color color) {
    final n = num.tryParse(value.toString()) ?? 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style:
                const TextStyle(fontSize: 10, color: AppColors.textLight)),
        Text('\$${n.toStringAsFixed(2)}',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: color)),
      ],
    );
  }

  String _fmt(dynamic date) {
    final d = DateTime.tryParse(date.toString());
    if (d == null) return date.toString();
    return '${d.day}/${d.month}/${d.year}';
  }
}
