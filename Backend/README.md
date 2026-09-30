# Salon SaaS API Foundation

`Backend/` contains the initial shared API foundation for the Salon SaaS
platform. It is a Node.js, TypeScript, and Express application intended to be
consumed by the React operations portal and Flutter customer application.

## Current scope

The foundation provides environment-based configuration, Express application
creation separate from server startup, generic security and request middleware,
controlled CORS when an allowed origin is configured, JSON error responses, and
an application health route.

Business APIs, authentication, authorization, database connectivity, MongoDB,
and data models are intentionally not part of this foundation.

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
```

## Health route

`GET /api/v1/health` confirms the Express application is running. Its response
explicitly reports that the database is not configured; it is not a database
readiness check.

## Configuration

- `NODE_ENV` controls development versus production diagnostics.
- `PORT` selects the local listening port.
- `API_PREFIX` defaults to `/api/v1`.
- `CORS_ORIGIN` is optional. When omitted, no permissive CORS policy is added.
