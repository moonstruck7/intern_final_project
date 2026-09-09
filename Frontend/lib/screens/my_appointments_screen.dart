import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/appointment_model.dart';
import '../models/service_model.dart';
import '../theme/salon_theme.dart';
import '../widgets/appointment_status_badge.dart';
import '../widgets/custom_shimmer_loader.dart';
import '../widgets/error_banner_widget.dart';
import '../widgets/loyalty_card_widget.dart';

typedef AppointmentLoader = Future<List<AppointmentModel>> Function();
typedef AppointmentAction = Future<void> Function(String appointmentId);

class AppointmentsController extends ChangeNotifier {
  AppointmentsController({
    AppointmentLoader? loader,
    AppointmentAction? cancelAction,
    AppointmentAction? rescheduleAction,
  })  : _loader = loader ?? _defaultLoader,
        _cancelAction = cancelAction ?? _defaultAction,
        _rescheduleAction = rescheduleAction ?? _defaultAction;

  final AppointmentLoader _loader;
  final AppointmentAction _cancelAction;
  final AppointmentAction _rescheduleAction;

  List<AppointmentModel> _appointments = const [];
  bool isLoading = false;
  String? error;
  final Set<String> _busyIds = <String>{};

  List<AppointmentModel> get upcoming => _appointments
      .where((item) =>
          item.status == AppointmentStatus.upcoming &&
          !item.dateTime.isBefore(DateTime.now()))
      .toList()
    ..sort((a, b) => a.dateTime.compareTo(b.dateTime));

  List<AppointmentModel> get past => _appointments
      .where((item) =>
          item.status != AppointmentStatus.upcoming ||
          item.dateTime.isBefore(DateTime.now()))
      .toList()
    ..sort((a, b) => b.dateTime.compareTo(a.dateTime));

  bool isBusy(String id) => _busyIds.contains(id);

  Future<void> load() async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      _appointments = List.unmodifiable(await _loader());
    } catch (e) {
      error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> cancel(String id) async {
    if (_busyIds.contains(id)) return;
    _busyIds.add(id);
    notifyListeners();

    try {
      await _cancelAction(id);
      _appointments = _appointments
          .map(
            (appointment) => appointment.id == id
                ? appointment.copyWith(status: AppointmentStatus.cancelled)
                : appointment,
          )
          .toList(growable: false);
    } finally {
      _busyIds.remove(id);
      notifyListeners();
    }
  }

  Future<void> reschedule(String id, DateTime newDateTime) async {
    if (_busyIds.contains(id)) return;
    _busyIds.add(id);
    notifyListeners();

    try {
      await _rescheduleAction(id);
      _appointments = _appointments
          .map(
            (appointment) => appointment.id == id
                ? appointment.copyWith(dateTime: newDateTime)
                : appointment,
          )
          .toList(growable: false);
    } finally {
      _busyIds.remove(id);
      notifyListeners();
    }
  }

  static Future<void> _defaultAction(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 450));
  }

  static Future<List<AppointmentModel>> _defaultLoader() async {
    await Future<void>.delayed(const Duration(milliseconds: 650));

    final now = DateTime.now();
    const service = ServiceModel(
      id: 'hydr-01',
      name: 'Signature Hydrafacial',
      category: 'Facial',
      description: 'Deep cleansing and hydration.',
      durationMinutes: 45,
      price: 185,
      imageUrl:
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=85',
    );

    return [
      AppointmentModel(
        id: 'apt-1001',
        service: service,
        dateTime: DateTime(now.year, now.month, now.day + 2, 14, 30),
        durationMinutes: 45,
        staffName: 'Emma',
        staffImageUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        status: AppointmentStatus.upcoming,
        totalPrice: 185,
      ),
      AppointmentModel(
        id: 'apt-1002',
        service: service.copyWith(
          id: 'hair-01',
          name: 'Signature Haircut',
          category: 'Hair',
          durationMinutes: 60,
          price: 85,
          imageUrl:
              'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=85',
        ),
        dateTime: DateTime(now.year, now.month, now.day - 12, 11, 0),
        durationMinutes: 60,
        staffName: 'Sarah',
        staffImageUrl:
            'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
        status: AppointmentStatus.completed,
        totalPrice: 85,
      ),
    ];
  }
}

class MyAppointmentsScreen extends StatelessWidget {
  const MyAppointmentsScreen({
    super.key,
    this.loadAppointments,
    this.onCancel,
    this.onReschedule,
  });

