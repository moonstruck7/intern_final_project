# React operations portal

## Local sign-in

Start MongoDB and the Backend first. In a separate terminal:

```bash
cd React
cp .env.example .env.local
npm install
npm run dev
```

`VITE_API_BASE_URL` must be `http://localhost:4000` unless the Backend `PORT`
was changed. Set Backend `CORS_ORIGIN` to that exact Vite origin. Open the exact Vite URL shown by the command (normally
`http://localhost:5173/login`; use `5175` if Vite selected that alternate port).
Sign in with `PROVISION_USER_LOGIN` and `PROVISION_USER_PASSWORD` from your
uncommitted Backend `.env`; no credentials are embedded in this repository.

# You are working on a production-style internship project called:

SALON SaaS PLATFORM

IMPORTANT CONTEXT:
This is a real client-oriented project and carries 100 marks for the internship. Do NOT treat it as a demo, toy project, or collection of unrelated pages.

I am responsible for the ENTIRE REACT WEBSITE:
React Group A:
- A1: Platform Foundation, Authentication, RBAC & Dashboard
- A2: Customer / CRM & Membership / Loyalty
- A3: Appointments / Calendar / Queue
- A4: Billing / POS / Invoicing / Payment

React Group B:
- B1: Services / Categories / Packages / Pricing
- B2: Staff Management / Scheduling / Attendance / Leave
- B3: Inventory / Products / Stock / Transactions
- B4: Reports / Analytics / Marketing / Notifications / Business Insights

Flutter is a separate customer-facing application, but it is part of the SAME overall product.
React and Flutter must eventually consume the SAME backend REST API and SAME database.
Do NOT create fake isolated frontend datasets that would conflict with the real backend architecture.

CORE ARCHITECTURE:

React Website
        |
        | REST API
        v
Backend API
        |
        v
Shared Database

Flutter Customer App
        |
        | REST API
        v
Same Backend API
        |
        v
Same Database

The React application must therefore be designed for proper API integration and cross-module data relationships.

AUTHORITATIVE PROJECT REQUIREMENTS:

The project requirements define these major cross-module relationships:

1. Customer/CRM data is consumed by Appointments.
2. Service data including pricing, duration and status is consumed by Appointments.
3. Staff availability is consumed by Appointment scheduling.
4. Valid Appointment + Customer + Service data is consumed by Billing.
5. Customer information is associated with billing/history.
6. Inventory manages products/items, stock movements and transaction history.
7. Reports consume REAL integrated application data rather than maintaining duplicate reporting datasets.
8. Authorization and protected routes must be implemented.
9. Forms require validation.
10. All modules require loading, empty and error states.
11. API errors must be handled properly.
12. The UI must be responsive.
13. The application must be structured so it can eventually be deployed to Vercel.
14. API/base URLs and configuration must use environment variables.
15. Never hardcode credentials or secrets.
16. The project must follow a professional Git feature-branch workflow.

IMPORTANT:
Do NOT invent business rules that are not defined.
If an exact role, permission, tax rule, discount rule, membership rule, package rule, supplier rule, report rule, or API contract is not available in the repository, mark it as TODO / NEEDS API CONTRACT / NEEDS TEAM DECISION rather than silently inventing behavior.

FIRST TASK — INSPECT BEFORE MODIFYING:

Before writing substantial code:

1. Inspect the entire existing repository.
2. Identify:
   - existing React setup
   - framework/build tool
   - package manager
   - folder structure
   - existing components
   - existing pages
   - routing
   - state management
   - API utilities
   - authentication code
   - styling system
   - existing dependencies
   - environment configuration
   - tests
   - linting/formatting
   - any existing backend/API integration
3. Do NOT replace the existing project blindly.
4. Reuse good existing code where appropriate.
5. Identify anything that is broken, duplicated, unsafe, or architecturally inconsistent.
6. Before making large architectural changes, explain what you found.

TARGET FRONTEND ARCHITECTURE:

Establish a scalable React architecture capable of supporting all eight modules.

The shared foundation should include, where appropriate:

- application entry point
- routing
- protected routes
- authentication/session handling
- RBAC/authorization boundary
- application layout
- sidebar/navigation
- header/topbar
- reusable buttons
- reusable inputs
- reusable forms
- reusable tables
- reusable modals/dialogs
- reusable cards
- reusable status badges
- loading states
- empty states
- error states
- confirmation dialogs
- toast/notification handling
- pagination
- search/filter patterns
- API client
- API error handling
- environment configuration
- validation strategy
- reusable hooks
- reusable utilities
- consistent responsive styling

