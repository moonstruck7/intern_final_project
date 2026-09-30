# Salon SaaS API Foundation

`Backend/` contains the initial shared API foundation for the Salon SaaS
platform. It is a Node.js, TypeScript, and Express application intended to be
consumed by the React operations portal and Flutter customer application.

## Current scope

The foundation provides environment-based configuration, Express application
creation separate from server startup, generic security and request middleware,
controlled CORS when an allowed origin is configured, JSON error responses, and
an application health route.

Business APIs, authentication, authorization, and domain data models are
intentionally not part of this foundation.

## Requirements

- Node.js 24 or a compatible current LTS/runtime.
- npm.

## Setup

```bash
cd Backend
npm install
cp .env.example .env
```

Review `.env` locally before running the application. Do not commit it.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Health route

`GET /api/v1/health` confirms the Express application is running and reports
the live database connection status. It never returns a connection string,
credentials, driver errors, or other internal connection details.

Database states are:

- `not_configured`: `MONGODB_URI` was not supplied and no connection was attempted.
- `connecting`: Mongoose is currently establishing a connection.
- `connected`: Mongoose has an active connection.
- `unavailable`: a configured connection is not active, including after an initial failure or disconnect.

The API intentionally starts when MongoDB is not configured or unavailable so
the health route can state its actual readiness. Business routes that require a
database will be added only with their approved module contracts.

## Configuration

- `NODE_ENV` controls development versus production diagnostics.
- `PORT` selects the local listening port.
- `API_PREFIX` defaults to `/api/v1`.
- `CORS_ORIGIN` is optional. When omitted, no permissive CORS policy is added.
- `MONGODB_URI` is optional. It is the only database connection-string input.

## Database

MongoDB is accessed through Mongoose in `src/database/mongoose.ts`. The module
owns connection setup, state reporting, and graceful disconnect handling; route
handlers and future domain modules do not create their own connections.

For local development, install and start MongoDB using the method appropriate
for your operating system, then use a local URI such as the placeholder in
`.env.example`. MongoDB Atlas is not provisioned by this repository. If the
team later provisions Atlas, place its credential-bearing URI only in the
deployment environment's `MONGODB_URI` setting, never in source control.

No domain models are included yet. They will be introduced only in their
respective approved backend implementation parts.

## Tests

```bash
npm test
```

The default tests cover no-database and unreachable-database behavior without
credentials. The connected-database integration test is skipped unless an
explicit disposable `MONGODB_TEST_URI` is supplied.

## Authentication and authorization

Implementation decision — the supplied project contract requires authentication,
authorization, roles, and permissions, but does not define their exact names,
token format, or endpoint paths. This API uses signed short-lived bearer access
tokens (default `15m`) and rotating opaque refresh tokens (default `30` days).
Only SHA-256 hashes of refresh tokens are stored. Logout revokes the presented
refresh token; an access token remains usable until its short expiry.

Public registration is intentionally deferred: the supplied contract does not
define customer onboarding or privileged-account creation. Provision initial
local users through a future controlled command using environment-provided
credentials; no default credentials exist in this repository.

For local development, an explicit provisioning command is available only when
`MONGODB_URI`, `PROVISION_USER_LOGIN`, and `PROVISION_USER_PASSWORD` are set in
the process environment (optional `PROVISION_USER_ROLE`: `owner`, `manager`, or
`staff`): `npm run provision:user`. It never supplies credentials itself.

Implemented endpoints:

- `POST /api/v1/auth/login` — `{ loginIdentifier, password }`.
- `POST /api/v1/auth/refresh` — `{ refreshToken }`; rotates the token.
- `POST /api/v1/auth/logout` — `{ refreshToken }`; returns `204`.
- `GET /api/v1/auth/me` — requires `Authorization: Bearer <accessToken>`.
- `GET /api/v1/auth/authorization-check` — infrastructure-only RBAC check.

User records contain a normalized login identifier, password hash, active
status, roles, hashed refresh sessions, and timestamps. Passwords must be 8–128
characters, are bcrypt-hashed, excluded from normal queries, never logged, and
never returned.

Initial role and permission registry (implementation decision): `owner`,
`manager`, `staff`; `dashboard.read`, `platform.manage`. Only the owner has
`platform.manage`. Future business permissions must be added centrally, not in
route handlers. Set `JWT_ACCESS_SECRET` securely in every environment; auth
endpoints return a safe configuration error until it is supplied.
