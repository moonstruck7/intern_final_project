import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:salon_app/api/api_client.dart';
import 'package:salon_app/api/api_exception.dart';
import 'package:salon_app/models/service_model.dart';
import 'package:salon_app/screens/service_catalog_screen.dart';
import 'package:salon_app/services/service_catalog_repository.dart';

const _baseUrl = 'https://salon.test';

void main() {
  group('ServiceCatalogRepository', () {
    test(
      'parses canonical service fields and preserves the backend id',
      () async {
        final repository = _repository(
          MockClient((request) async {
            expect(request.method, 'GET');
            expect(request.url.path, '/api/v1/catalog/services');
            expect(request.headers.containsKey('authorization'), isFalse);
            return _json({
              'data': [_serviceJson()],
            });
          }),
        );

        final services = await repository.fetchServices();

        expect(services, hasLength(1));
        expect(services.single.id, '507f1f77bcf86cd799439011');
        expect(services.single.categoryId, '507f1f77bcf86cd799439012');
        expect(services.single.name, 'Precision Haircut');
        expect(services.single.price, 75.5);
        expect(services.single.durationMinutes, 45);
        expect(services.single.status, 'active');
        expect(services.single.description, isEmpty);
      },
    );

    test(
      'keeps only active services if an unexpected inactive item is returned',
      () async {
        final repository = _repository(
          MockClient(
            (_) async => _json({
              'data': [
                _serviceJson(),
                _serviceJson(
                  id: '507f1f77bcf86cd799439013',
                  status: 'inactive',
                ),
              ],
            }),
          ),
        );

        final services = await repository.fetchServices();

        expect(services.map((service) => service.id), [
          '507f1f77bcf86cd799439011',
        ]);
      },
    );

    test(
      'rejects a malformed catalog item instead of inventing values',
      () async {
        final repository = _repository(
          MockClient(
            (_) async => _json({
              'data': [
                {'_id': 'service-1', 'name': 'Missing required fields'},
              ],
            }),
          ),
        );

        await expectLater(
          repository.fetchServices(),
          throwsA(
            isA<ApiException>().having(
              (error) => error.message,
              'message',
              'The service catalog contains invalid information. Please try again.',
            ),
          ),
        );
      },
    );

    test('maps backend API failures to the centralized safe error', () async {
      final repository = _repository(
        MockClient(
          (_) async => _json({
            'error': {'code': 'INTERNAL_ERROR', 'message': 'database detail'},
          }, statusCode: 500),
        ),
      );

      await expectLater(
        repository.fetchServices(),
        throwsA(
          isA<ApiException>().having(
            (error) => error.message,
            'message',
            'The service is temporarily unavailable. Please try again.',
          ),
        ),
      );
    });

    test(
      'returns an empty list when the backend has no active services',
      () async {
        final repository = _repository(
          MockClient((_) async => _json({'data': []})),
        );

        await expectLater(repository.fetchServices(), completion(isEmpty));
      },
    );
  });

  test(
    'catalog controller moves through loading and successful states',
    () async {
      final controller = ServiceCatalogController(
        loader: () async => [ServiceModel.fromCatalogJson(_serviceJson())],
      );

      expect(controller.isLoading, isFalse);
      await controller.load();
      expect(controller.isLoading, isFalse);
      expect(controller.error, isNull);
      expect(controller.services.single.id, '507f1f77bcf86cd799439011');
    },
  );

  test('catalog controller exposes a safe repository error state', () async {
    final controller = ServiceCatalogController(
      loader: () async => throw const ApiException(
        message: 'Unable to load services. Please try again.',
      ),
    );

    await controller.load();

    expect(controller.isLoading, isFalse);
    expect(controller.services, isEmpty);
    expect(controller.error, 'Unable to load services. Please try again.');
  });
}

ServiceCatalogRepository _repository(http.Client httpClient) =>
    ServiceCatalogRepository(
      ApiClient(baseUrl: _baseUrl, httpClient: httpClient),
    );

http.Response _json(Map<String, dynamic> body, {int statusCode = 200}) =>
    http.Response(
      jsonEncode(body),
      statusCode,
      headers: {'content-type': 'application/json'},
    );

Map<String, dynamic> _serviceJson({
  String id = '507f1f77bcf86cd799439011',
  String status = 'active',
}) => {
  '_id': id,
  'name': 'Precision Haircut',
  'categoryId': '507f1f77bcf86cd799439012',
  'price': 75.5,
  'durationMinutes': 45,
  'status': status,
};