Do not create unnecessary abstractions.
Keep the architecture understandable for a student team while still being professional and scalable.

MODULE STRUCTURE:

Create clear boundaries for:

A1
- Authentication
- Session
- Protected Routes
- RBAC
- Dashboard
- Platform Foundation

A2
- Customers
- Customer search/filter
- Customer create/edit
- Customer profile
- Customer status
- Customer history
- Membership/Loyalty

A3
- Appointments
- Calendar/Scheduling
- Queue
- Appointment create/edit/cancel/status
- Customer/Service/Staff relationships

A4
- POS/Billing
- Invoices
- Invoice line items
- Taxes/discounts
- Totals
- Payment status/history

B1
- Service Categories
- Services
- Pricing
- Duration
- Status
- Packages where defined by the approved requirements

B2
- Staff
- Staff profiles
- Roles/designations
- Scheduling
- Availability
- Attendance
- Leave

B3
- Inventory Categories
- Products/Items
- Stock quantity
- Stock In
- Stock Out
- Inventory transaction history
- Low-stock information
- Supplier/Vendor only where supported by the approved requirements/API

B4
- Reports
- Analytics
- Business/customer/appointment summaries
- Marketing/Campaign interfaces
- Notifications
- Exports only where supported by requirements/API

IMPORTANT DATA ENTITIES:

The frontend should be prepared to work with these conceptual entities:

- User
- Session
- Customer
- Membership/Loyalty
- Service Category
- Service
- Package
- Staff
- Staff Schedule/Availability
- Attendance/Leave
- Appointment
- Queue Entry
- Invoice
- Invoice Line Item
- Payment Record
- Product/Item
- Inventory Category
- Inventory Transaction
- Supplier/Vendor
- Report/Report Result
- Campaign/Marketing
- Notification

Do not create unnecessary duplicate representations of the same business entity.

API DESIGN:

The backend API contract may not yet be completely available.

Therefore:

- Build a clean API client abstraction.
- Keep API calls separate from UI components.
- Use environment variables for the API base URL.
- Make request/response handling easy to change once the backend contract is available.
- Do not invent final endpoint names unless they already exist in the repository/API contract.
- Where backend dependencies are not ready, use clearly isolated mock/fixture data only for development.
- Clearly mark mock implementations.
- Do not design the application around mock data in a way that makes real API integration difficult later.

Each API integration should eventually account for:

- HTTP method
- endpoint
- authentication
- authorization
- request parameters/body
- success response
- validation
- API errors
- loading state
- empty state
- pagination/filtering where applicable

CROSS-MODULE DESIGN:

The frontend must be designed around real relationships.

Example:

Customer
   ↓
Appointment
   ├── Customer
   ├── Service
   └── Staff
          ↓
       Billing
          ↓
       Invoice
          ↓
       Payment

Another flow:

Service
   ↓
Appointment
   ↓
Billing

Another:

Inventory Product
   ↓
Stock In / Stock Out
   ↓
Inventory Transaction History
   ↓
Reports

Reports must eventually consume integrated application data.

DO NOT build eight independent mini-applications.

BUILD ORDER:

Use this approximate implementation order:

PHASE 1
Shared React foundation:
- project structure
- routing
- layout
- navigation
- reusable UI
- API client
- environment configuration
- error/loading/empty patterns

PHASE 2
A1:
- authentication
- session
- protected routes
- authorization structure
- dashboard

PHASE 3
B1:
- services/categories/pricing
Because services are consumed by appointments and billing.

PHASE 4
A2:
- customers/CRM
Because customers are consumed by appointments and billing.

PHASE 5
B2:
- staff/availability
Because staff availability is consumed by appointments.

PHASE 6
A3:
- appointments/calendar/queue

PHASE 7
A4:
- billing/POS/invoices/payments

PHASE 8
B3:
- inventory/products/stock/transactions

PHASE 9
B4:
- reports/analytics/marketing/notifications

PHASE 10
- full cross-module integration
- responsive testing
- validation testing
- authorization testing
- API error testing
- empty/loading state testing
- end-to-end flows
- deployment preparation

