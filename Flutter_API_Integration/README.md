# Flutter API Integration

This directory contains the canonical API contract and specifications for the Flutter mobile customer client integrated with the Salon SaaS backend.

- Base API Route: `http://localhost:4000/api/v1`
- Covered Domains: Authentication, Customer Profile, Service Catalog, Staff Discovery & Availability, Appointment History & Booking, Customer Invoices/Billing, Customer Notifications.
- Security Model: JWT Bearer authentication with refresh tokens; customer-scoped data is strictly linked to server-authenticated customer identity.
- Data Architecture: Shared single source of truth (MongoDB) between React salon operations and Flutter customer portal.

For full contract specifications, see [API_DETAILS.md](API_DETAILS.md).
