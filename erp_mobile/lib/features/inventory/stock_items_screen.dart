import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/app_list_screen.dart';

class StockItemsScreen extends StatelessWidget {
  const StockItemsScreen({super.key});

  Future<List<dynamic>> _fetch(String query, int page) async {
    final data = await apiService.getList(
      kInventoryItemsEndpoint,
      queryParams: {'search': query, 'page': page, 'limit': 20},
    );
    if (data is Map) {
      return List.from(data['items'] ?? data['inventoryItems'] ?? data['data'] ?? []);
    }
    return List.from(data ?? []);
  }

  @override
  Widget build(BuildContext context) {
    return AppListScreen(
      title: 'Stock Items',
      color: AppColors.inventoryColor,
      icon: Icons.inventory_rounded,
      endpoint: kInventoryItemsEndpoint,
      fetcher: _fetch,
      onAdd: () {},
      itemBuilder: (item) => _StockCard(item: item),
    );
  }
}

class _StockCard extends StatelessWidget {
  final Map<String, dynamic> item;
  const _StockCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final name = item['name'] ?? item['itemName'] ?? 'Item';
    final sku = item['sku'] ?? item['code'] ?? '';
    final quantity = item['quantity'] ?? item['currentStock'] ?? item['stock'] ?? 0;
    final minQty = item['minimumQuantity'] ?? item['reorderPoint'] ?? 0;
    final unit = item['unit'] ?? item['unitOfMeasure'] ?? '';
    final cost = item['cost'] ?? item['unitCost'] ?? item['price'] ?? 0;
    final category = item['category']?['name'] ?? item['categoryName'] ?? '';

    final isLowStock =
        (num.tryParse(quantity.toString()) ?? 0) <=
            (num.tryParse(minQty.toString()) ?? 0);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isLowStock ? AppColors.warning : AppColors.border,
          width: isLowStock ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary)),
                    if (sku.isNotEmpty)
                      Text('SKU: $sku',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.textLight)),
                  ],
                ),
              ),
              if (isLowStock)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text('Low Stock',
                      style: TextStyle(
                          color: AppColors.warning,
                          fontSize: 11,
                          fontWeight: FontWeight.w600)),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _stat('In Stock', '$quantity ${unit.isNotEmpty ? unit : 'units'}',
                  isLowStock ? AppColors.warning : AppColors.success),
              const SizedBox(width: 12),
              if (cost != 0)
                _stat('Unit Cost', '\$${(num.tryParse(cost.toString()) ?? 0).toStringAsFixed(2)}',
                    AppColors.info),
              if (category.isNotEmpty) ...[
                const SizedBox(width: 12),
                _stat('Category', category, AppColors.textSecondary),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
        Text(value,
            style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}
