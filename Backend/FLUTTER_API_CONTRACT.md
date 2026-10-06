# Flutter API Contract & Integration Specifications

This document defines the canonical backend contract for customer-facing mobile clients (Flutter) connecting to the shared Salon SaaS Express/MongoDB Backend.

---

## 1. Architecture & Security Model

- **Shared Backend & Database:** Both React (admin/staff portal) and Flutter (customer app) interact with the single backend at `/api/v1` backed by the canonical MongoDB instance.
- **Authoritative Identity:** Customer endpoints under `/api/v1/customer/me/*` strictly derive customer identity from the authenticated JWT session (`request.auth.userId -> user.customerId`). Customers cannot pass or spoof client-supplied customer IDs.
- **Role Isolation:** Only accounts with the `customer` role can access `/api/v1/customer/*` endpoints. Staff/admin accounts receive `403 Forbidden`. Conversely, customer accounts are forbidden from salon management endpoints.

---

## 2. Base API URL

```http
http://localhost:4000/api/v1
```

Configured via `--dart-define=API_BASE_URL=...` in Flutter and `VITE_API_BASE_URL` in React.

---

## 3. Endpoints Matrix

| Domain | Method | Route | Auth / Role | Description |
| --- | --- | --- | --- | --- |
| **Auth** | `POST` | `/auth/login` | Public | Authenticates credentials, returns tokens + user info |
| **Auth** | `POST` | `/auth/refresh` | Public (Token Body) | Exchanges valid refresh token for fresh access token |
| **Auth** | `POST` | `/auth/logout` | Public (Token Body) | Revokes refresh token |
| **Auth** | `GET` | `/auth/me` | Bearer Token | Returns current authenticated user & roles |
| **Profile** | `GET` | `/customer/me/customer` | Bearer (`customer`) | Returns authenticated customer's profile |
| **Provisioning** | `POST` | `/customer/:id/account` | Bearer (`customers.manage`) | Provisions login credentials for a customer |
| **Catalog** | `GET` | `/catalog/services` | Public | Returns active services catalog |
| **Discovery** | `GET` | `/customer/staff` | Bearer (`customer`) | Returns active staff members for booking |
| **Discovery** | `GET` | `/customer/staff/:staffId/availability?date=YYYY-MM-DD` | Bearer (`customer`) | Returns available booking windows for staff & date |
| **Appointments** | `GET` | `/customer/me/appointments` | Bearer (`customer`) | Returns customer's appointments history |
| **Appointments** | `POST` | `/customer/me/appointments` | Bearer (`customer`) | Books a new appointment with server validation |
| **Billing** | `GET` | `/customer/me/invoices` | Bearer (`customer`) | Returns customer's invoices and payment receipts |
| **Notifications** | `GET` | `/customer/me/notifications` | Bearer (`customer`) | Returns customer's notifications |
| **Notifications** | `PATCH` | `/customer/me/notifications/:id/read` | Bearer (`customer`) | Marks a notification as read |

---

## 4. Detailed Payloads & Schemas

### 4.1 Login (`POST /auth/login`)
**Request:**
```json
{
  "loginIdentifier": "customer@example.com",
  "password": "customer-password"
}
```
**Response (200 OK):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439010",
    "loginIdentifier": "customer@example.com",
    "isActive": true,
    "roles": ["customer"],
    "permissions": []
  },
  "accessToken": "JWT_ACCESS_TOKEN",
  "refreshToken": "REFRESH_TOKEN",
  "refreshExpiresAt": "2026-10-05T12:00:00.000Z"
}
```

### 4.2 Customer Appointment Booking (`POST /customer/me/appointments`)
**Request:**
```json
{
  "serviceId": "507f1f77bcf86cd799439012",
  "staffId": "507f1f77bcf86cd799439014",
  "date": "2026-10-10",
  "startTime": "10:00"
}
```
**Response (201 Created):**
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "customerId": "507f1f77bcf86cd799439011",
    "serviceId": "507f1f77bcf86cd799439012",
    "staffId": "507f1f77bcf86cd799439014",
    "date": "2026-10-10",
    "startTime": "10:00",
    "endTime": "10:45",
    "status": "confirmed",
    "createdAt": "2026-10-01T10:00:00.000Z",
    "updatedAt": "2026-10-01T10:00:00.000Z"
  }
}
```

### 4.3 Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error explanation."
  }
}
```
