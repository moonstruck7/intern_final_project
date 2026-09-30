import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'session.dart';

abstract interface class SessionStore {
  Future<AuthSession?> read();
  Future<void> write(AuthSession session);
  Future<void> clear();
}

class SecureSessionStore implements SessionStore {
  SecureSessionStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const _key = 'salon.auth.session';
  final FlutterSecureStorage _storage;

  @override
  Future<AuthSession?> read() async {
    final raw = await _storage.read(key: _key);
    if (raw == null || raw.isEmpty) return null;
    try {
      final values = raw.split('&').fold(<String, String>{}, (map, entry) {
        final separator = entry.indexOf('=');
        if (separator > 0) {
          map[entry.substring(0, separator)] = Uri.decodeComponent(
            entry.substring(separator + 1),
          );
        }
        return map;
      });
      return AuthSession.fromStorage(values);
    } on FormatException {
      await clear();
      return null;
    }
  }

  @override
  Future<void> write(AuthSession session) => _storage.write(
    key: _key,
    value: session
        .toStorage()
        .entries
        .map((entry) => '${entry.key}=${Uri.encodeComponent(entry.value)}')
        .join('&'),
  );

  @override
  Future<void> clear() => _storage.delete(key: _key);
}
