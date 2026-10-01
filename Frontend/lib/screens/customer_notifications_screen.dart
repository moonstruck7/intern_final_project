// ignore_for_file: curly_braces_in_flow_control_structures

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../models/customer_finance_models.dart';
import '../services/customer_account_repository.dart';
import '../widgets/error_banner_widget.dart';

class CustomerNotificationsController extends ChangeNotifier {
  CustomerNotificationsController(this.repository);
  final CustomerAccountRepository repository;
  List<CustomerNotification> notifications = const [];
  bool loading = false;
  String? error;
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
}

class CustomerNotificationsScreen extends StatelessWidget {
  const CustomerNotificationsScreen({super.key});
  @override
  Widget build(BuildContext context) => ChangeNotifierProvider(
    create: (context) => CustomerNotificationsController(
      CustomerAccountRepository(
        apiClient: context.read<ApiClient>(),
        authRepository: context.read<AuthRepository>(),
      ),
    )..load(),
    child: const _NotificationsView(),
  );
}

class _NotificationsView extends StatelessWidget {
  const _NotificationsView();
  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CustomerNotificationsController>();
    return Scaffold(
      appBar: AppBar(title: const Text('Inbox')),
      body: RefreshIndicator(
        onRefresh: controller.load,
        child: _body(context, controller),
      ),
    );
  }

  Widget _body(
    BuildContext context,
    CustomerNotificationsController controller,
  ) {
    if (controller.loading)
      return const Center(child: CircularProgressIndicator());
    if (controller.error != null)
      return ListView(
        children: [
          ErrorBannerWidget(
            message: controller.error!,
            onRetry: controller.load,
          ),
        ],
      );
    if (controller.notifications.isEmpty)
      return ListView(
        children: const [
          SizedBox(height: 260),
          SalonEmptyState(
            title: 'No notifications',
            message: 'Updates about your salon visits will appear here.',
            icon: Icons.notifications_none_rounded,
          ),
        ],
      );
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: controller.notifications.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (_, index) {
        final item = controller.notifications[index];
        return Card(
          child: ListTile(
            onTap: () => controller.markRead(item),
            leading: Icon(
              item.isUnread
                  ? Icons.notifications_active_rounded
                  : Icons.notifications_none_rounded,
            ),
            title: Text(
              item.title,
              style: TextStyle(
                fontWeight: item.isUnread ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
            subtitle: Text(item.body),
            trailing: item.isUnread ? const Icon(Icons.circle, size: 10) : null,
          ),
        );
      },
    );
  }
}
