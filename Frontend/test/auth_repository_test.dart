import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:salon_app/api/api_client.dart';
import 'package:salon_app/api/api_exception.dart';
import 'package:salon_app/auth/auth_repository.dart';
import 'package:salon_app/auth/session.dart';
import 'package:salon_app/auth/session_store.dart';

const baseUrl = 'https://salon.test';

void main() {
  group('AuthRepository', () {
    test(
      'sends the backend login contract and persists a customer session',
      () async {
        final store = MemorySessionStore();
        final client = MockClient((request) async {
          switch (request.url.path) {
            case '/api/v1/auth/login':
              expect(request.method, 'POST');
              expect(jsonDecode(request.body), {
                'loginIdentifier': 'customer@example.com',
                'password': 'not-logged',
              });
              return _json(_sessionJson());
            case '/api/v1/auth/me':
              expect(request.headers['authorization'], 'Bearer access-token');
              return _json({
                'user': {'userId': 'user-1', 'role': 'customer'},
              });
            case '/api/v1/customer/me/customer':
              return _json({
                'data': {
                  '_id': 'customer-1',
                  'displayName': 'Asha Patel',
                  'email': 'customer@example.com',
                  'status': 'active',
                },
              });
            default:
              fail('Unexpected request: ${request.url}');
          }
        });
        final repository = _repository(client, store);

        final session = await repository.login(
          loginIdentifier: ' customer@example.com ',
          password: 'not-logged',
        );

        expect(session.customer.id, 'customer-1');
        expect(session.customer.displayName, 'Asha Patel');
        expect((await store.read())?.accessToken, 'access-token');
      },
    );

    test('maps invalid login credentials to a safe API error', () async {
      final repository = _repository(
        MockClient(
          (_) async => _json({
            'error': {'code': 'UNAUTHENTICATED', 'message': 'Internal detail'},
          }, statusCode: 401),
        ),
        MemorySessionStore(),
      );

      await expectLater(
        repository.login(
          loginIdentifier: 'customer@example.com',
          password: 'wrong',
        ),
        throwsA(
          isA<ApiException>()
              .having((error) => error.statusCode, 'statusCode', 401)
              .having(
                (error) => error.message,
                'message',
                'Your session has expired. Please sign in again.',
              ),
        ),
      );
    });

    test(
      'refreshes once after a 401 and retries with the new access token',
      () async {
        final store = MemorySessionStore()..value = _session();
        var protectedCalls = 0;
        final httpClient = MockClient((request) async {
          if (request.url.path == '/protected') {
            protectedCalls++;
            if (request.headers['authorization'] == 'Bearer access-token') {
              return _json({
                'error': {'code': 'UNAUTHENTICATED'},
              }, statusCode: 401);
            }
            expect(
              request.headers['authorization'],
              'Bearer refreshed-access-token',
            );
            return _json({'ok': true});
          }
          if (request.url.path == '/api/v1/auth/refresh') {
            expect(jsonDecode(request.body), {'refreshToken': 'refresh-token'});
            return _json(_sessionJson(accessToken: 'refreshed-access-token'));
          }
          fail('Unexpected request: ${request.url}');
        });
        final apiClient = ApiClient(baseUrl: baseUrl, httpClient: httpClient);
        final repository = AuthRepository(
          apiClient: apiClient,
          sessionStore: store,
        );

        final result = await repository.authorized(
          (token) => apiClient.get('/protected', accessToken: token),
        );

        expect(result, {'ok': true});
        expect(protectedCalls, 2);
      },
    );

    test(
      'logs out remotely and clears the stored session even after a failure',
      () async {
        final store = MemorySessionStore()..value = _session();
        final repository = _repository(
          MockClient((request) async {
            expect(request.url.path, '/api/v1/auth/logout');
            expect(jsonDecode(request.body), {'refreshToken': 'refresh-token'});
            return http.Response('', 204);
          }),
          store,
        );

        await repository.logout();

        expect(await store.read(), isNull);
      },
    );

    test('restore parses the authenticated customer profile', () async {
      final store = MemorySessionStore()..value = _session();
      final repository = _repository(
        MockClient((request) async {
          if (request.url.path == '/api/v1/auth/me') {
            return _json({
              'user': {'userId': 'user-1', 'role': 'customer'},
            });
          }
          if (request.url.path == '/api/v1/customer/me/customer') {
            return _json({
              'data': {
                '_id': 'customer-1',
                'displayName': 'Asha Patel',
                'phone': '+91 99999 11111',
                'status': 'active',
              },
            });
          }
          fail('Unexpected request: ${request.url}');
        }),
        store,
      );

      final restored = await repository.restore();

      expect(restored?.customer.phone, '+91 99999 11111');
    });
  });
}

AuthRepository _repository(http.Client client, SessionStore store) =>
    AuthRepository(
      apiClient: ApiClient(baseUrl: baseUrl, httpClient: client),
      sessionStore: store,
    );

http.Response _json(Map<String, dynamic> body, {int statusCode = 200}) =>
    http.Response(
      jsonEncode(body),
      statusCode,
      headers: {'content-type': 'application/json'},
    );

AuthSession _session() => AuthSession.fromJson(_sessionJson());

Map<String, dynamic> _sessionJson({String accessToken = 'access-token'}) => {
  'user': {
    'id': 'user-1',
    'loginIdentifier': 'customer@example.com',
    'isActive': true,
    'roles': ['customer'],
  },
  'accessToken': accessToken,
  'refreshToken': 'refresh-token',
  'refreshExpiresAt': '2027-01-01T00:00:00.000Z',
};

class MemorySessionStore implements SessionStore {
  AuthSession? value;

  @override
  Future<void> clear() async => value = null;

  @override
  Future<AuthSession?> read() async => value;

  @override
  Future<void> write(AuthSession session) async => value = session;
}
