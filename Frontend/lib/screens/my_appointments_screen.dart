import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/appointment_model.dart';
import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../services/customer_appointments_repository.dart';
import '../services/customer_booking_repository.dart';
import '../services/service_catalog_repository.dart';
import '../theme/salon_theme.dart';
import '../widgets/appointment_status_badge.dart';
import '../widgets/custom_shimmer_loader.dart';
import '../widgets/error_banner_widget.dart';
import '../widgets/loyalty_card_widget.dart';

typedef AppointmentLoader = Future<List<AppointmentModel>> Function();

class AppointmentsController extends ChangeNotifier {
  AppointmentsController({required this.loader});

  final AppointmentLoader loader;

  List<AppointmentModel> _appointments = const [];
  bool isLoading = false;
  String? error;
  final Set<String> _busyIds = <String>{};

  List<AppointmentModel> get upcoming =>
      _appointments
          .where(
            (item) =>
                item.status == AppointmentStatus.upcoming &&
                !item.dateTime.isBefore(DateTime.now()),
          )
          .toList()
        ..sort((a, b) => a.dateTime.compareTo(b.dateTime));

  List<AppointmentModel> get past =>
      _appointments
          .where(
            (item) =>
                item.status != AppointmentStatus.upcoming ||
                item.dateTime.isBefore(DateTime.now()),
          )
          .toList()
        ..sort((a, b) => b.dateTime.compareTo(a.dateTime));

  bool isBusy(String id) => _busyIds.contains(id);

  Future<void> load() async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      _appointments = List.unmodifiable(await loader());
    } on ApiException catch (exception) {
      error = exception.message;
    } catch (_) {
      error = 'Unable to load appointments. Please try again.';
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}

class MyAppointmentsScreen extends StatelessWidget {
  const MyAppointmentsScreen({super.key, this.loadAppointments});

  final AppointmentLoader? loadAppointments;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => AppointmentsController(
        loader:
            loadAppointments ??
            CustomerAppointmentsRepository(
              apiClient: context.read<ApiClient>(),
              authRepository: context.read<AuthRepository>(),
              serviceCatalogRepository: ServiceCatalogRepository(
                context.read<ApiClient>(),
              ),
              bookingRepository: CustomerBookingRepository(
                apiClient: context.read<ApiClient>(),
                authRepository: context.read<AuthRepository>(),
              ),
            ).fetchHistory,
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
                      ),
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: Colors.white,
                  unselectedLabelColor: SalonTheme.cocoa,
                  labelStyle: Theme.of(context).textTheme.labelLarge
                      ?.copyWith(fontWeight: FontWeight.w800),
                  unselectedLabelStyle: Theme.of(context).textTheme.labelLarge
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
                allowActions: false,
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
          padding: EdgeInsets.fromLTRB(20, apptIndex == 0 ? 14 : 0, 20, 14),
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
        border: Border(left: BorderSide(color: accentColor, width: 4)),
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
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: CircleAvatar(
                          radius: 14,
                          backgroundImage: NetworkImage(
                            appointment.staffImageUrl,
                          ),
                          onBackgroundImageError: (_, _) {},
                          backgroundColor: scheme.primaryContainer,
                          child: appointment.staffImageUrl.isEmpty
                              ? const Icon(Icons.person_rounded, size: 14)
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
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.schedule_rounded,
                            size: 13,
                            color: scheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              appointment.timeRange,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: scheme.onSurfaceVariant),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Icon(
                            Icons.person_outline_rounded,
                            size: 13,
                            color: scheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            appointment.staffName,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: scheme.onSurfaceVariant),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: SalonTheme.warmSurface,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Price ${appointment.totalPrice?.toStringAsFixed(2) ?? ''}',
                              style: Theme.of(context).textTheme.labelMedium
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
                          : () => _showReschedulePicker(context, controller),
                      child: busy
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.edit_calendar_rounded, size: 16),
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
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Appointment changes are not available yet.'),
      ),
    );
  }

  Future<void> _showReschedulePicker(
    BuildContext context,
    AppointmentsController controller,
  ) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Appointment changes are not available yet.'),
      ),
    );
  }

  String _dateLabel(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
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
        style: Theme.of(context).textTheme.labelSmall
            ?.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
      ),
    );
  }
}