Do not necessarily implement every phase in one pass.
Work incrementally and keep the application runnable.

QUALITY REQUIREMENTS:

For every feature, think in this order:

Requirement
→ UI
→ State
→ API
→ Data
→ Validation
→ Authorization
→ Loading
→ Empty
→ Error
→ Integration
→ Testing

Every completed feature should be usable, not just visually present.

A screen is NOT considered complete merely because it renders.

The final implementation must support:

- real API integration
- persisted data
- validation
- loading states
- empty states
- API error states
- authorization
- responsive UI
- module integration
- maintainable code
- testing

CODING RULES:

- Use the existing project stack where reasonable.
- Do not introduce unnecessary libraries.
- Keep components maintainable.
- Avoid huge monolithic components.
- Avoid duplicated logic.
- Avoid duplicated API calls.
- Avoid hardcoded business data.
- Avoid hardcoded secrets.
- Avoid storing sensitive credentials in source code.
- Use environment variables.
- Use meaningful names.
- Keep modules logically separated.
- Prefer reusable components when reuse is real.
- Do not over-engineer.
- Do not rewrite unrelated working code.
- Do not delete existing functionality without understanding it first.
- Keep the application buildable after changes.
- Fix lint/type/build errors introduced by your work.

GIT WORKFLOW:

Assume work will eventually use feature branches such as:

feature/react/foundation
feature/react/a1-auth
feature/react/a2-customers
feature/react/a3-appointments
feature/react/a4-billing
feature/react/b1-services
feature/react/b2-staff
feature/react/b3-inventory
feature/react/b4-reports

Commits should be focused and meaningful.
Do not commit secrets.
Do not rewrite another student's module blindly.
Keep changes reviewable.

YOUR IMMEDIATE JOB:

DO NOT start by generating the entire application.

First:

1. Inspect the repository.
2. Summarize the current architecture.
3. Identify what already exists.
4. Identify missing foundation pieces.
5. Identify risks/conflicts.
6. Propose the exact folder/module structure you recommend.
7. Explain which existing files you will keep/change/create.
8. Identify which parts depend on the backend API contract.
9. Identify where mocks/fixtures may temporarily be used.
10. Then implement ONLY the shared React foundation required to safely begin A1–B4.

After implementing the foundation:

- run the available checks/build/tests
- fix issues caused by your changes
- provide a concise summary of files changed
- explain how the foundation supports A1–A4 and B1–B4
- clearly list remaining API-contract dependencies/TODOs

IMPORTANT:
Do not claim a feature is complete if it is only a UI mock.
Do not invent backend behavior.
Do not fabricate API responses as if they were real.
Keep the architecture ready for integration with the shared backend and database.

Treat this as a real client project that will be demonstrated and evaluated.

## A4 Billing API contract TODO

Billing is structured around the canonical A3 appointment relationship, which
already carries A2 customer, B1 service, and B2 staff references. No billing
API contract is available yet. Before enabling POS, invoices, or payments, the
team must agree endpoint paths and schemas; invoice/payment states; monetary,
tax, discount, package, membership, refund, and rounding rules; payment
methods and transaction behavior; invoice documents; authorization; and
history/search/pagination behavior. The frontend must not calculate or infer
these rules independently.

## B3 Inventory API contract TODO

Inventory is structured as the shared source for items, stock, and stock
movements that B4 will later report on. Before enabling product management,
stock operations, history, or low-stock alerts, the team must agree item and
category schemas; stock and movement operations; movement relationships;
backend-owned low-stock rules; validation; authorization; and filtering or
pagination. Supplier/vendor support remains deferred unless an approved API
contract explicitly includes it.

## B4 Reports, analytics and engagement API contract TODO

B4 consumes backend-produced reporting data from the canonical A2 customers,
B1 services, B2 staff, A3 appointments, A4 billing, and B3 inventory modules;
it must not maintain a duplicate analytics dataset. Before enabling reports,
analytics, insights, campaigns, notifications, or exports, the team must agree
report and result schemas; filter, date, timezone, aggregation, sorting and
pagination semantics; metric definitions and calculations; export behavior;
insight generation; campaign/segmentation and delivery behavior; notification
events, channels, read state and preferences; validation; and authorization.
No KPI, report record, campaign, notification, metric, formula, or business
rule is fabricated while those contracts are unavailable.
