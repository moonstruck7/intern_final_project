# Business Rules Decisions

## 1. Purpose

This document locks the business-rule decisions that must be approved before the missing Salon SaaS functionality is implemented. Its purpose is to keep the React salon portal, Node/Express backend and MongoDB database, and Flutter customer app as one integrated product using one API and one source of truth.

It records three distinct things:

1. What the readable PRD/SRS explicitly require.
2. What the current code already implements.
3. What still requires an explicit owner/team decision.

It does not authorize a developer to infer or implement a rule marked **DECISION REQUIRED**.

## 2. Current Implementation Baseline

The following are confirmed from current source code. Their presence does not mean that every required workflow is complete.

| Area | Confirmed current implementation | Evidence |
| --- | --- | --- |
| Roles and authentication | `owner`, `manager`, `staff`, and `customer` roles; JWT access tokens; rotating refresh tokens; logout; backend permission middleware. | `Backend/src/auth/roles.ts`, `service.ts`, `tokens.ts`, `middleware/auth.ts` |
| React authorization | Login, session restoration, protected routes, route access boundaries, and role-aware navigation. | `React/src/features/auth/**`, `React/src/app/**` |
| Customers | Persistent Customer model and protected create/list/detail/patch routes. | `Backend/src/domains/models.ts`, `routes/domains.ts`, `routes/resources.ts` |
| Services/categories/packages | Persistent ServiceCategory, Service, and ServicePackage models and protected generic CRUD routes. | `Backend/src/domains/models.ts`, `routes/domains.ts` |
| Staff operations | Persistent Staff, Availability, Attendance, and Leave models/routes. | `Backend/src/domains/models.ts`, `routes/domains.ts` |
| Appointments/queue | Persistent Appointment records, validation, status values, scheduling checks, and a derived today queue. | `Backend/src/appointments/**` |
| Billing | Persistent invoices and payments; invoice creation from an appointment or customer/service source; payment recording. | `Backend/src/billing/**` |
| Inventory | Persistent Product and StockTransaction records; stock movement and low-stock query support. | `Backend/src/inventory/**` |
| Reports/engagement | Backend analytics, invoice/operations/trends reports, campaign creation, and notification list/read routes. | `Backend/src/insights/**` |
| Flutter integration | Flutter uses the shared API for login/session, customer profile, services, customer booking/history, notifications, and invoices. Some profile presentation elements remain local/static. | `Frontend/lib/api/**`, `auth/**`, `services/**`, `main.dart` |

## 3. Role and Permission Matrix

The PRD/SRS require role-aware access and staff-administration authorization, but do **not** define the exact roles or permission matrix. Therefore every future business permission below is **DECISION REQUIRED**. The current runtime registry is an implementation baseline only, not an approved business-policy substitute.

Action keys: **V** = view, **C** = create, **U** = update, **D/C** = delete or cancel where applicable.

### Owner

| Module | V | C | U | D/C |
| --- | --- | --- | --- | --- |
| Dashboard | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customers | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Services/categories/packages | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Staff | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Appointments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Queue | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Billing/invoices/payments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Inventory | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Reports/analytics | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Marketing | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Notifications | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customer self-service | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |

### Manager

| Module | V | C | U | D/C |
| --- | --- | --- | --- | --- |
| Dashboard | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customers | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Services/categories/packages | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Staff | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Appointments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Queue | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Billing/invoices/payments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Inventory | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Reports/analytics | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Marketing | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Notifications | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customer self-service | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |

### Staff

| Module | V | C | U | D/C |
| --- | --- | --- | --- | --- |
| Dashboard | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customers | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Services/categories/packages | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Staff | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Appointments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Queue | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Billing/invoices/payments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Inventory | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Reports/analytics | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Marketing | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Notifications | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customer self-service | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |

### Customer

| Module | V | C | U | D/C |
| --- | --- | --- | --- | --- |
| Dashboard | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customers | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Services/categories/packages | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Staff | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Appointments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Queue | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Billing/invoices/payments | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Inventory | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Reports/analytics | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Marketing | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Notifications | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |
| Customer self-service | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED | DECISION REQUIRED |

### Current runtime enforcement baseline

