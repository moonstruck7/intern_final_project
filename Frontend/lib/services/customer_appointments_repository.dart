import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../auth/auth_repository.dart';
import '../models/appointment_model.dart';
import '../models/booking_models.dart';
import '../models/service_model.dart';
import 'customer_booking_repository.dart';
import 'service_catalog_repository.dart';

class CustomerAppointmentsRepository {
  CustomerAppointmentsRepository({
    required this.apiClient,
    required this.authRepository,
    required this.serviceCatalogRepository,
    required this.bookingRepository,
  });

  final ApiClient apiClient;
  final AuthRepository authRepository;
  final ServiceCatalogRepository serviceCatalogRepository;
  final CustomerBookingRepository bookingRepository;

  Future<List<AppointmentModel>> fetchHistory() async {
    final responses = await Future.wait([
      authRepository.authorized(
        (token) => apiClient.get(
          '/api/v1/customer/me/appointments',
          accessToken: token,
        ),
      ),
      serviceCatalogRepository.fetchServices(),
      bookingRepository.fetchStaff(),
    ]);
    final appointmentResponse = responses[0];
    if (appointmentResponse is! Map || appointmentResponse['data'] is! List) {
      throw const ApiException(
        message: 'The appointment history response is invalid.',
      );
    }
    final serviceList = List<ServiceModel>.from(responses[1] as List);
    final services = {for (final service in serviceList) service.id: service};
    final staff = {
      for (final person in responses[2] as List<BookingStaff>)
        person.id: person.displayName,
    };
    try {
      return List.unmodifiable(
        (appointmentResponse['data'] as List).map((item) {
          if (item is! Map) throw const FormatException();
          return AppointmentModel.fromCustomerJson(
            item.cast<String, dynamic>(),
            servicesById: services,
            staffNamesById: staff,
          );
        }),
      );
    } on FormatException {
      throw const ApiException(
        message: 'The appointment history contains invalid information.',
      );
    }
  }
}
