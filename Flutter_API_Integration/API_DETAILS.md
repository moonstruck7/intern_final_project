# Flutter API Contract & Details

This document defines the canonical, production API contract for customer-facing mobile clients (Flutter) communicating with the Salon SaaS Express/MongoDB Backend.

---

## 1. Base API URL

The backend API mounts under the `/api/v1` route prefix:

```http
http://localhost:4000/api/v1
```

In the Flutter client, this base URL is injected at compile/build time via `--dart-define=API_BASE_URL=...` and handled through `ApiConfig`.

---

## 2. Authentication & Session Management

### 2.1 Login

Authenticate a customer account with email/login identifier and password.

| Item | Contract |
| --- | --- |
| Method | `POST` |
| Endpoint | `/auth/login` |
| Authentication | Not required |
| Headers | `Content-Type: application/json` |
| Request Body | `{"loginIdentifier": "customer@example.com", "password": "customer-password"}` |
| Success Status | `200 OK` |

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

### 2.2 Token Refresh

Issue a new access token using a valid, unexpired refresh token.

| Item | Contract |
| --- | --- |
| Method | `POST` |
| Endpoint | `/auth/refresh` |
| Authentication | Not required (Refresh token payload) |
| Headers | `Content-Type: application/json` |
| Request Body | `{"refreshToken": "REFRESH_TOKEN"}` |
| Success Status | `200 OK` |

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

### 2.3 Logout

Revoke the active refresh token and end the server-side session.

| Item | Contract |
| --- | --- |
| Method | `POST` |
| Endpoint | `/auth/logout` |
| Authentication | Not required (Refresh token payload) |
| Headers | `Content-Type: application/json` |
| Request Body | `{"refreshToken": "REFRESH_TOKEN"}` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "message": "Logged out successfully."
}
```

### 2.4 Authenticated User Info (`/auth/me`)

Retrieve the authenticated session user details.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/auth/me` |
| Authentication | Required: Bearer Access Token |
| Headers | `Authorization: Bearer <accessToken>` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439010",
    "loginIdentifier": "customer@example.com",
    "role": "customer",
    "roles": ["customer"],
    "permissions": []
  }
}
```

---

## 3. Customer Account & Profile

### 3.1 Customer Profile (`/customer/me/customer`)

Derives the customer ID strictly from the authenticated customer token and returns the linked customer profile.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/customer/me/customer` |
| Authentication | Required: role `customer` with linked `customerId` |
| Headers | `Authorization: Bearer <accessToken>` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "displayName": "Alice Smith",
    "email": "customer@example.com",
    "phone": "555-0100",
    "status": "active",
    "notes": "VIP customer",
    "createdAt": "2026-10-01T10:00:00.000Z",
    "updatedAt": "2026-10-01T10:00:00.000Z"
  }
}
```

### 3.2 Customer Portal Account Provisioning (`/customer/:id/account`)

Salon staff / admin provisioning endpoint to create customer portal login credentials for an existing customer.

| Item | Contract |
| --- | --- |
| Method | `POST` |
| Endpoint | `/customer/:id/account` |
| Authentication | Required: staff/admin with `customers.manage` permission |
| Headers | `Authorization: Bearer <accessToken>`, `Content-Type: application/json` |
| Request Body | `{"loginIdentifier": "customer@example.com", "password": "password123"}` |
| Success Status | `201 Created` |

**Response (201 Created):**
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439010",
    "loginIdentifier": "customer@example.com",
    "roles": ["customer"],
    "customerId": "507f1f77bcf86cd799439011"
  }
}
```

---

## 4. Service Catalog & Discovery

### 4.1 Active Services Catalog

Public/Customer-safe active services list, sorted by service name.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/catalog/services` |
| Authentication | Not required |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Haircut",
      "categoryId": "507f1f77bcf86cd799439013",
      "price": 500,
      "durationMinutes": 45,
      "status": "active",
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  ]
}
```

### 4.2 Staff Discovery

Returns active staff members eligible for appointment booking with safe public fields.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/customer/staff` |
| Authentication | Required: role `customer` |
| Headers | `Authorization: Bearer <accessToken>` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "displayName": "Jane Stylist",
      "role": "stylist",
      "specialties": ["Hair Styling"],
      "status": "active"
    }
  ]
}
```

### 4.3 Staff Availability

Returns available booking windows for a specific staff member on a specific date.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/customer/staff/:staffId/availability?date=YYYY-MM-DD` |
| Authentication | Required: role `customer` |
| Headers | `Authorization: Bearer <accessToken>` |
| Query Parameters | `date` (format: `YYYY-MM-DD`, required) |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "staffId": "507f1f77bcf86cd799439014",
      "date": "2026-10-10",
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true
    }
  ]
}
```

