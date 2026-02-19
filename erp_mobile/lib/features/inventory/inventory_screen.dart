import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/api_service.dart';
import '../widgets/stat_card.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await apiService.get('/inventory/stats');
      setState(() {
        _stats = data;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.inventoryColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.inventory_2_rounded,
                  color: AppColors.inventoryColor, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('Inventory',
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.textPrimary)),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.inventoryColor,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (!_loading)
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  StatCard(
                    title: 'Total Items',
                    value: '${_stats?['totalItems'] ?? _stats?['items'] ?? 0}',
                    icon: Icons.inventory_rounded,
                    color: AppColors.inventoryColor,
                  ),
                  StatCard(
                    title: 'Low Stock',
                    value: '${_stats?['lowStockItems'] ?? _stats?['lowStock'] ?? 0}',
                    icon: Icons.warning_rounded,
                    color: AppColors.warning,
                  ),
                  StatCard(
                    title: 'Warehouses',
                    value: '${_stats?['totalWarehouses'] ?? _stats?['warehouses'] ?? 0}',
                    icon: Icons.warehouse_rounded,
                    color: AppColors.info,
                  ),
                  StatCard(
                    title: 'Total Value',
                    value: '\$${_fmt(_stats?['totalValue'] ?? 0)}',
                    icon: Icons.attach_money_rounded,
                    color: AppColors.success,
                  ),
                ],
              ),
            const SizedBox(height: 24),
            _menu(context, Icons.inventory_rounded, 'Stock Items',
                'View & manage inventory', AppColors.inventoryColor, '/inventory/items'),
            _menu(context, Icons.warehouse_rounded, 'Warehouses',
                'Manage storage locations', AppColors.info, '/inventory/warehouses'),
            _menu(context, Icons.swap_horiz_rounded, 'Stock Movements',
                'Track stock in/out', AppColors.primary, '/inventory/movements'),
          ],
        ),
      ),
    );
  }

  Widget _menu(BuildContext ctx, IconData icon, String label, String sub,
      Color color, String route) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border)),
      child: ListTile(
        onTap: () => ctx.go(route),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        subtitle: Text(sub,
            style:
                const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        trailing:
            const Icon(Icons.chevron_right_rounded, color: AppColors.textLight),
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