Current code grants all registered permissions to `owner`; `manager` has dashboard, customer, service, staff, appointment, queue, report, marketing, and notification permissions; `staff` has `dashboard.read`; `customer` has no salon-admin permissions and accesses customer-scoped routes only when linked to `User.customerId`. Current `platform.manage` protects billing and inventory. This must be approved, changed, or replaced before it is treated as the final matrix. Evidence: `Backend/src/auth/roles.ts`, `Backend/src/routes/**`, `React/src/app/App.tsx`.

## 4. Customer Membership and Loyalty

The PRD/SRS require a staff-facing membership/loyalty view, but define none of the following rules. No Membership/Loyalty backend model or API exists.

| Topic | Source definition | Current implementation | Decision |
| --- | --- | --- | --- |
| Membership status | Mentioned conceptually only. | None. | DECISION REQUIRED |
| Tiers | Not defined. | Flutter has a presentation-only loyalty widget with local values; it is not a backend rule. | DECISION REQUIRED |
| Points | Not defined. | None. | DECISION REQUIRED |
| Earning rules | Not defined. | None. | DECISION REQUIRED |
| Redemption | Not defined. | None. | DECISION REQUIRED |
| Expiry | Not defined. | None. | DECISION REQUIRED |
| Staff visibility | Staff-facing information is required; contents are not defined. | None. | DECISION REQUIRED |
| Customer visibility | Not defined. | Flutter loyalty card is static/presentation-only. | DECISION REQUIRED |
| Transaction/history | Not defined. | None. | DECISION REQUIRED |

## 5. Financial Rules

The PRD/SRS require billing/POS, invoices, line items, taxes/discounts/totals, payment status/history, and customer/service/appointment integration. They do not define financial policy.

| Topic | Current implementation | Decision status |
| --- | --- | --- |
| Currency | Integer minor-unit fields are used for invoices/payments; no currency code exists. | DECISION REQUIRED |
| Tax | No tax fields or calculations. | DECISION REQUIRED |
| Discount | No discount fields or calculations. | DECISION REQUIRED |
| Rounding | Service price is multiplied by 100 and rounded to form invoice line prices. | DECISION REQUIRED: approve representation and rounding policy. |
| Invoice totals | Backend derives subtotal/total from active services; client totals are not accepted. | Approve whether this remains the final total rule. |
| Payment status | Invoice statuses: `draft`, `issued`, `paid`, `cancelled`; payment status: `recorded`. | DECISION REQUIRED: approve lifecycle/meaning. |
| Partial payments | Allowed while cumulative payments do not exceed `totalMinor`; invoice becomes `paid` only when exact total is reached. | DECISION REQUIRED: approve partial-payment policy. |
| Refunds/voids | No refund/void operation. | DECISION REQUIRED |
| Payment history | Payment records are stored and customer invoice reads include payments. | Decide required salon/customer presentation and retention behavior. |

Evidence: `Backend/src/billing/model.ts`, `Backend/src/billing/routes.ts`, `Backend/src/routes/customerSession.ts`.

## 6. Packages

| Topic | Source definition | Current implementation | Decision |
| --- | --- | --- | --- |
| Composition | Packages are required only where defined. | Optional `serviceIds` array. | DECISION REQUIRED |
| Package price | Not defined. | No price field. | DECISION REQUIRED |
| Service quantities | Not defined. | No quantity model. | DECISION REQUIRED |
| Redemption | Not defined. | No redemption records or API. | DECISION REQUIRED |
| Expiry | Not defined. | No expiry field. | DECISION REQUIRED |
| Active/inactive | Service/package status is stored. | `active`/`inactive` status exists. | Approve status lifecycle. |
| Appointment relationship | Not defined. | Appointment references a Service, not a Package. | DECISION REQUIRED |
| Billing relationship | Not defined. | Invoice line items reference services/products, not packages. | DECISION REQUIRED |

Evidence: `Backend/src/domains/models.ts`, `routes/domains.ts`, `appointments/model.ts`, `billing/model.ts`.

## 7. Appointment Rules

