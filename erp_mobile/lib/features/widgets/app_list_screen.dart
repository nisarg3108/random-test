import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class AppListScreen extends StatefulWidget {
  final String title;
  final Color color;
  final IconData icon;
  final String endpoint;
  final Widget Function(Map<String, dynamic>) itemBuilder;
  final Future<List<dynamic>> Function(String query, int page) fetcher;
  final VoidCallback? onAdd;
  final List<Widget>? filters;

  const AppListScreen({
    super.key,
    required this.title,
    required this.color,
    required this.icon,
    required this.endpoint,
    required this.itemBuilder,
    required this.fetcher,
    this.onAdd,
    this.filters,
  });

  @override
  State<AppListScreen> createState() => _AppListScreenState();
}

class _AppListScreenState extends State<AppListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<dynamic> _items = [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;
  int _page = 1;
  bool _hasMore = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadItems();
    _scrollController.addListener(_onScroll);
    _searchController.addListener(() {
      final q = _searchController.text;
      if (q != _searchQuery) {
        _searchQuery = q;
        _refresh();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_loadingMore &&
        _hasMore) {
      _loadMore();
    }
  }

  Future<void> _loadItems() async {
    setState(() {
      _loading = true;
      _error = null;
      _page = 1;
    });
    try {
      final items = await widget.fetcher(_searchQuery, 1);
      if (mounted) {
        setState(() {
          _items = items;
          _loading = false;
          _hasMore = items.length >= 20;
          _page = 2;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore) return;
    setState(() => _loadingMore = true);
    try {
      final items = await widget.fetcher(_searchQuery, _page);
      if (mounted) {
        setState(() {
          _items.addAll(items);
          _loadingMore = false;
          _hasMore = items.length >= 20;
          _page++;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _refresh() async {
    await _loadItems();
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
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: widget.color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(widget.icon, color: widget.color, size: 18),
            ),
            const SizedBox(width: 10),
            Text(
              widget.title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
        actions: [
          if (widget.onAdd != null)
            IconButton(
              onPressed: widget.onAdd,
              icon: Icon(Icons.add_circle_outline_rounded,
                  color: widget.color, size: 26),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search...',
                hintStyle:
                    const TextStyle(color: AppColors.textLight, fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: AppColors.textLight, size: 20),
                filled: true,
                fillColor: AppColors.background,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: widget.color,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.primary))
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            color: AppColors.error, size: 48),
                        const SizedBox(height: 12),
                        Text('Error loading data',
                            style: TextStyle(color: AppColors.textSecondary)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                            onPressed: _loadItems,
                            child: const Text('Retry')),
                      ],
                    ),
                  )
                : _items.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(widget.icon,
                                color: AppColors.textLight, size: 56),
                            const SizedBox(height: 12),
                            const Text('No items found',
                                style: TextStyle(color: AppColors.textSecondary)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length + (_loadingMore ? 1 : 0),
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          if (index == _items.length) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(
                                  color: AppColors.primary, strokeWidth: 2),
                              ),
                            );
                          }
                          return widget.itemBuilder(
                              Map<String, dynamic>.from(_items[index]));
                        },
                      ),
      ),
    );
  }
}
