import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../models/service_model.dart';

class ServiceCatalogRepository {
  ServiceCatalogRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<ServiceModel>> fetchServices() async {
    final response = await _apiClient.get('/api/v1/catalog/services');
    if (response is! Map || response['data'] is! List) {
      throw const ApiException(
        message: 'The service catalog response is invalid. Please try again.',
      );
    }

    try {
      return List.unmodifiable(
        (response['data'] as List)
            .map((item) {
              if (item is! Map) {
                throw const FormatException('Invalid service catalog item.');
              }
              return ServiceModel.fromCatalogJson(item.cast<String, dynamic>());
            })
            // The backend contract already sends active services only. This
            // defensive check prevents an inactive service from being shown if
            // a malformed deployment violates that contract.
            .where((service) => service.status == 'active'),
      );
    } on FormatException {
      throw const ApiException(
        message: 'The service catalog contains invalid information. Please try again.',
      );
    }
  }
}
