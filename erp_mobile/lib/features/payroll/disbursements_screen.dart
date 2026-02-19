// Disbursements Screen
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/status_badge.dart';

class DisbursementsScreen extends StatefulWidget {
  const DisbursementsScreen({super.key});

  @override
  State<DisbursementsScreen> createState() => _DisbursementsScreenState();
}

class _DisbursementsScreenState extends State<DisbursementsScreen> {
  List<dynamic> _disbursements = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDisbursements();
  }

  Future<void> _loadDisbursements() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.getList('/payroll/disbursements');
      setState(() { _disbursements = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  String _formatCurrency(dynamic amount) {
    if (amount == null) return '\$0.00';
    final n = NumberFormat.currency(symbol: '\$');
    return n.format(double.tryParse(amount.toString()) ?? 0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Disbursements'),
        backgroundColor: AppColors.payrollColor,
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
                    ElevatedButton(onPressed: _loadDisbursements, child: const Text('Retry')),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _loadDisbursements,
                  child: _disbursements.isEmpty
                      ? const Center(child: Text('No disbursements found'))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _disbursements.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final d = _disbursements[index];
                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: CircleAvatar(
                                  backgroundColor: AppColors.payrollColor.withOpacity(0.15),
                                  child: Icon(Icons.payments, color: AppColors.payrollColor),
                                ),
                                title: Text(
                                  d['employeeName'] ?? d['name'] ?? 'Disbursement #${d['id']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                subtitle: Text('Net: ${_formatCurrency(d['netAmount'] ?? d['amount'])}'),
                                trailing: StatusBadge(status: d['status'] ?? 'PENDING'),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
