// Stock Movements Screen
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/api_service.dart';
import '../../core/constants/api_constants.dart' show kStockMovementsEndpoint;
import '../../core/constants/app_colors.dart';

class StockMovementsScreen extends StatefulWidget {
  const StockMovementsScreen({super.key});

  @override
  State<StockMovementsScreen> createState() => _StockMovementsScreenState();
}

class _StockMovementsScreenState extends State<StockMovementsScreen> {
  List<dynamic> _movements = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMovements();
  }

  Future<void> _loadMovements() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.getList(kStockMovementsEndpoint);
      setState(() { _movements = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Color _movementColor(String? type) {
    switch (type?.toUpperCase()) {
      case 'IN': return Colors.green;
      case 'OUT': return Colors.red;
      case 'TRANSFER': return Colors.orange;
      default: return Colors.grey;
    }
  }

  IconData _movementIcon(String? type) {
    switch (type?.toUpperCase()) {
      case 'IN': return Icons.add_circle;
      case 'OUT': return Icons.remove_circle;
      case 'TRANSFER': return Icons.swap_horiz;
      default: return Icons.sync;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Stock Movements'),
        backgroundColor: AppColors.inventoryColor,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 8),
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _loadMovements, child: const Text('Retry')),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _loadMovements,
                  child: _movements.isEmpty
                      ? const Center(child: Text('No stock movements found'))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _movements.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final m = _movements[index];
                            final type = m['type'] as String?;
                            final date = m['date'] != null
                                ? DateFormat('dd MMM yyyy').format(DateTime.parse(m['date']))
                                : 'N/A';
                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: CircleAvatar(
                                  backgroundColor: _movementColor(type).withOpacity(0.15),
                                  child: Icon(_movementIcon(type), color: _movementColor(type)),
                                ),
                                title: Text(
                                  m['itemName'] ?? m['productName'] ?? 'Item #${m['itemId']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                subtitle: Text('$date · ${m['warehouse'] ?? m['location'] ?? ''}'),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      type?.toUpperCase() ?? 'MOVEMENT',
                                      style: TextStyle(
                                        color: _movementColor(type),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                    Text(
                                      '${m['quantity'] ?? 0} units',
                                      style: const TextStyle(fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
