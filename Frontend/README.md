# Luxe Salon customer app

This Flutter application is the customer-facing client for the Salon SaaS
backend. It uses the same REST API and database as the React operations
application; it does not create or select a customer identity locally.

## API configuration

Supply the backend origin at build or run time with a Dart define. The value is
the server origin, not an endpoint path, because the client uses the backend's
`/api/v1` prefix.

```sh
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
flutter build web --dart-define=API_BASE_URL=https://your-api.example
```

No production URL, credential, access token, or refresh token is committed to
this repository. A build without `API_BASE_URL` displays a safe configuration
error when a user attempts to sign in.

## Authentication and customer identity

The app has one centralized `ApiClient`, `AuthRepository`, and
`AuthController` (Provider). It uses the existing backend contract exactly:

- `POST /api/v1/auth/login` with `loginIdentifier` and `password`.
- `POST /api/v1/auth/refresh` with the stored refresh token.
- `POST /api/v1/auth/logout` before local session removal when possible.
- `GET /api/v1/auth/me` and `GET /api/v1/customer/me/customer` after login or
  session restoration.

Access and refresh tokens are stored only through `flutter_secure_storage`.
Passwords are sent for login only and are never persisted or logged. On one
`401` response, the session layer refreshes the token, saves the rotated
session, and retries the original operation once. A failed refresh clears local
session state and returns the user to sign-in. It never accepts a UI-supplied
`customerId`; the backend derives customer ownership from `User.customerId`.

The customer app verifies that `/auth/me` reports the `customer` role before it
loads the customer profile. It does not call administrative endpoints or grant
administrative permissions.

## Error handling

The client maps validation, unauthenticated, forbidden, not-found, conflict,
server, network, timeout, and malformed-response failures to safe user-facing
messages. It does not expose server stack traces, MongoDB details, or JWT
details in the interface.

## Service catalogue

After authentication, the catalogue uses the backend's canonical public
`GET /api/v1/catalog/services` endpoint through `ServiceCatalogRepository` and
the shared `ApiClient`. The backend returns active services only; Flutter also
defensively excludes an unexpected inactive record. The canonical MongoDB
service `_id` is preserved as `ServiceModel.id` for the booking request that
will be integrated next.

The current backend response provides `_id`, `name`, `categoryId`, `price`,
`durationMinutes`, and `status`. It does not provide a customer-facing category
name, description, image, or currency metadata. The UI therefore does not
substitute prototype values for those fields, does not render category filters,
and labels the raw price without assuming a currency. Category display data
must be added to the existing backend contract before a customer-facing
category label can be shown.

## Validation

```sh
flutter pub get
flutter analyze
flutter test
flutter build web --dart-define=API_BASE_URL=https://api.example.invalid
```

The unit tests use an HTTP-boundary fake only. They verify login request and
response handling, secure-session abstraction, one-time refresh/retry, logout
clearing, unauthorized behavior, and customer profile parsing. They do not
claim a running backend, device, or emulator integration test.

## Deliberately deferred Part 9 work

Appointments, inbox/notifications, invoice history, booking flow, and loyalty
presentation still use their prior prototype screen data. Their real API
integration must be completed in later Part 9 stages. The static profile
identity and no-op logout behavior were replaced with the authenticated
customer profile and backend logout flow.