  final AppointmentLoader? loadAppointments;
  final AppointmentAction? onCancel;
  final AppointmentAction? onReschedule;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppointmentsController(
        loader: loadAppointments,
        cancelAction: onCancel,
        rescheduleAction: onReschedule,
      )..load(),
      child: const _AppointmentsView(),
    );
  }
}

class _AppointmentsView extends StatelessWidget {
  const _AppointmentsView();

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppointmentsController>();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Bookings'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(52),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: Container(
                height: 42,
                decoration: BoxDecoration(
                  color: SalonTheme.warmSurface,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: TabBar(
                  padding: const EdgeInsets.all(4),
                  indicator: BoxDecoration(
                    gradient: SalonTheme.cocoaGradient,
                    borderRadius: BorderRadius.circular(26),
                    boxShadow: [
                      BoxShadow(
                        color: SalonTheme.cocoa.withValues(alpha: 0.30),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: Colors.white,
                  unselectedLabelColor: SalonTheme.cocoa,
                  labelStyle: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                  unselectedLabelStyle: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(fontWeight: FontWeight.w700),
                  tabs: const [
                    Tab(text: 'Upcoming'),
                    Tab(text: 'Past'),
                  ],
                ),
              ),
            ),
          ),
        ),
        body: RefreshIndicator(
          color: SalonTheme.cocoa,
          onRefresh: controller.load,
          child: TabBarView(
            children: [
              _AppointmentList(
                appointments: controller.upcoming,
                controller: controller,
                emptyTitle: 'No upcoming appointments',
                emptyMessage:
                    'Your next salon visit will appear here after you book.',
                allowActions: true,
                showLoyalty: true,
              ),
              _AppointmentList(
                appointments: controller.past,
                controller: controller,
                emptyTitle: 'No past appointments',
                emptyMessage:
                    'Completed and cancelled appointments will appear here.',
                allowActions: false,
                showLoyalty: false,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AppointmentList extends StatelessWidget {
  const _AppointmentList({
    required this.appointments,
    required this.controller,
    required this.emptyTitle,
    required this.emptyMessage,
    required this.allowActions,
    required this.showLoyalty,
  });

  final List<AppointmentModel> appointments;
  final AppointmentsController controller;
  final String emptyTitle;
  final String emptyMessage;
  final bool allowActions;
  final bool showLoyalty;

  @override
  Widget build(BuildContext context) {
    if (controller.isLoading) {
      return ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: 3,
        separatorBuilder: (_, _) => const SizedBox(height: 14),
        itemBuilder: (_, _) => const AppointmentCardShimmer(),
      );
    }

    if (controller.error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          ErrorBannerWidget(
            message: controller.error!,
            onRetry: controller.load,
          ),
        ],
      );
    }

    if (appointments.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(
            height: MediaQuery.sizeOf(context).height * .62,
            child: SalonEmptyState(
              title: emptyTitle,
              message: emptyMessage,
              icon: allowActions
                  ? Icons.calendar_month_outlined
                  : Icons.history_rounded,
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 32),
      itemCount: appointments.length + (showLoyalty ? 1 : 0),
      itemBuilder: (context, index) {
        if (showLoyalty && index == 0) {
          return const Padding(
            padding: EdgeInsets.only(top: 18, bottom: 6),
            child: LoyaltyCardWidget(
              points: 320,
              tier: 'Gold',
              nextTierPoints: 500,
              appointmentsCount: 8,
              totalSpent: 1240,
            ),
          );
        }
        final apptIndex = showLoyalty ? index - 1 : index;
        return Padding(
          padding: EdgeInsets.fromLTRB(
              20, apptIndex == 0 ? 14 : 0, 20, 14),
          child: _AppointmentCard(
            appointment: appointments[apptIndex],
            controller: controller,
            allowActions: allowActions,
          ),
        );
      },
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  const _AppointmentCard({
    required this.appointment,
    required this.controller,
    required this.allowActions,
  });

  final AppointmentModel appointment;
  final AppointmentsController controller;
  final bool allowActions;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final busy = controller.isBusy(appointment.id);
    final isUpcoming = appointment.status == AppointmentStatus.upcoming;

    // Left accent color
    final accentColor = switch (appointment.status) {
      AppointmentStatus.upcoming => SalonTheme.cocoa,
      AppointmentStatus.completed => const Color(0xFF2D7A4F),
      AppointmentStatus.cancelled => const Color(0xFF9E2D2D),
    };

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border(
          left: BorderSide(color: accentColor, width: 4),
        ),
        boxShadow: [
          BoxShadow(
            color: accentColor.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            // ── Top row: status + date ──────────────────────────
            Row(
              children: [
                AppointmentStatusBadge(status: appointment.status),
                const Spacer(),
                if (isUpcoming) _CountdownChip(dateTime: appointment.dateTime),
                if (!isUpcoming)
                  Text(
                    _dateLabel(appointment.dateTime),
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: scheme.onSurfaceVariant,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
              ],
            ),

            const SizedBox(height: 14),

            // ── Image + details row ─────────────────────────────
            Row(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    SizedBox(
                      width: 80,
                      height: 80,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(
                          appointment.service.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            color: scheme.surfaceContainerHighest,
                            child: const Icon(Icons.spa_rounded),
                          ),
                        ),
                      ),
                    ),
                    // Staff avatar overlapping
                    Positioned(
                      bottom: -8,
                      right: -8,
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white, width: 2),
                        ),
                        child: CircleAvatar(
                          radius: 14,
                          backgroundImage: NetworkImage(
                              appointment.staffImageUrl),
                          onBackgroundImageError: (_, _) {},
                          backgroundColor: scheme.primaryContainer,
                          child: appointment.staffImageUrl.isEmpty
                              ? const Icon(Icons.person_rounded,
                                  size: 14)
                              : null,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.service.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.schedule_rounded,
                              size: 13,
                              color: scheme.onSurfaceVariant),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              appointment.timeRange,
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: scheme.onSurfaceVariant,
                                  ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Icon(Icons.person_outline_rounded,
                              size: 13,
                              color: scheme.onSurfaceVariant),
                          const SizedBox(width: 3),
                          Text(
                            appointment.staffName,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                  color: scheme.onSurfaceVariant,
                                ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 9, vertical: 3),
                            decoration: BoxDecoration(
                              color: SalonTheme.warmSurface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '\$${appointment.totalPrice.toStringAsFixed(0)}',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelMedium
                                  ?.copyWith(
                                    color: SalonTheme.cocoa,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // ── Action buttons ──────────────────────────────────
            if (allowActions && isUpcoming) ...[
              const SizedBox(height: 14),
              const Divider(),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.close_rounded, size: 16),
                      label: const Text('Cancel'),
                      onPressed: busy
                          ? null
                          : () => _showCancelDialog(context, controller),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.tonal(
                      style: FilledButton.styleFrom(
                        backgroundColor: SalonTheme.warmSurface,
                        foregroundColor: SalonTheme.cocoa,
                      ),
                      onPressed: busy
                          ? null
                          : () =>
                              _showReschedulePicker(context, controller),
                      child: busy
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.edit_calendar_rounded,
                                    size: 16),
                                SizedBox(width: 6),
                                Text('Reschedule'),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ],

            // ── Review CTA for completed ────────────────────────
            if (!allowActions &&
                appointment.status == AppointmentStatus.completed) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.star_border_rounded, size: 16),
                  label: const Text('Leave a Review'),
                  onPressed: () {},
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _showCancelDialog(
    BuildContext context,
    AppointmentsController controller,
  ) async {
    final shouldCancel = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel appointment?'),
        content: const Text(
          'This will cancel the selected appointment. You can book a new slot anytime.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Keep'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (shouldCancel == true && context.mounted) {
      await controller.cancel(appointment.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment cancelled.')),
        );
      }
    }
  }

  Future<void> _showReschedulePicker(
    BuildContext context,
    AppointmentsController controller,
  ) async {
    final today = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(today.year, today.month, today.day),
      lastDate: DateTime(today.year, today.month, today.day + 90),
      initialDate: appointment.dateTime.isBefore(today)
          ? DateTime(today.year, today.month, today.day)
          : appointment.dateTime,
    );

    if (picked == null || !context.mounted) return;

    final selectedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(appointment.dateTime),
    );

    if (selectedTime == null || !context.mounted) return;

    final newDateTime = DateTime(
      picked.year,
      picked.month,
      picked.day,
      selectedTime.hour,
      selectedTime.minute,
    );

    await controller.reschedule(appointment.id, newDateTime);

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Appointment rescheduled successfully.')),
      );
    }
  }

  String _dateLabel(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}

// ── Countdown chip for upcoming appointments ─────────────────────────────────
class _CountdownChip extends StatelessWidget {
  const _CountdownChip({required this.dateTime});

  final DateTime dateTime;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final diff = dateTime.difference(now);

    String label;
    Color bgColor;

    if (diff.inDays == 0) {
      label = 'Today';
      bgColor = const Color(0xFFFF7043);
    } else if (diff.inDays == 1) {
      label = 'Tomorrow';
      bgColor = SalonTheme.cocoa;
    } else {
      label = 'In ${diff.inDays} days';
      bgColor = SalonTheme.cocoaLight;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
      ),
    );
  }
}
