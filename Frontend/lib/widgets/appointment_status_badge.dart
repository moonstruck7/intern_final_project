import 'package:flutter/material.dart';
import '../models/appointment_model.dart';

class AppointmentStatusBadge extends StatelessWidget {
  const AppointmentStatusBadge({
    super.key,
    required this.status,
  });

  final AppointmentStatus status;

  @override
  Widget build(BuildContext context) {
    final (background, foreground, icon, label) = switch (status) {
      AppointmentStatus.upcoming => (
          const Color(0xFFEBF4EF),
          const Color(0xFF2D7A4F),
          Icons.schedule_rounded,
          'Upcoming',
        ),
      AppointmentStatus.completed => (
          const Color(0xFFEFF3FB),
          const Color(0xFF2D5A9E),
          Icons.check_circle_outline_rounded,
          'Completed',
        ),
      AppointmentStatus.cancelled => (
          const Color(0xFFFBEFEF),
          const Color(0xFF9E2D2D),
          Icons.cancel_outlined,
          'Cancelled',
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: foreground),
          const SizedBox(width: 5),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: foreground,
                  fontWeight: FontWeight.w800,
                  fontSize: 11.5,
                ),
          ),
        ],
      ),
    );
  }
}
