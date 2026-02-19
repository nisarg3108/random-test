import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';
import '../widgets/status_badge.dart';

class CustomersScreen extends StatelessWidget {
  const CustomersScreen({super.key});

  Future<List<dynamic>> _fetch(String query, int page) async {
    final data = await apiService.getList(
      kCustomersEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) return List.from(data['customers'] ?? data['data'] ?? []);
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Customers',
      color: AppColors.crmColor,
      icon: Icons.groups_rounded,
      endpoint: kCustomersEndpoint,
      fetcher: _fetch,
      onAdd: () {},
      itemBuilder: (c) => _CustomerCard(customer: c),
    );
  }
}

class _CustomerCard extends StatelessWidget {
  final Map<String, dynamic> customer;
  const _CustomerCard({required this.customer});

  @override
  Widget build(BuildContext context) {
    final name = customer['name'] ?? customer['companyName'] ?? 'Unknown';
    final email = customer['email'] ?? '';
    final phone = customer['phone'] ?? '';
    final status = customer['status'] ?? 'ACTIVE';
    final type = customer['type'] ?? customer['customerType'] ?? '';
    final revenue = customer['totalRevenue'] ?? customer['revenue'];

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
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.crmColor.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: const TextStyle(
                        color: AppColors.crmColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary)),
                    if (email.isNotEmpty)
                      Text(email,
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              StatusBadge(status: status),
            ],
          ),
          if (phone.isNotEmpty || type.isNotEmpty || revenue != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                if (phone.isNotEmpty) ...[
                  const Icon(Icons.phone, size: 13, color: AppColors.textLight),
                  const SizedBox(width: 4),
                  Text(phone,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(width: 12),
                ],
                if (type.isNotEmpty)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.infoLight,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(type,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.info)),
                  ),
                if (revenue != null) ...[
                  const Spacer(),
                  Text('\$${_fmt(revenue)}',
                      style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.success)),
                ],
              ],
            ),
          ],
        ],
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
