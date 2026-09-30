import '../api/api_client.dart';
import '../api/api_exception.dart';
import '../models/customer_profile.dart';
import 'session.dart';
import 'session_store.dart';

class CustomerSession {
  const CustomerSession({required this.session, required this.customer});

  final AuthSession session;
  final CustomerProfile customer;
}

class AuthRepository {
  AuthRepository({required this.apiClient, required this.sessionStore});

  final ApiClient apiClient;
  final SessionStore sessionStore;
  AuthSession? _session;
  Future<AuthSession>? _refreshInFlight;

  Future<CustomerSession?> restore() async {
    _session = await sessionStore.read();
    if (_session == null) return null;
    try {
      return await _loadCustomerSession();
    } on ApiException {
      await sessionStore.clear();
      _session = null;
      return null;
    }
  }

  Future<CustomerSession> login({
    required String loginIdentifier,
    required String password,
  }) async {
    final response = await apiClient.post(
      '/api/v1/auth/login',
      body: {'loginIdentifier': loginIdentifier.trim(), 'password': password},
    );
    _session = _parseSession(response);
    await sessionStore.write(_session!);
    try {
      return await _loadCustomerSession();
    } on ApiException {
      await sessionStore.clear();
      _session = null;
      rethrow;
    }
  }

  Future<T> authorized<T>(
    Future<T> Function(String accessToken) operation,
  ) async {
    final current = _session ?? await sessionStore.read();
    if (current == null) {
      throw const ApiException(
        message: 'Please sign in to continue.',
        statusCode: 401,
      );
    }
    _session = current;
    try {
      return await operation(current.accessToken);
    } on ApiException catch (error) {
      if (!error.isUnauthorized) rethrow;
      final refreshed = await _refresh();
      return operation(refreshed.accessToken);
    }
  }

  Future<void> logout() async {
    final session = _session ?? await sessionStore.read();
    try {
      if (session != null) {
        await apiClient.post(
          '/api/v1/auth/logout',
          body: {'refreshToken': session.refreshToken},
        );
      }
    } on ApiException {
      // Local credentials must still be removed when a network or server error
      // prevents revocation. The next successful login creates a new session.
    } finally {
      _session = null;
      await sessionStore.clear();
    }
  }

  Future<CustomerSession> _loadCustomerSession() async {
    final authenticatedUser = await authorized(
      (token) => apiClient.get('/api/v1/auth/me', accessToken: token),
    );
    final user = authenticatedUser is Map ? authenticatedUser['user'] : null;
    if (user is! Map || user['role']?.toString() != 'customer') {
      throw const ApiException(
        message: 'This application is available to customer accounts only.',
        statusCode: 403,
      );
    }
    final profileResponse = await authorized(
      (token) =>
          apiClient.get('/api/v1/customer/me/customer', accessToken: token),
    );
    final data = profileResponse is Map ? profileResponse['data'] : null;
    if (data is! Map) {
      throw const ApiException(
        message: 'The customer profile response is invalid.',
      );
    }
    return CustomerSession(
      session: _session!,
      customer: CustomerProfile.fromJson(data.cast<String, dynamic>()),
    );
  }

  Future<AuthSession> _refresh() {
    return _refreshInFlight ??= _refreshSession().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  Future<AuthSession> _refreshSession() async {
    final session = _session;
    if (session == null) {
      throw const ApiException(
        message: 'Please sign in to continue.',
        statusCode: 401,
      );
    }
    try {
      final response = await apiClient.post(
        '/api/v1/auth/refresh',
        body: {'refreshToken': session.refreshToken},
      );
      _session = _parseSession(response);
      await sessionStore.write(_session!);
      return _session!;
    } on ApiException {
      _session = null;
      await sessionStore.clear();
      throw const ApiException(
        message: 'Your session has expired. Please sign in again.',
        statusCode: 401,
      );
    }
  }

  AuthSession _parseSession(dynamic response) {
    if (response is! Map) {
      throw const ApiException(message: 'The session response is invalid.');
    }
    try {
      return AuthSession.fromJson(response.cast<String, dynamic>());
    } on FormatException {
      throw const ApiException(message: 'The session response is invalid.');
    }
  }
}
