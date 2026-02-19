// Payroll Cycles Screen
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/status_badge.dart';

class PayrollCyclesScreen extends StatefulWidget {
  const PayrollCyclesScreen({super.key});

  @override
  State<PayrollCyclesScreen> createState() => _PayrollCyclesScreenState();
}

class _PayrollCyclesScreenState extends State<PayrollCyclesScreen> {
  List<dynamic> _cycles = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCycles();
  }

  Future<void> _loadCycles() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.getList('/payroll/cycles');
      setState(() { _cycles = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payroll Cycles'),
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
                    ElevatedButton(onPressed: _loadCycles, child: const Text('Retry')),
                  ],
                ))
              : RefreshIndicator(
                  onRefresh: _loadCycles,
                  child: _cycles.isEmpty
                      ? const Center(child: Text('No payroll cycles found'))
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _cycles.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final cycle = _cycles[index];
                            final startDate = cycle['startDate'] != null
                                ? DateFormat('dd MMM yyyy').format(DateTime.parse(cycle['startDate']))
                                : 'N/A';
                            final endDate = cycle['endDate'] != null
                                ? DateFormat('dd MMM yyyy').format(DateTime.parse(cycle['endDate']))
                                : 'N/A';
                            return Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: CircleAvatar(
                                  backgroundColor: AppColors.payrollColor.withOpacity(0.15),
                                  child: Icon(Icons.calendar_month, color: AppColors.payrollColor),
                                ),
                                title: Text(
                                  cycle['name'] ?? cycle['period'] ?? 'Cycle #${cycle['id']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                subtitle: Text('$startDate – $endDate'),
                                trailing: StatusBadge(status: cycle['status'] ?? 'PENDING'),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
