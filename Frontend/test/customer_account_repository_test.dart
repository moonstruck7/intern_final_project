// ignore_for_file: curly_braces_in_flow_control_structures

import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:salon_app/api/api_client.dart';
import 'package:salon_app/api/api_exception.dart';
import 'package:salon_app/auth/auth_repository.dart';
import 'package:salon_app/auth/session.dart';
import 'package:salon_app/auth/session_store.dart';
import 'package:salon_app/services/customer_account_repository.dart';

void main() {
  test('parses customer-owned invoice payment history', () async {
    final repo = _repo(
      MockClient((request) async {
        expect(request.url.path, '/api/v1/customer/me/invoices');
        expect(request.headers['authorization'], 'Bearer access');
        return _json({
          'data': [
            {
              '_id': 'invoice-1',
              'invoiceNumber': 'INV-1',
              'totalMinor': 1000,
              'status': 'issued',
              'payments': [
                {
                  '_id': 'payment-1',
                  'amountMinor': 400,
                  'method': 'cash',
                  'status': 'recorded',
                },
              ],
            },
          ],
        });
      }),
    );
    final invoices = await repo.fetchInvoices();
    expect(invoices.single.id, 'invoice-1');
    expect(invoices.single.paidMinor, 400);
    expect(invoices.single.balanceMinor, 600);
  });
  test(
    'parses notifications and marks only the returned notification id read',
    () async {
      final repo = _repo(
        MockClient((request) async {
          if (request.method == 'GET')
            return _json({
              'data': [
                {
                  '_id': 'notification-1',
                  'title': 'Booked',
                  'body': 'Your booking is confirmed.',
                },
              ],
            });
          expect(request.method, 'PATCH');
          expect(
            request.url.path,
            '/api/v1/customer/me/notifications/notification-1/read',
          );
          return _json({
            'data': {
              '_id': 'notification-1',
              'title': 'Booked',
              'body': 'Your booking is confirmed.',
              'readAt': '2030-01-01T00:00:00.000Z',
            },
          });
        }),
      );
      expect((await repo.fetchNotifications()).single.isUnread, isTrue);
      expect(
        (await repo.markNotificationRead('notification-1')).isUnread,
        isFalse,
      );
    },
  );
  test('rejects malformed customer payloads and maps API failures', () async {
    final malformed = _repo(
      MockClient(
        (_) async => _json({
          'data': [
            {'invoiceNumber': 'missing'},
          ],
        }),
      ),
    );
    await expectLater(malformed.fetchInvoices(), throwsA(isA<ApiException>()));
    final failed = _repo(
      MockClient(
        (_) async => _json({
          'error': {'message': 'private'},
        }, 500),
      ),
    );
    await expectLater(
      failed.fetchNotifications(),
      throwsA(isA<ApiException>()),
    );
  });
}

CustomerAccountRepository _repo(http.Client client) {
  final api = ApiClient(baseUrl: 'https://salon.test', httpClient: client);
  return CustomerAccountRepository(
    apiClient: api,
    authRepository: AuthRepository(apiClient: api, sessionStore: _Store()),
  );
}

class _Store implements SessionStore {
  AuthSession? value = AuthSession(
    user: const AuthenticatedUser(
      id: 'u',
      loginIdentifier: 'x',
      isActive: true,
      roles: ['customer'],
    ),
    accessToken: 'access',
    refreshToken: 'refresh',
    refreshExpiresAt: DateTime(2030),
  );
  @override
  Future<void> clear() async => value = null;
  @override
  Future<AuthSession?> read() async => value;
  @override
  Future<void> write(AuthSession s) async => value = s;
}

http.Response _json(Map<String, dynamic> body, [int code = 200]) =>
    http.Response(
      jsonEncode(body),
      code,
      headers: {'content-type': 'application/json'},
    );
