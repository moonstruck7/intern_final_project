import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:salon_app/api/api_client.dart';
import 'package:salon_app/api/api_exception.dart';
import 'package:salon_app/auth/auth_repository.dart';
import 'package:salon_app/auth/session.dart';
import 'package:salon_app/auth/session_store.dart';
import 'package:salon_app/services/customer_appointments_repository.dart';
import 'package:salon_app/services/customer_booking_repository.dart';
import 'package:salon_app/services/service_catalog_repository.dart';

const _baseUrl = 'https://salon.test';

void main() {
  group('CustomerBookingRepository', () {
    test('uses only the customer-safe directory and canonical ids', () async {
      final repository = _booking(
        MockClient((request) async {
          expect(request.url.path, '/api/v1/customer/staff');
          expect(request.headers['authorization'], 'Bearer access-token');
          return _json({
            'data': [
              {'_id': 'staff-1', 'displayName': 'Ava'},
            ],
          });
        }),
      );

      final staff = await repository.fetchStaff();

      expect(staff.single.id, 'staff-1');
      expect(staff.single.displayName, 'Ava');
    });

    test('rejects malformed staff and availability responses', () async {
      var calls = 0;
      final repository = _booking(
        MockClient((_) async {
          calls++;
          return _json({
            'data': calls == 1
                ? [
                    {'displayName': 'Ava'},
                  ]
                : [
                    {' _id': 'window'},
                  ],
          });
        }),
      );
      await expectLater(repository.fetchStaff(), throwsA(isA<ApiException>()));
      await expectLater(
        repository.fetchAvailability(staffId: 'staff-1', date: '2030-01-02'),
        throwsA(isA<ApiException>()),
      );
    });

    test(
      'uses canonical availability windows without generating local slots',
      () async {
        final repository = _booking(
          MockClient((request) async {
            expect(
              request.url.path,
              '/api/v1/customer/staff/staff-1/availability',
            );
            expect(request.url.queryParameters['date'], '2030-01-02');
            return _json({
              'data': [
                {
                  '_id': 'window-1',
                  'staffId': 'staff-1',
                  'date': '2030-01-02',
                  'startTime': '09:30',
                  'endTime': '10:15',
                },
              ],
            });
          }),
        );
        final windows = await repository.fetchAvailability(
          staffId: 'staff-1',
          date: '2030-01-02',
        );
        expect(windows.single.startTime, '09:30');
        expect(windows.single.endTime, '10:15');
      },
    );

    test(
      'posts a booking with no client-controlled customer ownership',
      () async {
        final repository = _booking(
          MockClient((request) async {
            expect(request.url.path, '/api/v1/customer/me/appointments');
            expect(request.method, 'POST');
            expect(request.headers['authorization'], 'Bearer access-token');
            final body = jsonDecode(request.body) as Map<String, dynamic>;
            expect(body, {
              'serviceId': 'service-1',
              'staffId': 'staff-1',
              'date': '2030-01-02',
              'startTime': '09:30',
            });
            expect(body.containsKey('customerId'), isFalse);
            return _json({
              'data': {'_id': 'appointment-1'},
            });
          }),
        );
        final appointment = await repository.createAppointment(
          serviceId: 'service-1',
          staffId: 'staff-1',
          date: '2030-01-02',
          startTime: '09:30',
        );
        expect(appointment['_id'], 'appointment-1');
      },
    );

    test(
      'surfaces backend validation errors and expires a rejected session',
      () async {
        var calls = 0;
        final repository = _booking(
          MockClient((request) async {
            calls++;
            if (request.url.path == '/api/v1/auth/refresh') {
              return _json({
                'error': {'message': 'expired'},
              }, statusCode: 401);
            }
            return _json({
              'error': {'message': 'conflict'},
            }, statusCode: calls == 1 ? 409 : 401);
          }),
        );
        await expectLater(
          repository.createAppointment(
            serviceId: 's',
            staffId: 't',
            date: '2030-01-02',
            startTime: '09:30',
          ),
          throwsA(
            isA<ApiException>().having((e) => e.statusCode, 'status', 409),
          ),
        );
      },
    );
  });

  group('CustomerAppointmentsRepository', () {
    test(
      'joins canonical appointment references with catalog and staff data',
      () async {
        final client = MockClient((request) async {
          if (request.url.path == '/api/v1/customer/me/appointments') {
            return _json({
              'data': [
                {
                  '_id': 'appointment-1',
                  'customerId': 'customer-1',
                  'serviceId': 'service-1',
                  'staffId': 'staff-1',
                  'date': '2030-01-02',
                  'startTime': '09:30',
                  'endTime': '10:15',
                  'status': 'scheduled',
                },
              ],
            });
          }
          if (request.url.path == '/api/v1/catalog/services') {
            return _json({
              'data': [_service()],
            });
          }
          return _json({
            'data': [
              {'_id': 'staff-1', 'displayName': 'Ava'},
            ],
          });
        });
        final result = await _history(client).fetchHistory();
        expect(result.single.id, 'appointment-1');
        expect(result.single.service.id, 'service-1');
        expect(result.single.staffId, 'staff-1');
        expect(result.single.staffName, 'Ava');
        expect(result.single.durationMinutes, 45);
      },
    );

    test('handles empty history and rejects malformed history', () async {
      final empty = await _history(
        MockClient((request) async {
          if (request.url.path == '/api/v1/customer/me/appointments') {
            return _json({'data': []});
          }
          if (request.url.path == '/api/v1/catalog/services') {
            return _json({'data': []});
          }
          return _json({'data': []});
        }),
      ).fetchHistory();
      expect(empty, isEmpty);
      await expectLater(
        _history(
          MockClient((request) async {
            if (request.url.path == '/api/v1/customer/me/appointments') {
              return _json({
                'data': [
                  {'serviceId': 'missing'},
                ],
              });
            }
            return _json({'data': []});
          }),
        ).fetchHistory(),
        throwsA(isA<ApiException>()),
      );
    });
  });
}

