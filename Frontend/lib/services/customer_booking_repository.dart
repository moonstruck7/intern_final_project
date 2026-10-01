import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../models/booking_models.dart';

class CustomerBookingRepository {
  CustomerBookingRepository({
    required this.apiClient,
    required this.authRepository,
  });

  final ApiClient apiClient;
  final AuthRepository authRepository;

  Future<List<BookingStaff>> fetchStaff() async {
    final response = await authRepository.authorized(
      (token) => apiClient.get('/api/v1/customer/staff', accessToken: token),
    );
    return _parseList(response, BookingStaff.fromJson, 'staff directory');
  }

  Future<List<AvailabilityWindow>> fetchAvailability({
    required String staffId,
    required String date,
  }) async {
    final response = await authRepository.authorized(
      (token) => apiClient.get(
        '/api/v1/customer/staff/$staffId/availability?date=$date',
        accessToken: token,
      ),
    );
    final windows = _parseList(
      response,
      AvailabilityWindow.fromJson,
      'availability',
    );
    if (windows.any(
      (window) => window.staffId != staffId || window.date != date,
    )) {
      throw const ApiException(
        message: 'The availability response does not match the selected staff or date.',
      );
    }
    return windows;
  }

  Future<Map<String, dynamic>> createAppointment({
    required String serviceId,
    required String staffId,
    required String date,
    required String startTime,
  }) async {
    final response = await authRepository.authorized(
      (token) => apiClient.post(
        '/api/v1/customer/me/appointments',
        accessToken: token,
        body: {
          'serviceId': serviceId,
          'staffId': staffId,
          'date': date,
          'startTime': startTime,
        },
      ),
    );
    if (response is! Map || response['data'] is! Map) {
      throw const ApiException(message: 'The booking response is invalid.');
    }
    return response['data'].cast<String, dynamic>();
  }

  List<T> _parseList<T>(
    dynamic response,
    T Function(Map<String, dynamic>) parser,
    String label,
  ) {
    if (response is! Map || response['data'] is! List) {
      throw ApiException(
        message: 'The $label response is invalid. Please try again.',
      );
    }
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
