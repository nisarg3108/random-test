import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_strings.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _tabs = [
    _TabItem(icon: Icons.dashboard_rounded, label: AppStrings.dashboard, path: '/dashboard'),
    _TabItem(icon: Icons.people_rounded, label: AppStrings.hr, path: '/hr'),
    _TabItem(icon: Icons.account_balance_wallet_rounded, label: AppStrings.payroll, path: '/payroll'),
    _TabItem(icon: Icons.business_center_rounded, label: AppStrings.crm, path: '/crm'),
    _TabItem(icon: Icons.inventory_2_rounded, label: AppStrings.inventory, path: '/inventory'),
    _TabItem(icon: Icons.receipt_long_rounded, label: AppStrings.finance, path: '/finance'),
    _TabItem(icon: Icons.more_horiz_rounded, label: AppStrings.more, path: '/more'),
  ];

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _getSelectedIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: selectedIndex,
          onTap: (index) => context.go(_tabs[index].path),
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textLight,
          selectedLabelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 10,
          ),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          backgroundColor: Colors.white,
          elevation: 0,
          items: _tabs
              .map(
                (tab) => BottomNavigationBarItem(
                  icon: Icon(tab.icon, size: 22),
                  activeIcon: Icon(tab.icon, size: 22),
                  label: tab.label,
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

class _TabItem {
  final IconData icon;
  final String label;
  final String path;
  const _TabItem({
    required this.icon,
    required this.label,
    required this.path,
  });
}
