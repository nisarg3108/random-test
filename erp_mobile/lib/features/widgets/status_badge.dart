import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final color = _getColor(status.toUpperCase());
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _formatStatus(status),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Color _getColor(String s) {
    switch (s) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'PAID':
      case 'COMPLETED':
      case 'WON':
        return AppColors.success;
      case 'PENDING':
      case 'DRAFT':
      case 'NEW':
      case 'QUALIFYING':
        return AppColors.warning;
      case 'REJECTED':
      case 'CANCELLED':
      case 'LOST':
      case 'OVERDUE':
        return AppColors.error;
      case 'INACTIVE':
      case 'ON_HOLD':
        return AppColors.textSecondary;
      case 'IN_PROGRESS':
      case 'PROCESSING':
      case 'PROPOSAL':
        return AppColors.info;
      default:
        return AppColors.textSecondary;
    }
  }

  String _formatStatus(String s) {
    return s.replaceAll('_', ' ').toLowerCase().split(' ').map((w) {
      if (w.isEmpty) return w;
      return w[0].toUpperCase() + w.substring(1);
    }).join(' ');
  }
}
