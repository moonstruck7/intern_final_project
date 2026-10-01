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

## Customer appointment and booking integration

The customer appointment screens use the shared backend API and never accept a
client-selected customer identity. `GET /api/v1/customer/me/appointments` is
used for history, while service names and prices are resolved from the canonical
catalog and staff names from the customer-safe staff directory. Missing display
references are shown as unavailable rather than replaced by fake records.

Booking uses `POST /api/v1/customer/me/appointments` with only `serviceId`,
`staffId`, `date`, and `startTime`. The backend derives Customer ownership from
the authenticated `User.customerId`; the client does not send `customerId`.
The staff directory and date-specific availability are read from
`GET /api/v1/customer/staff` and
`GET /api/v1/customer/staff/:staffId/availability?date=YYYY-MM-DD`.

Availability windows do not define a slot-generation policy, so the UI offers
only each backend window's canonical `startTime`. This is an implementation
decision, not a PRD/SRS-defined interval rule. Authentication, token refresh,
401/403 handling, validation errors, loading, empty states, and network errors
all pass through the shared API/session layer.

Inbox/notifications, invoice history, and loyalty presentation remain separate
Part 9 work and are not represented as completed by this appointment change.
