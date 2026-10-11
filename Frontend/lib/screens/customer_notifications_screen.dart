// ignore_for_file: curly_braces_in_flow_control_structures

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../models/customer_finance_models.dart';
import '../services/customer_account_repository.dart';
import '../theme/salon_theme.dart';
import '../widgets/error_banner_widget.dart';
import 'my_appointments_screen.dart';

class CustomerNotificationsController extends ChangeNotifier {
  CustomerNotificationsController(this.repository);
  final CustomerAccountRepository repository;
  List<CustomerNotification> notifications = const [];
  bool loading = false;
  String? error;

  int get unreadCount => notifications.where((n) => n.isUnread).length;

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      notifications = await repository.fetchNotifications();
    } on ApiException catch (e) {
      error = e.message;
    } catch (_) {
      error = 'Unable to load notifications. Please try again.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(CustomerNotification notification) async {
    if (!notification.isUnread) return;
    try {
      final updated = await repository.markNotificationRead(notification.id);
      notifications = List.unmodifiable(
        notifications.map((item) => item.id == updated.id ? updated : item),
      );
      notifyListeners();
    } on ApiException catch (e) {
      error = e.message;
      notifyListeners();
    }
  }

  Future<void> markAllRead() async {
    final unread = notifications.where((n) => n.isUnread).toList();
    for (final item in unread) {
      try {
        final updated = await repository.markNotificationRead(item.id);
        notifications = List.unmodifiable(
          notifications.map((n) => n.id == updated.id ? updated : n),
        );
      } catch (_) {}
    }
    notifyListeners();
  }
}

class CustomerNotificationsScreen extends StatelessWidget {
  const CustomerNotificationsScreen({
    super.key,
    this.onNavigateToBookings,
    this.onNavigateToProfile,
  });

  final VoidCallback? onNavigateToBookings;
  final VoidCallback? onNavigateToProfile;

  @override
  Widget build(BuildContext context) => ChangeNotifierProvider(
    create: (context) => CustomerNotificationsController(
      CustomerAccountRepository(
        apiClient: context.read<ApiClient>(),
        authRepository: context.read<AuthRepository>(),
      ),
    )..load(),
    child: _NotificationsView(
      onNavigateToBookings: onNavigateToBookings,
      onNavigateToProfile: onNavigateToProfile,
    ),
  );
}

class _NotificationsView extends StatelessWidget {
  const _NotificationsView({
    this.onNavigateToBookings,
    this.onNavigateToProfile,
  });

