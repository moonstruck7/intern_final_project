# Salon SaaS API Foundation

## Local end-to-end authentication

The API listens on `http://localhost:4000` by default and serves routes under
`/api/v1`. A local MongoDB instance is required for sign-in because User and
refresh-session records are persistent.

```bash
cd Backend
cp .env.example .env
# Edit .env: set JWT_ACCESS_SECRET, MONGODB_URI, CORS_ORIGIN, and the PROVISION_USER_* values.
npm install
npm run provision:user
npm run dev
```

For the provisioning command, set `NODE_ENV=development`,
`ALLOW_LOCAL_USER_PROVISIONING=true`, `PROVISION_USER_LOGIN`,
`PROVISION_USER_PASSWORD`, and optionally `PROVISION_USER_ROLE` (`owner` by
default). The command is disabled in production, bcrypt-hashes the password,
never prints it, and is idempotent: an existing login identifier is left
unchanged. Do not commit `.env` or share its values.

Confirm the database state with `GET http://localhost:4000/api/v1/health`.
Only `dependencies.database: "connected"` is ready for authentication; the API
reports `unavailable` honestly when MongoDB cannot be reached.

Set `CORS_ORIGIN` to the exact React origin Vite prints (normally
`http://localhost:5173`; use `http://localhost:5175` if that is the selected
local port). The React `VITE_API_BASE_URL` remains `http://localhost:4000`.

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

## Appointments and queue

Implementation decision — appointments use canonical Customer, Service, and
Staff ObjectId references; `date` is ISO `YYYY-MM-DD` and times are `HH:mm`.
The salon timezone is not defined by the contract, so API clients must supply
those values in the salon's agreed operational timezone; Render server-local
time is not used for appointment calculations. The service's canonical
`durationMinutes` derives `endTime`; clients cannot supply a separate duration.

`POST /api/v1/appointments`, `GET /api/v1/appointments`,
`GET/PATCH /api/v1/appointments/:id`, and
`GET /api/v1/appointments/queue/today` require appointment/queue permissions.
List filters are `date`, `startDate`, `endDate`, `staffId`, `customerId`,
`serviceId`, `status`, `page`, and `limit`.

Implementation decision — lifecycle values are `scheduled`, `arrived`,
`in_progress`, `completed`, `cancelled`, and `no_show`. Terminal appointments
cannot be changed; cancelled/no-show appointments do not block a new booking.
Queue is derived from today's canonical active appointments in start-time order;
no duplicate queue collection or fabricated positions exist. Boundary-touching
time ranges are allowed, but overlapping ranges for one staff member are not.
Customer overlap policy, cancellation policy, salon timezone, and atomic
concurrent-booking guarantees remain CONTRACT DECISIONS REQUIRED. Current
application-level conflict checks are not a distributed-locking guarantee.

## Billing and inventory

Implementation decision — billing uses integer minor units; service prices are converted server-side and client totals are ignored. `POST /api/v1/billing/invoices` accepts an appointment or customer/service source, and payment records are internal only (`cash`, `card`, `upi`, `other`). Refunds, tax, discount, currency, and supplier/valuation rules are CONTRACT DECISIONS REQUIRED.

`POST/GET /api/v1/inventory/products`, `POST /api/v1/inventory/products/:id/stock`, and `GET /api/v1/inventory/products/:id/transactions` are protected inventory APIs. Stock changes create audit records and cannot make stock negative. No service-to-product consumption rule is implemented.

## Customer accounts and booking

Implementation decision — customer accounts are provisioned by an authorized operations user rather than public self-registration: `POST /api/v1/customer/:id/account` requires `customers.manage`, verifies an active existing Customer, bcrypt-hashes the submitted password, assigns only the `customer` role, and sets the one-to-one `User.customerId` link. Password hashes are never returned. Customer users cannot choose or alter this ownership link.

Customer booking uses `POST /api/v1/customer/me/appointments`. Its body contains only `serviceId`, `staffId`, `date`, and `startTime`; the Customer is derived from the authenticated `User.customerId`. It creates the same canonical Appointment record as the administrative API and reuses the shared appointment validation service for active references, duration, availability, and conflicts. Customer-scoped profile, appointment, notification, and invoice routes likewise derive ownership server-side.

Customer invoice/payment and notification reads are implementation-level
customer-facing contracts, not PRD/SRS-mandated endpoint names. A linked
customer can read only `GET /api/v1/customer/me/invoices` (canonical invoices
with their recorded payments) and `GET /api/v1/customer/me/notifications`.
`PATCH /api/v1/customer/me/notifications/:id/read` first verifies the linked
customer role/ownership and then updates only a Customer-referenced
notification belonging to that customer. Administrative billing and insight
routes remain permission-protected. The customer routes do not create payments,
choose payment methods, or expose internal billing metadata.

### Customer-safe booking discovery

Implementation decision — the documented customer-booking workflow requires a
customer to select staff and date-specific availability, but does not prescribe
endpoint names or discovery response fields. These read-only contracts are
therefore implementation-level API contracts; they do not grant a customer any
staff-management permission or change the canonical scheduling rules.

- `GET /api/v1/customer/staff` requires a linked authenticated customer and
  returns active selectable staff only as `{ data: [{ _id, displayName,
  designation }] }`, ordered by display name.
- `GET /api/v1/customer/staff/:staffId/availability?date=YYYY-MM-DD` requires
  a linked authenticated customer, a canonical active staff ID, and a valid
  date. The date is required because the existing Availability model is
  date-specific. It returns `{ data: [{ _id, staffId, date, startTime,
  endTime }] }` for active availability only.

The customer discovery responses intentionally exclude staff email, phone,
attendance, leave, HR data, administrative metadata, and any customer data.
The existing administrative `/staff` and `/staff/availability` routes remain
protected by `staff.manage`; customers receive no new administrative permission.
Discovery supports UI selection only. `POST /api/v1/customer/me/appointments`
remains the final authority and continues to derive ownership server-side and
validate active service/staff, availability, service duration, and conflicts.
