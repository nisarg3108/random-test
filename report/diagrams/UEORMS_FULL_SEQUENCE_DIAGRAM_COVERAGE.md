# UEORMS Full Sequence Diagram Coverage

## Inputs Analyzed
- `backend/src/app.js` for complete route orchestration and module mounting.
- All major module route/service flows previously inventoried (`report/diagrams/UEORMS_ROUTE_INVENTORY.md`).
- `APPLICATION_WORKFLOWS.md` for business process lifecycles.
- `report/old_project_report.docx` extracted into `report/old_project_report_extracted.txt`.

## DOCX Alignment
- Report states integrated modules across HR, Finance, Inventory, CRM, Manufacturing, Purchase, Sales, Projects, Assets, Documents, Communication, Reporting.
- Report sequence references include login + purchase approval; this diagram expands to complete end-to-end enterprise flow coverage.

## Sequence Artifact
- PlantUML sequence: `report/diagrams/UEORMS_FULL_SEQUENCE_DIAGRAM.puml`

## Module Coverage Checklist
- Authentication / Registration / Password Reset / Invite
- Tenant + Company + Branch + Department + System Options
- RBAC + Permission checks
- Subscription entitlement checks
- Workflow engine and approvals
- Notifications + Realtime websocket broadcasts
- HR (employees, leave, tasks, work reports)
- Attendance and overtime
- Payroll and disbursement
- Finance and accounting
- Inventory and warehouse
- Manufacturing
- CRM
- Sales
- Purchase
- Accounts Payable
- Projects and team management
- Timesheets
- Asset management
- Document management
- Communication and email queue
- Reports and analytics
- Data import/export
- Integration API + event manager
- Billing + Stripe/Razorpay webhooks
- Scheduler jobs (overdue allocations + absent marking)
- Audit logging

## Notes
- This is a **master enterprise sequence** diagram; each section maps to one or more route groups in the backend.
- Coverage goal is completeness over compactness; if needed, split into per-module sequence diagrams for readability.
