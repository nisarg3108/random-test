// Bills Screen
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/api_service.dart';
import '../../core/constants/api_constants.dart' show kBillsEndpoint;
import '../../core/constants/app_colors.dart';
import '../widgets/status_badge.dart';

class BillsScreen extends StatefulWidget {
  const BillsScreen({super.key});

  @override
  State<BillsScreen> createState() => _BillsScreenState();
}

class _BillsScreenState extends State<BillsScreen> {
  List<dynamic> _bills = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBills();
  }

  Future<void> _loadBills() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.getList(kBillsEndpoint);
      setState(() { _bills = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  String _formatCurrency(dynamic amount) {
    if (amount == null) return '\$0.00';
    final n = NumberFormat.currency(symbol: '\$');
    return n.format(double.tryParse(amount.toString()) ?? 0);
  }

  bool _isOverdue(dynamic dueDate) {
    if (dueDate == null) return false;
    try {
      return DateTime.parse(dueDate).isBefore(DateTime.now());
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bills'),
        backgroundColor: AppColors.financeColor,
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
                    ElevatedButton(onPressed: _loadBills, child: const Text('Retry')),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _loadBills,
                  child: _bills.isEmpty
                      ? const Center(child: Text('No bills found'))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _bills.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final bill = _bills[index];
                            final overdue = _isOverdue(bill['dueDate']) &&
                                (bill['status'] ?? '').toString().toUpperCase() != 'PAID';
                            final dueDate = bill['dueDate'] != null
                                ? DateFormat('dd MMM yyyy').format(DateTime.parse(bill['dueDate']))
                                : 'N/A';
                            return Card(
                              color: overdue ? Colors.red.shade50 : null,
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: CircleAvatar(
                                  backgroundColor: (overdue ? Colors.red : AppColors.financeColor).withOpacity(0.15),
                                  child: Icon(
                                    Icons.receipt_long,
                                    color: overdue ? Colors.red : AppColors.financeColor,
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        bill['vendorName'] ?? bill['supplier'] ?? 'Bill #${bill['id']}',
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (overdue)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.red,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text(
                                          'OVERDUE',
                                          style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                  ],
                                ),
                                subtitle: Text('Due: $dueDate · Total: ${_formatCurrency(bill['totalAmount'] ?? bill['amount'])}'),
                                trailing: StatusBadge(status: bill['status'] ?? 'PENDING'),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
