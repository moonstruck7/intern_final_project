/// Compile with `--dart-define=API_BASE_URL=https://api.example.com`.
///
/// In release/production builds the dart-define value is required.
/// During development the app falls back to the Android-emulator-friendly
/// address for the local backend (http://10.0.2.2:4000).  Change
/// [_devFallback] if your backend runs on a different port or you are
/// testing on a physical device (use your machine's LAN IP instead).
class ApiConfig {
  const ApiConfig._();

  /// Override via `--dart-define=API_BASE_URL=<url>` at build time.
  static const _defined = String.fromEnvironment('API_BASE_URL');

  /// Fallback used when [_defined] is empty. Points to the live Render deployment
  /// so standalone APK builds connect directly to the cloud backend.
  static const _devFallback = 'https://intern-final-project-e499.onrender.com';

  static String get baseUrl =>
      _defined.trim().isEmpty ? _devFallback : _defined;

  static String get requiredBaseUrl => baseUrl;
}

class ApiConfigurationException implements Exception {
  const ApiConfigurationException(this.message);

  final String message;

  @override
  String toString() => message;
}