  final VoidCallback? onNavigateToBookings;
  final VoidCallback? onNavigateToProfile;

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CustomerNotificationsController>();
    return Scaffold(
      backgroundColor: SalonTheme.cream,
      appBar: AppBar(
        backgroundColor: SalonTheme.cream,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'Inbox',
          style: GoogleFonts.playfairDisplay(
            fontWeight: FontWeight.w700,
            fontSize: 22,
            color: SalonTheme.deepChocolate,
          ),
        ),
        actions: [
          if (controller.unreadCount > 0)
            TextButton.icon(
              onPressed: controller.markAllRead,
              icon: const Icon(Icons.done_all_rounded, size: 16),
              label: const Text('Mark all read'),
              style: TextButton.styleFrom(
                foregroundColor: SalonTheme.cocoa,
                textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        color: SalonTheme.cocoa,
        onRefresh: controller.load,
        child: _body(context, controller),
      ),
    );
  }

  Widget _body(
    BuildContext context,
    CustomerNotificationsController controller,
  ) {
    if (controller.loading) {
      return const Center(
        child: CircularProgressIndicator(color: SalonTheme.cocoa),
      );
    }
    if (controller.error != null) {
      return ListView(
        children: [
          ErrorBannerWidget(
            message: controller.error!,
            onRetry: controller.load,
          ),
        ],
      );
    }
    if (controller.notifications.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 200),
          SalonEmptyState(
            title: 'No notifications',
            message: 'Updates about your appointments and salon visits will appear here.',
            icon: Icons.notifications_none_rounded,
          ),
        ],
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: controller.notifications.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (_, index) {
        final item = controller.notifications[index];
        return _NotificationCard(
          notification: item,
          onTap: () => _handleNotificationTap(context, controller, item),
        );
      },
    );
  }

  void _handleNotificationTap(
    BuildContext context,
    CustomerNotificationsController controller,
    CustomerNotification notification,
  ) {
    controller.markRead(notification);

    final title = notification.title.toLowerCase();
    final body = notification.body.toLowerCase();

    final isBooking = title.contains('appointment') ||
        title.contains('booking') ||
        body.contains('appointment') ||
        body.contains('booking');

    final isProfile = title.contains('profile') ||
        title.contains('personal information') ||
        body.contains('personal information') ||
        body.contains('profile');

    if (isBooking) {
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
      if (onNavigateToBookings != null) {
        onNavigateToBookings!();
      } else {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => const MyAppointmentsScreen(),
          ),
        );
      }
    } else if (isProfile) {
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }
      if (onNavigateToProfile != null) {
        onNavigateToProfile!();
      }
    }
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    required this.onTap,
  });

  final CustomerNotification notification;
  final VoidCallback onTap;

  String _timeAgo(DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }

  (Color accent, Color bg, IconData icon) _styleFor(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('appointment') || lower.contains('booking') || lower.contains('visit')) {
      return (SalonTheme.cocoa, const Color(0xFFF5E3D9), Icons.calendar_month_rounded);
    }
    if (lower.contains('offer') || lower.contains('promo') || lower.contains('discount') || lower.contains('%')) {
      return (SalonTheme.roseDust, const Color(0xFFF5E0E4), Icons.local_offer_rounded);
    }
    if (lower.contains('welcome') || lower.contains('points') || lower.contains('reward')) {
      return (SalonTheme.goldAccent, const Color(0xFFFAF0DC), Icons.stars_rounded);
    }
    if (lower.contains('profile')) {
      return (const Color(0xFF5C6BC0), const Color(0xFFE8EAF6), Icons.person_rounded);
    }
    return (SalonTheme.cocoa, const Color(0xFFF0EAE4), Icons.notifications_rounded);
  }

  @override
  Widget build(BuildContext context) {
    final (accentColor, bgColor, icon) = _styleFor(notification.title);
    final isUnread = notification.isUnread;

    final lowerTitle = notification.title.toLowerCase();
    final lowerBody = notification.body.toLowerCase();
    String? actionLabel;
    if (lowerTitle.contains('appointment') ||
        lowerTitle.contains('booking') ||
        lowerBody.contains('appointment') ||
        lowerBody.contains('booking')) {
      actionLabel = 'View bookings';
    } else if (lowerTitle.contains('profile') ||
        lowerTitle.contains('personal information') ||
        lowerBody.contains('personal information') ||
        lowerBody.contains('profile')) {
      actionLabel = 'View profile';
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          decoration: BoxDecoration(
            color: isUnread ? Colors.white : const Color(0xFFFAF5F1),
            borderRadius: BorderRadius.circular(18),
            border: Border(left: BorderSide(color: accentColor, width: 4.5)),
            boxShadow: isUnread
                ? [
                    BoxShadow(
                      color: accentColor.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
                child: Icon(icon, size: 20, color: accentColor),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: isUnread ? FontWeight.w800 : FontWeight.w600,
                              color: SalonTheme.deepChocolate,
                            ),
                          ),
                        ),
                        if (isUnread) ...[
                          const SizedBox(width: 6),
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: SalonTheme.cocoa,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      notification.body,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _timeAgo(notification.createdAt),
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: accentColor,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (actionLabel != null)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                actionLabel,
                                style: GoogleFonts.plusJakartaSans(
                                  color: accentColor,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward_ios_rounded,
                                size: 10,
                                color: accentColor,
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
