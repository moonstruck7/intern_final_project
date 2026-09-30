import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({
    String? baseUrl,
    http.Client? httpClient,
    this.timeout = const Duration(seconds: 15),
  }) : _baseUrl = baseUrl ?? ApiConfig.baseUrl,
       _httpClient = httpClient ?? http.Client();

  final String _baseUrl;
  final http.Client _httpClient;
  final Duration timeout;

  Future<dynamic> get(String path, {String? accessToken}) =>
      request('GET', path, accessToken: accessToken);

  Future<dynamic> post(String path, {Object? body, String? accessToken}) =>
      request('POST', path, body: body, accessToken: accessToken);

  Future<dynamic> request(
    String method,
    String path, {
    Object? body,
    String? accessToken,
  }) async {
    if (_baseUrl.trim().isEmpty) {
      throw const ApiException(
        message: 'This app build has not been configured with an API base URL.',
      );
    }
    final http.StreamedResponse response;
    try {
      response = await _httpClient
          .send(
            http.Request(method, Uri.parse(_baseUrl).resolve(path))
              ..headers.addAll({
                'accept': 'application/json',
                if (body != null) 'content-type': 'application/json',
                if (accessToken != null) 'authorization': 'Bearer $accessToken',
              })
              ..body = body == null ? '' : jsonEncode(body),
          )
          .timeout(timeout);
    } on TimeoutException {
      throw ApiException.timeout();
    } on http.ClientException {
      throw ApiException.network();
    }

    final payload = await _decode(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = payload is Map ? payload['error'] : null;
      throw ApiException.fromStatus(
        statusCode: response.statusCode,
        code: error is Map ? error['code'] as String? : null,
        serverMessage: error is Map ? error['message'] as String? : null,
      );
    }
    return payload;
  }

  Future<dynamic> _decode(http.StreamedResponse response) async {
    final text = await response.stream.bytesToString();
    if (text.trim().isEmpty) return null;
    try {
      return jsonDecode(text);
    } on FormatException {
      throw const ApiException(
        message: 'The service returned an invalid response.',
      );
    }
  }

  void dispose() => _httpClient.close();
}
