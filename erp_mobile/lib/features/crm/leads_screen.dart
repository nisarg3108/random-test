import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';
import '../widgets/status_badge.dart';

class LeadsScreen extends StatelessWidget {
  const LeadsScreen({super.key});

  Future<List<dynamic>> _fetch(String query, int page) async {
    final data = await apiService.getList(
      kLeadsEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) return List.from(data['leads'] ?? data['data'] ?? []);
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Leads',
      color: AppColors.info,
      icon: Icons.trending_up_rounded,
      endpoint: kLeadsEndpoint,
      fetcher: _fetch,
      onAdd: () {},
      itemBuilder: (l) => _LeadCard(lead: l),
    );
  }
}

class _LeadCard extends StatelessWidget {
  final Map<String, dynamic> lead;
  const _LeadCard({required this.lead});

  @override
  Widget build(BuildContext context) {
    final name = lead['name'] ?? lead['companyName'] ?? lead['title'] ?? 'Lead';
    final contact = lead['contactName'] ?? lead['firstName'] ?? '';
    final email = lead['email'] ?? '';
    final source = lead['source'] ?? lead['leadSource'] ?? '';
    final status = lead['status'] ?? lead['stage'] ?? 'NEW';
    final value = lead['estimatedValue'] ?? lead['value'];

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
              const Icon(Icons.trending_up_rounded,
                  size: 18, color: AppColors.info),
              const SizedBox(width: 8),
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
          if (contact.isNotEmpty || email.isNotEmpty)
            Text(
              [contact, email].where((s) => s.isNotEmpty).join(' • '),
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textSecondary),
            ),
          const SizedBox(height: 6),
          Row(
            children: [
              if (source.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.infoLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('Source: $source',
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.info)),
                ),
              const Spacer(),
              if (value != null)
                Text(
                  '\$${_fmt(value)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.success,
                      fontSize: 13),
                ),
            ],
          ),
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
