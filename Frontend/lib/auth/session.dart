class AuthenticatedUser {
  const AuthenticatedUser({
    required this.id,
    required this.loginIdentifier,
    required this.isActive,
    required this.roles,
  });

  final String id;
  final String loginIdentifier;
  final bool isActive;
  final List<String> roles;

  factory AuthenticatedUser.fromJson(Map<String, dynamic> json) =>
      AuthenticatedUser(
        id: (json['id'] ?? '').toString(),
        loginIdentifier: (json['loginIdentifier'] ?? '').toString(),
        isActive: json['isActive'] == true,
        roles: (json['roles'] as List<dynamic>? ?? const [])
            .map((role) => role.toString())
            .toList(growable: false),
      );
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.refreshExpiresAt,
  });

  final AuthenticatedUser user;
  final String accessToken;
  final String refreshToken;
  final DateTime refreshExpiresAt;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    if (user is! Map ||
        json['accessToken'] is! String ||
        json['refreshToken'] is! String ||
        json['refreshExpiresAt'] is! String) {
      throw const FormatException('Invalid session response.');
    }
    return AuthSession(
      user: AuthenticatedUser.fromJson(user.cast<String, dynamic>()),
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      refreshExpiresAt: DateTime.parse(json['refreshExpiresAt'] as String),
    );
  }

  Map<String, String> toStorage() => {
    'userId': user.id,
    'loginIdentifier': user.loginIdentifier,
    'isActive': user.isActive.toString(),
    'roles': user.roles.join(','),
    'accessToken': accessToken,
    'refreshToken': refreshToken,
    'refreshExpiresAt': refreshExpiresAt.toIso8601String(),
  };

  factory AuthSession.fromStorage(Map<String, String> values) => AuthSession(
    user: AuthenticatedUser(
      id: values['userId'] ?? '',
      loginIdentifier: values['loginIdentifier'] ?? '',
      isActive: values['isActive'] == 'true',
      roles: (values['roles'] ?? '')
          .split(',')
          .where((role) => role.isNotEmpty)
          .toList(growable: false),
    ),
    accessToken: values['accessToken'] ?? '',
    refreshToken: values['refreshToken'] ?? '',
    refreshExpiresAt: DateTime.parse(values['refreshExpiresAt'] ?? ''),
  );
}
