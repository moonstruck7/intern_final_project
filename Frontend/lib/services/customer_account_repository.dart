// ignore_for_file: curly_braces_in_flow_control_structures

import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../models/customer_finance_models.dart';

class CustomerAccountRepository {
  CustomerAccountRepository({
    required this.apiClient,
    required this.authRepository,
  });
  final ApiClient apiClient;
  final AuthRepository authRepository;

  Future<List<CustomerInvoice>> fetchInvoices() => _list(
    '/api/v1/customer/me/invoices',
    CustomerInvoice.fromJson,
    'invoice history',
  );
  Future<List<CustomerNotification>> fetchNotifications() => _list(
    '/api/v1/customer/me/notifications',
    CustomerNotification.fromJson,
    'notifications',
  );
  Future<CustomerNotification> markNotificationRead(String id) async {
    final response = await authRepository.authorized(
      (token) => apiClient.request(
        'PATCH',
        '/api/v1/customer/me/notifications/$id/read',
        accessToken: token,
      ),
    );
    if (response is! Map || response['data'] is! Map)
      throw const ApiException(
        message: 'The notification response is invalid.',
      );
    try {
      return CustomerNotification.fromJson(
        (response['data'] as Map).cast<String, dynamic>(),
      );
    } on FormatException {
      throw const ApiException(
        message: 'The notification response is invalid.',
      );
    }
  }

  Future<List<T>> _list<T>(
    String path,
    T Function(Map<String, dynamic>) parser,
    String label,
  ) async {
    final response = await authRepository.authorized(
      (token) => apiClient.get(path, accessToken: token),
    );
    if (response is! Map || response['data'] is! List)
      throw ApiException(message: 'The $label response is invalid.');
    try {
      return List.unmodifiable(
        (response['data'] as List).map((item) {
          if (item is! Map) throw const FormatException();
          return parser(item.cast<String, dynamic>());
        }),
      );
    } on FormatException {
      throw ApiException(
        message: 'The $label contains invalid information. Please try again.',
      );
    }
  }
}