CustomerBookingRepository _booking(http.Client client) {
  final api = ApiClient(baseUrl: _baseUrl, httpClient: client);
  return CustomerBookingRepository(
    apiClient: api,
    authRepository: AuthRepository(
      apiClient: api,
      sessionStore: _MemorySessionStore(_session),
    ),
  );
}

CustomerAppointmentsRepository _history(http.Client client) {
  final api = ApiClient(baseUrl: _baseUrl, httpClient: client);
  final auth = AuthRepository(
    apiClient: api,
    sessionStore: _MemorySessionStore(_session),
  );
  return CustomerAppointmentsRepository(
    apiClient: api,
    authRepository: auth,
    serviceCatalogRepository: ServiceCatalogRepository(api),
    bookingRepository: CustomerBookingRepository(
      apiClient: api,
      authRepository: auth,
    ),
  );
}

final _session = AuthSession(
  user: AuthenticatedUser(
    id: 'user-1',
    loginIdentifier: 'customer@example.test',
    isActive: true,
    roles: ['customer'],
  ),
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  refreshExpiresAt: DateTime(2031),
);

class _MemorySessionStore implements SessionStore {
  _MemorySessionStore(this.value);
  AuthSession? value;
  @override
  Future<void> clear() async => value = null;
  @override
  Future<AuthSession?> read() async => value;
  @override
  Future<void> write(AuthSession session) async => value = session;
}

http.Response _json(Map<String, dynamic> body, {int statusCode = 200}) =>
    http.Response(
      jsonEncode(body),
      statusCode,
      headers: {'content-type': 'application/json'},
    );
Map<String, dynamic> _service() => {
  '_id': 'service-1',
  'name': 'Haircut',
  'categoryId': 'category-1',
  'price': 50,
  'durationMinutes': 45,
  'status': 'active',
};
