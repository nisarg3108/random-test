import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/services/api_service.dart';
import '../widgets/status_badge.dart';

class PipelineScreen extends StatefulWidget {
  const PipelineScreen({super.key});

  @override
  State<PipelineScreen> createState() => _PipelineScreenState();
}

class _PipelineScreenState extends State<PipelineScreen> {
  List<dynamic> _deals = [];
  bool _loading = true;
  String? _error;

  // Pipeline stages
  final List<Map<String, dynamic>> _stages = [
    {'key': 'ALL', 'label': 'All'},
    {'key': 'QUALIFYING', 'label': 'Qualifying'},
    {'key': 'PROPOSAL', 'label': 'Proposal'},
    {'key': 'NEGOTIATION', 'label': 'Negotiation'},
    {'key': 'WON', 'label': 'Won'},
    {'key': 'LOST', 'label': 'Lost'},
  ];
  String _selectedStage = 'ALL';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await apiService.getList(
        kDealsEndpoint,
        queryParams: {
          if (_selectedStage != 'ALL') 'stage': _selectedStage,
          'limit': 50,
        },
      );
      final list = data is Map
          ? List.from(data['deals'] ?? data['data'] ?? [])
          : List.from(data ?? []);
      setState(() {
        _deals = list;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
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
        leading: BackButton(color: AppColors.textPrimary),
        title: const Text('Sales Pipeline',
            style: TextStyle(
                fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _stages.length,
              itemBuilder: (context, i) {
                final stage = _stages[i];
                final selected = _selectedStage == stage['key'];
                return GestureDetector(
                  onTap: () {
                    setState(() => _selectedStage = stage['key']);
                    _load();
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(
                        horizontal: 4, vertical: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected
                            ? AppColors.primary
                            : AppColors.border,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        stage['label'],
                        style: TextStyle(
                          color: selected
                              ? Colors.white
                              : AppColors.textSecondary,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(child: Text(_error!))
              : _deals.isEmpty
                  ? const Center(
                      child: Text('No deals found',
                          style: TextStyle(color: AppColors.textSecondary)))
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: _deals.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final deal =
                            Map<String, dynamic>.from(_deals[i]);
                        return _DealCard(deal: deal);
                      },
                    ),
    );
  }
}

class _DealCard extends StatelessWidget {
  final Map<String, dynamic> deal;
  const _DealCard({required this.deal});

  @override
  Widget build(BuildContext context) {
    final name = deal['name'] ?? deal['title'] ?? 'Deal';
    final customer = deal['customer']?['name'] ?? deal['customerName'] ?? '';
    final stage = deal['stage'] ?? deal['status'] ?? 'PROPOSAL';
    final value = deal['value'] ?? deal['amount'] ?? deal['dealValue'] ?? 0;
    final closingDate = deal['closingDate'] ?? deal['expectedCloseDate'];
    final probability = deal['probability'] ?? deal['winProbability'];

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
              Expanded(
                child: Text(name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AppColors.textPrimary)),
              ),
              Text(
                '\$${_fmt(value)}',
                style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.success,
                    fontSize: 16),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (customer.isNotEmpty)
            Text(customer,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Row(
            children: [
              StatusBadge(status: stage),
              if (probability != null) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.infoLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('${probability}% probability',
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.info)),
                ),
              ],
              const Spacer(),
              if (closingDate != null)
                Text(
                  _formatDate(closingDate),
                  style: const TextStyle(
                      fontSize: 11, color: AppColors.textLight),
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

  String _formatDate(dynamic date) {
    final d = DateTime.tryParse(date.toString());
    if (d == null) return date.toString();
    return '${d.day}/${d.month}/${d.year}';
  }
}