| Topic | Current implementation | Decision status |
| --- | --- | --- |
| Statuses | `scheduled`, `arrived`, `in_progress`, `completed`, `cancelled`, `no_show`. | Existing implementation; formal approval required. |
| Create/edit | Admin create/patch and customer booking exist; terminal states cannot be changed. | Existing implementation; approve final workflow. |
| Cancellation | Supported only by status patch; no cancellation reason/policy/actor recorded. | DECISION REQUIRED |
| Rescheduling | Generic patch supports date/start time subject to validation. | DECISION REQUIRED: policy and customer permissions. |
| Staff availability | Active date-specific availability required. | Existing implementation; approve multi-window behavior. |
| Staff overlaps | Conflicting non-cancelled/non-no-show appointments are rejected. | Existing implementation; approve concurrency policy. |
| Customer overlaps | No customer-overlap check. | DECISION REQUIRED |
| Timezone | API accepts `YYYY-MM-DD` and `HH:MM`; no timezone is stored. | DECISION REQUIRED |
| Start/end time | End time is server-derived from service duration; bookings past midnight are rejected. | Existing implementation; approve final rule. |
| Queue transitions | Queue is derived from today’s `scheduled`, `arrived`, and `in_progress` appointments. | DECISION REQUIRED: transition/priority/walk-in rules. |
| Completed/no-show/cancelled | They are terminal for patching; cancelled/no-show do not block staff conflicts. | Existing implementation; formal approval required. |

Evidence: `Backend/src/appointments/model.ts`, `routes.ts`, `service.ts`.

## 8. Inventory / B3 Rules

| Topic | Current implementation | Decision status |
| --- | --- | --- |
| Product/item master | Product has `name`, unique `sku`, selling price minor units, stock, low-stock threshold, status. | Approve final required fields. |
| Categories | No inventory category model/API/UI. | DECISION REQUIRED |
| SKU/code | Required unique `sku`. | Approve code format and generation policy. |
| Quantity | `currentStock` is non-negative and persists. | Existing implementation; approve unit semantics. |
| Unit | No unit field. | DECISION REQUIRED |
| Stock-in | Creates signed positive StockTransaction. | Existing implementation; approve receiving source/rules. |
| Stock-out | Creates signed negative StockTransaction and rejects negative stock. | Existing implementation; approve consumption/reason rules. |
| Adjustment | Supported as positive quantity only; adjustment cannot reduce stock under current code. | DECISION REQUIRED: adjustment semantics. |
| Transaction history | Per-product query exists, sorted newest first. | Add required salon-side UI; approve retention/audit needs. |
| Low-stock threshold | Optional per-product threshold; comparison is `currentStock <= lowStockThreshold`. | Approve defaults, null behavior, and notification policy. |
| Low-stock status | Query parameter and analytics aggregation exist. | Add UI; approve alert behavior. |
| Supplier/vendor | No model/API/UI. | DECISION REQUIRED |
| Purchase/receiving | No purchase order or receiving model. | DECISION REQUIRED |
| Product cost | No cost field. | DECISION REQUIRED |
| Valuation | No valuation logic. | DECISION REQUIRED |
| Relationship to services | No service-to-product consumption rule. | DECISION REQUIRED |
| Audit/history | Transactions record product/type/quantity/reason/actor and timestamps. | Approve whether this meets audit requirements. |

Evidence: `Backend/src/inventory/model.ts`, `routes.ts`; `React/src/features/inventory/InventoryPage.tsx`.

## 9. Marketing / Notifications

| Topic | Current implementation | Decision status |
| --- | --- | --- |
| Campaigns | `Campaign` stores name, status (`draft`, `active`, `archived`), optional audience note; authorized create route exists. | DECISION REQUIRED: actual campaign behavior. |
| Target audience | Free-text `audienceNote` only. | DECISION REQUIRED |
| Delivery channels | No email/SMS/push implementation. | DECISION REQUIRED |
| Triggers | No trigger implementation. | DECISION REQUIRED |
| Scheduling | No schedule fields. | DECISION REQUIRED |
| Customer preferences | No preference model/API. | DECISION REQUIRED |
| Notification status | Notification has optional `readAt`; customer and admin read endpoints exist. | Approve lifecycle/ownership requirements. |
| Read/unread | `readAt` supports unread/read presentation. | Existing implementation; approve final policy. |
| Analytics | No campaign delivery/open/click analytics. | DECISION REQUIRED |

Evidence: `Backend/src/insights/model.ts`, `routes.ts`; `Backend/src/routes/customerSession.ts`.

## 10. Reports / Analytics

The readable PRD/SRS explicitly support operational reports with relevant filters and business/customer/appointment summaries, plus real integrated-data consumption. They do not define a report catalogue, filter definitions, authorization matrix, output format, or exports.