---

## 5. Customer Appointments & Booking

### 5.1 Customer Appointment History

Retrieves the authenticated customer's appointments, sorted by most recent date and start time.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/customer/me/appointments` |
| Authentication | Required: role `customer` |
| Headers | `Authorization: Bearer <accessToken>` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": [
    {
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
  ]
}
```

### 5.2 Create Customer Appointment

Submits a new appointment booking. The customer identity is derived automatically by the backend from the token.

| Item | Contract |
| --- | --- |
| Method | `POST` |
| Endpoint | `/customer/me/appointments` |
| Authentication | Required: role `customer` |
| Headers | `Authorization: Bearer <accessToken>`, `Content-Type: application/json` |
| Request Body | `{"serviceId": "507f1f77bcf86cd799439012", "staffId": "507f1f77bcf86cd799439014", "date": "2026-10-10", "startTime": "10:00"}` |
| Success Status | `201 Created` |

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

---

## 6. Customer Billing & Invoices

### 6.1 Customer Invoices

Retrieves billing invoices and associated payments belonging to the authenticated customer.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/customer/me/invoices` |
| Authentication | Required: role `customer` |
| Headers | `Authorization: Bearer <accessToken>` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "invoiceNumber": "INV-202610-0001",
      "customerId": "507f1f77bcf86cd799439011",
      "appointmentId": "507f1f77bcf86cd799439016",
      "lineItems": [
        {
          "serviceId": "507f1f77bcf86cd799439012",
          "quantity": 1,
          "unitPriceMinor": 50000,
          "totalMinor": 50000
        }
      ],
      "subtotalMinor": 50000,
      "totalMinor": 50000,
      "status": "paid",
      "payments": [
        {
          "_id": "507f1f77bcf86cd799439018",
          "invoiceId": "507f1f77bcf86cd799439017",
          "amountMinor": 50000,
          "method": "card",
          "status": "completed",
          "createdAt": "2026-10-01T10:50:00.000Z"
        }
      ],
      "createdAt": "2026-10-01T10:45:00.000Z",
      "updatedAt": "2026-10-01T10:50:00.000Z"
    }
  ]
}
```

---

## 7. Customer Notifications

### 7.1 Customer Notifications List

Retrieves notifications targeted to the authenticated customer.

| Item | Contract |
| --- | --- |
| Method | `GET` |
| Endpoint | `/customer/me/notifications` |
| Authentication | Required: role `customer` |
| Headers | `Authorization: Bearer <accessToken>` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439019",
      "recipient": "customer@example.com",
      "channel": "in_app",
      "template": "appointment_reminder",
      "title": "Upcoming Appointment",
      "message": "Reminder: Your appointment is scheduled for tomorrow at 10:00 AM.",
      "referenceType": "Customer",
      "referenceId": "507f1f77bcf86cd799439011",
      "status": "sent",
      "sentAt": "2026-10-09T10:00:00.000Z",
      "readAt": null,
      "createdAt": "2026-10-09T10:00:00.000Z"
    }
  ]
}
```

### 7.2 Mark Notification as Read

Updates `readAt` timestamp on a customer's notification.

| Item | Contract |
| --- | --- |
| Method | `PATCH` |
| Endpoint | `/customer/me/notifications/:id/read` |
| Authentication | Required: role `customer` |
| Headers | `Authorization: Bearer <accessToken>` |
| Success Status | `200 OK` |

**Response (200 OK):**
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439019",
    "recipient": "customer@example.com",
    "channel": "in_app",
    "template": "appointment_reminder",
    "title": "Upcoming Appointment",
    "message": "Reminder: Your appointment is scheduled for tomorrow at 10:00 AM.",
    "referenceType": "Customer",
    "referenceId": "507f1f77bcf86cd799439011",
    "status": "sent",
    "sentAt": "2026-10-09T10:00:00.000Z",
    "readAt": "2026-10-09T10:05:00.000Z",
    "createdAt": "2026-10-09T10:00:00.000Z",
    "updatedAt": "2026-10-09T10:05:00.000Z"
  }
}
```

---

## 8. Error Response Format & Status Codes

Standard JSON error response payload:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error explanation."
  }
}
```

### Standard Status Codes:
- `400` — `VALIDATION_ERROR` (Malformed body, missing fields, or domain validation failure)
- `401` — `UNAUTHENTICATED` (Missing, invalid, or expired access token)
- `403` — `FORBIDDEN` (Insufficient role/permissions or non-customer accessing customer-scoped endpoints)
- `404` — `NOT_FOUND` (Target resource not found)
- `500` — `INTERNAL_ERROR` (Server-side unexpected error)
- `503` — `AUTH_NOT_CONFIGURED` (Missing JWT secret configuration)
