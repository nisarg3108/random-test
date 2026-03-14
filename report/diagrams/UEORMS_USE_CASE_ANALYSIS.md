# UEORMS Project + DOCX Analysis for Full Use Case Modeling

## Inputs Analyzed
- Codebase: `backend/src/app.js`, all `*.routes.js` files under `backend/src`, and `frontend/src/App.jsx`.
- Existing report document: `report/old_project_report.docx` (extracted to `report/old_project_report_extracted.txt`).
- Supporting report: `report/ERP_SYSTEM_PROJECT_REPORT_2026.md`.

## What Was Confirmed
- `old_project_report.docx` and route inventory are aligned on scale: approximately 574 routed endpoints.
- The implemented platform is a multi-tenant ERP with role-based access, approvals/workflows, billing entitlements, audit logs, and real-time activity streams.
- Major actors in the report (Admin, Manager, Employee, Finance, HR, Inventory, Sales) are present in code and were expanded using real role definitions from dashboard/RBAC.

## Actor Set Used in Final Diagram
- Guest
- Authenticated User
- Tenant Admin
- Manager
- HR Manager
- HR Staff
- Employee
- Finance Manager
- Accountant
- Inventory Manager
- Warehouse Staff
- Sales Manager
- Sales Staff
- Purchase Manager
- Project Manager
- Auditor
- External systems: Payment Gateway (Stripe/Razorpay), Email Service, Banking System, Integration Worker, Realtime Gateway

## Module Coverage Included in Final Diagram
- Access, registration, login, password reset, invitations
- User/role/permission management (RBAC)
- Department/company/branch/system option configuration
- Subscription/billing/invoices/webhooks
- Workflow definitions, approval queue, approve/reject actions
- Audit log viewing and notification lifecycle
- HR: employees, leave, attendance, shifts, overtime, tasks
- Payroll: components, tax config, cycles, payslips, disbursements, reconciliation
- Finance: expense categories/claims, accounting, journal posting/reversal, ledger
- Inventory: items, warehouses, stock transfers/movements, approvals
- Manufacturing: BOM, work orders, operations, materials
- CRM: customers, contacts, leads, deals, pipelines, activities, attachments
- Sales: quotations, orders, invoices, payments, tracking, analytics, forecasting
- Purchase: vendors, requisitions, purchase orders, receipts, evaluations, analytics
- AP: bills, three-way matching, bill/payment attachments, aging, vendor statements
- Projects: projects, milestones, resources, budgets, members, capacity
- Timesheets: create/update/submit/approve/reject
- Assets: categories, assets, allocations, overdue tracking, maintenance, depreciation
- Documents: folders, templates, versions, sharing, permissions, downloads, activities
- Communication: conversations, channels, messaging, reactions, announcements, email templates/queue, file upload/search
- Reports: financial/HR/inventory/custom/saved/export/scheduling
- Data import/export utilities
- Integration sync and monitoring

## Artifacts Created
- Full use case diagram (PlantUML): `report/diagrams/UEORMS_FULL_USE_CASE_DIAGRAM.puml`
- Endpoint traceability inventory: `report/diagrams/UEORMS_ROUTE_INVENTORY.md`
- DOCX extracted text used for analysis: `report/old_project_report_extracted.txt`

## Note on Completeness
The use-case model was constructed from actual implemented routes and frontend navigation, then cross-checked against the old report's stated modules and actors to minimize omissions.