| Report area | Current source data | Current filters | Current authorization | Current output | Decision status |
| --- | --- | --- | --- | --- | --- |
| Dashboard summary | Payments, appointments, products | None | `reports.read` | payment total/count, appointment count, low-stock count | Approve assigned dashboard metrics. |
| Invoice report | Invoices | None | `reports.read` | grouped invoice status/count/total | Approve reporting requirements. |
| Operations report | Customers, services, staff, appointments, stock transactions | None | `reports.read` | counts, appointment-state groups, stock-movement groups | Customer summary is not implemented. |
| Trends | Appointments, products | `startDate`, `endDate` | `reports.read` | appointment counts by date, service demand, low stock | React filter UI is missing; approve date semantics. |
| Marketing/notification reporting | No report/analytics implementation | None | N/A | None | DECISION REQUIRED |
| Export | No endpoint or UI | None | N/A | None | **NOT SPECIFIED IN SOURCE DOCUMENTS - DO NOT IMPLEMENT UNLESS APPROVED.** |

Evidence: `Backend/src/insights/routes.ts`; `React/src/features/reports/ReportsPage.tsx`.

## 11. Open Decisions

The project owner/team must explicitly approve these decisions before implementation:

1. Final role names and full permission matrix for owner, manager, staff, and customer.
2. Membership/loyalty state, tiers, points, earning, redemption, expiry, and histories.
3. Currency, tax, discount, rounding, partial-payment, refund, and invoice-status rules.
4. Package composition, quantities, price, redemption, expiry, and appointment/billing behavior.
5. Customer cancellation/rescheduling rights, cancellation policy, customer overlap policy, timezone, and queue lifecycle/priority/walk-in rules.
6. Inventory categories, SKU policy, units, adjustment semantics, low-stock policy, supplier/vendor scope, receiving, cost, valuation, and service consumption.
7. Campaign targeting, channel, trigger, scheduling, preference, and analytics behavior.
8. Report catalogue, filter/date semantics, role access, customer summary requirements, and export scope.
9. Whether the current availability data model must support multiple windows/recurring schedules and how appointment validation selects windows.

## 12. Implementation Guardrails

- No developer may invent an undefined financial or business rule.
- The backend and MongoDB data model remain the source of truth.
- React and Flutter must consume the same approved API and database.
- Frontends must not duplicate business logic or maintain conflicting business datasets.
- Existing working functionality must not be broken or rewritten without a scoped reason.
- Changes must be incremental, API-contract-aware, testable, and validated before merge.
- New API/database behavior must be documented before dependent React or Flutter work begins.

## 13. Requirements Traceability

| Requirement area | Business-rule decision | Existing implementation | Required implementation | Dependency |
| --- | --- | --- | --- | --- |
| A2 Customer/CRM | Customer history scope; membership/loyalty rules; status transitions. | Customer CRUD and active/inactive status. | Profile/history UX, filtering, and approved loyalty capability. | A2 API/model decisions; appointment/billing history. |
| A3 Appointments | Lifecycle, cancellation/reschedule, timezone, overlaps, queue transitions. | Canonical references, validation, statuses, derived queue. | React create/calendar/action workflows and approved policy coverage. | A2 customers, B1 services, B2 availability. |
| A4 Billing/POS | Currency, tax, discount, rounding, refunds, payment lifecycle. | Invoice/payment persistence and service-derived totals. | POS, invoice detail/history UI and approved financial behavior. | A2 customer, A3 appointment, B1 service. |
| B1 Services | Package business behavior; status lifecycle. | Categories/services/packages models and generic CRUD. | Complete edit/filter/status/package UX. | A3 and A4 use canonical services. |
| B2 Staff | Designation/role distinction; schedule and leave lifecycle. | Staff, availability, attendance, leave persistence. | Profiles/editing, schedule UX, approved leave workflow. | A3 scheduling and role matrix. |
| B3 Inventory | Categories, units, supplier/receiving, costs/valuation, service consumption. | Product, stock quantity/movements, transactions, low-stock query. | Product master UI, categories, history, low-stock UI, approved supplier scope. | B4 reports; approved A4/service relationship. |
| B4 Reports/engagement | Report definitions/filters/export; campaign/notification policy. | Integrated analytics/reports and backend campaign/notifications. | React marketing/notification UI, report filters/customer summaries, approved export scope. | Data from A2/A3/A4/B1/B2/B3. |
| Flutter integration | Customer self-service permissions and policy decisions above. | Shared auth/profile/catalogue/booking/history API use. | Align only with approved shared rules; remove remaining static business presentation data. | Shared backend contracts and `User.customerId` ownership. |
