class ApiException implements Exception {
  const ApiException({required this.message, this.statusCode, this.code});

  final String message;
  final int? statusCode;
  final String? code;

  bool get isUnauthorized => statusCode == 401;

  factory ApiException.fromStatus({
    required int statusCode,
    String? code,
    String? serverMessage,
  }) {
    final message = switch (statusCode) {
      400 => serverMessage ?? 'Please check the information and try again.',
      401 => 'Your session has expired. Please sign in again.',
      403 => 'You do not have permission to perform this action.',
      404 => 'The requested information could not be found.',
      409 => 'This action conflicts with the current information.',
      >= 500 => 'The service is temporarily unavailable. Please try again.',
      _ => serverMessage ?? 'Unable to complete the request.',
    };
    return ApiException(message: message, statusCode: statusCode, code: code);
  }

  factory ApiException.network() => const ApiException(
    message:
        'Unable to reach the service. Check your connection and try again.',
  );

  factory ApiException.timeout() => const ApiException(
    message: 'The request took too long. Please try again.',
  );
}
