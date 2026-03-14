# UEORMS Full Activity Diagram Coverage

## Inputs Analyzed
- `backend/src/app.js` route orchestration and middleware guards.
- `report/diagrams/UEORMS_ROUTE_INVENTORY.md` (`574` parsed endpoints from `*.routes.js`).
- `backend/src/modules/company/companyRoutes.js` (`6` mounted endpoints not included in route inventory parser).
- `backend/src/routes/missing-routes.js` (`26` mounted compatibility endpoints not included in route inventory parser).
- `report/old_project_report_extracted.txt` for stated scope, requirements, and activity context.
- `report/diagrams/UEORMS_FULL_USE_CASE_DIAGRAM.puml` for UC01-UC121 functional envelope.

## Effective API Coverage Basis
- Route inventory baseline: `574` endpoints.
- Additional mounted non-standard route files: `32` endpoints (`6 + 26`).
- Effective mounted API handlers covered by the activity model: `606` (`574 + 32`), plus root health message route (`GET /` in `app.js`).

## Report (DOCX) Alignment
- Project scale targets in report: 19 backend modules and approximately 574 endpoints.
- Consolidated requirements covered: `R1` to `R18`.
- Report activity expectation (login + request + approval) is expanded to full enterprise flow coverage across all mounted domains.
- Report domain scope covered: HR, Finance, Inventory, CRM, Manufacturing, Purchase, Sales, Projects, Assets, Documents, Communication, Reporting, with RBAC, workflow, audit, notifications, and subscription.

## Domain Coverage Checklist
- [x] Onboarding, registration, login, password reset, public plans (`UC01-UC05`, `UC15`)
- [x] Core tenant/admin setup: users, invites, company, branches, departments, system options, dashboard (`UC06-UC14`)
- [x] Subscription and billing lifecycle including webhooks (`UC16-UC19`)
- [x] Workflow engine, approvals, audit, notifications, realtime (`UC20-UC29`)
- [x] HR, attendance, payroll, disbursement (`UC30-UC47`)
- [x] Finance and accounting (`UC48-UC55`)
- [x] Inventory and manufacturing (`UC56-UC65`)
- [x] CRM and sales (`UC66-UC78`)
- [x] Purchase and accounts payable (`UC79-UC92`)
- [x] Projects and timesheets (`UC93-UC99`)
- [x] Assets, documents, communication (`UC100-UC113`)
- [x] Reports, data import/export, integration sync (`UC114-UC121`)
- [x] Compatibility/fallback API paths from `missing-routes.js`
- [x] Background operations: scheduler jobs, realtime sessions, billing webhook idempotency

## Output Artifact
- PlantUML activity diagram: `report/diagrams/UEORMS_FULL_ACTIVITY_DIAGRAM.puml`
