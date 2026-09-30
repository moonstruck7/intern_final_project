import 'package:flutter/foundation.dart';

import '../api/api_exception.dart';
import '../models/customer_profile.dart';
import 'auth_repository.dart';

enum AuthState { loading, unauthenticated, authenticated, error }

class AuthController extends ChangeNotifier {
  AuthController(this._repository);

  final AuthRepository _repository;
  AuthState _state = AuthState.loading;
  CustomerProfile? _customer;
  String? _errorMessage;

  AuthState get state => _state;
  CustomerProfile? get customer => _customer;
  String? get errorMessage => _errorMessage;

  Future<void> restore() async {
    _state = AuthState.loading;
    _errorMessage = null;
    notifyListeners();
    final session = await _repository.restore();
    _customer = session?.customer;
    _state = session == null
        ? AuthState.unauthenticated
        : AuthState.authenticated;
    notifyListeners();
  }

  Future<void> login({
    required String loginIdentifier,
    required String password,
  }) async {
    _state = AuthState.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      final session = await _repository.login(
        loginIdentifier: loginIdentifier,
        password: password,
      );
      _customer = session.customer;
      _state = AuthState.authenticated;
    } on ApiException catch (error) {
      _state = AuthState.error;
      _errorMessage = error.message;
    } catch (_) {
      _state = AuthState.error;
      _errorMessage = 'Unable to sign in. Please try again.';
    }
    notifyListeners();
  }

  Future<void> logout() async {
    await _repository.logout();
    _customer = null;
    _errorMessage = null;
    _state = AuthState.unauthenticated;
    notifyListeners();
  }
}
