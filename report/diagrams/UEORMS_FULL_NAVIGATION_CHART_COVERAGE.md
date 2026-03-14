# UEORMS Full Navigation Chart Coverage

## Inputs Analyzed
- `frontend/src/App.jsx` for complete frontend routed navigation.
- `frontend/src/components/layout/Sidebar.jsx` for role-based and module-based menu visibility.
- `frontend/src/pages/Dashboard.jsx` for role-to-dashboard routing.
- `frontend/src/auth/Login.jsx` for post-login billing gating and redirects.
- `report/old_project_report_extracted.txt` for navigation intent:
  - `4.3 Navigation Chart`
  - `Figure 4.1 illustrates major user navigation from login to module operations and reporting`
  - User manual navigation notes (sidebar-driven workflows).
- `backend/src/app.js` + `report/diagrams/UEORMS_ROUTE_INVENTORY.md` for backend module operation mapping.

## Frontend Navigation Coverage
- Total routed paths in `App.jsx`: **111**
- Public routes: **6**
  - `/`, `/login`, `/register`, `/forgot-password`, `/accept-invite`, `/theme-demo`
- Protected routes: **105**
- Role dashboards mapped in dashboard resolver: **14 roles**
  - ADMIN, MANAGER, HR_MANAGER, HR_STAFF, FINANCE_MANAGER, ACCOUNTANT, INVENTORY_MANAGER, WAREHOUSE_STAFF, SALES_MANAGER, SALES_STAFF, PURCHASE_MANAGER, PROJECT_MANAGER, EMPLOYEE, USER

## Module Route Group Coverage (from App.jsx)
- Core Access: 3
- Inventory and Warehouse: 9
- Manufacturing: 2
- HR and Payroll: 12
- Employee Self Service: 5
- Finance and Accounting: 13
- CRM and Sales: 14
- Purchase and AP: 9
- Projects and Timesheets: 5
- Assets and Documents: 9
- Communication: 3
- Workflow and Approvals: 5
- Reports and Audit: 8
- System and Admin Config: 8

## Backend Mapping Coverage
- Route inventory baseline from backend `*.routes.js`: **574 endpoints**
- Navigation chart includes API target mapping for all mounted backend domain groups in `app.js` (core + module + billing + integration + reporting).

## Output Artifact
- Navigation chart diagram: `report/diagrams/UEORMS_FULL_NAVIGATION_CHART.puml`
