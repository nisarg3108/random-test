import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';

class WarehousesScreen extends StatelessWidget {
  const WarehousesScreen({super.key});

  Future<List<dynamic>> _fetch(String query, int page) async {
    final data = await apiService.getList(
      kWarehousesEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) {
      return List.from(data['warehouses'] ?? data['data'] ?? []);
    }
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Warehouses',
      color: AppColors.info,
      icon: Icons.warehouse_rounded,
      endpoint: kWarehousesEndpoint,
      fetcher: _fetch,
      onAdd: () {},
      itemBuilder: (w) => _WarehouseCard(warehouse: w),
    );
  }
}

class _WarehouseCard extends StatelessWidget {
  final Map<String, dynamic> warehouse;
  const _WarehouseCard({required this.warehouse});

  @override
  Widget build(BuildContext context) {
    final name = warehouse['name'] ?? 'Warehouse';
    final code = warehouse['code'] ?? warehouse['warehouseCode'] ?? '';
    final location = warehouse['location'] ?? warehouse['address'] ?? '';
    final capacity = warehouse['capacity'] ?? 0;
    final used = warehouse['usedCapacity'] ?? warehouse['currentStock'] ?? 0;
    final manager = warehouse['manager']?['name'] ??
        warehouse['managerName'] ?? '';

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
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.warehouse_rounded,
                    color: AppColors.info, size: 20),
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
                    if (code.isNotEmpty)
                      Text('Code: $code',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textLight)),
                  ],
                ),
              ),
            ],
          ),
          if (location.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 13, color: AppColors.textLight),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(location,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.textSecondary)),
                ),
              ],
            ),
          ],
          if (manager.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.manage_accounts_outlined,
                    size: 13, color: AppColors.textLight),
                const SizedBox(width: 4),
                Text('Manager: $manager',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ],
          if (capacity != 0) ...[
            const SizedBox(height: 10),
            _capacityBar(used, capacity),
          ],
        ],
      ),
    );
  }

  Widget _capacityBar(dynamic used, dynamic capacity) {
    final usedN = num.tryParse(used.toString()) ?? 0;
    final capN = num.tryParse(capacity.toString()) ?? 1;
    final percent = (usedN / capN).clamp(0.0, 1.0).toDouble();
    final color = percent > 0.8 ? AppColors.error : percent > 0.6 ? AppColors.warning : AppColors.success;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Capacity Used', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            Text('${(percent * 100).toStringAsFixed(0)}%',
                style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percent,
            backgroundColor: AppColors.borderLight,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}
