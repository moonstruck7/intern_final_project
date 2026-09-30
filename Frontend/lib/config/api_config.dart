/// Compile with `--dart-define=API_BASE_URL=https://api.example.com`.
///
/// The customer app deliberately has no production default. This prevents a
/// build from accidentally pointing at a developer machine or an unintended
/// environment.
class ApiConfig {
  const ApiConfig._();

  static const baseUrl = String.fromEnvironment('API_BASE_URL');

  static String get requiredBaseUrl {
    if (baseUrl.trim().isEmpty) {
      throw const ApiConfigurationException(
        'The API base URL has not been configured for this build.',
      );
    }
    return baseUrl;
  }
}

class ApiConfigurationException implements Exception {
  const ApiConfigurationException(this.message);

  final String message;

  @override
  String toString() => message;
}
