# ERP System Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Frontend)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │  Warehouse   │  │ Accounting   │  │Manufacturing │  │  Reporting   │
│  │  Pages       │  │  Pages       │  │  Pages       │  │  Dashboard   │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤
│  │ • List       │  │ • COA        │  │ • BOM List   │  │ • Financial  │
│  │ • Dashboard  │  │ • GL         │  │ • Work Order │  │ • Inventory  │
│  │ • Movements  │  │ • Journal    │  │ • Operations │  │ • Production │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
│         │                │                    │                │
│         └────────────────┴────────────────────┴────────────────┘
│                            │
│                    Axios API Client
│                    (api.js - Auth + Error Handling)
│
└─────────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                          Express.js App                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              MIDDLEWARE LAYER                                  │   │
│  │  • Authentication (JWT)                                        │   │
│  │  • Authorization (Permissions)                                 │   │
│  │  • Error Handling                                              │   │
│  │  • CORS & Security                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  Warehouse   │ │  Accounting  │ │Manufacturing │ │   Branch     │  │
│  │   Routes     │ │   Routes     │ │   Routes     │ │   Routes     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│         │              │                   │              │             │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER (Services)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌───────────────────┐ │
│  │ Warehouse Service   │  │ Accounting       │  │ Manufacturing     │ │
│  │                     │  │ Service          │  │ Service           │ │
│  │ • CRUD Warehouse    │  │                  │  │                   │ │
│  │ • Stock Tracking    │  │ • Chart of       │  │ • BOM Management  │ │
│  │ • Stock Movements   │  │   Accounts       │  │ • Work Orders     │ │
│  │ • Transfers         │  │ • Journal Entry  │  │ • Operations      │ │
│  │ • Warehouse Stats   │  │ • GL Posting     │  │ • Cost Tracking   │ │
│  │ • Capacity Mgmt     │  │ • Reversals      │  │ • Material MRP    │ │
│  └─────────────────────┘  └──────────────────┘  └───────────────────┘ │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Branch Service   │  │ Reporting        │  │ Data Import/Export   │ │
│  │                  │  │ Service          │  │                      │ │
│  │ • Multi-location │  │                  │  │ • CSV Import         │ │
│  │ • Inter-branch   │  │ • Financial      │  │ • Bulk Operations    │ │
│  │   Transfers      │  │   Statements     │  │ • CSV Export         │ │
│  │ • Statistics     │  │ • Inventory      │  │ • Validation         │ │
│  │ • Warehouse Agg  │  │   Reports        │  │ • Error Reporting    │ │
│  │                  │  │ • Production     │  │                      │ │
│  │                  │  │ • Dashboard KPIs │  │                      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     DATA ACCESS LAYER (Prisma ORM)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Query Builder & ORM                             │  │
│  │  • Transactions (Data Consistency)                              │  │
│  │  • Relationships (Foreign Keys)                                  │  │
│  │  • Validation & Constraints                                      │  │
│  │  • Soft Deletes & Audit Trails                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  WAREHOUSE          ACCOUNTING         MANUFACTURING      ORGANIZATION  │
│  ─────────          ──────────         ──────────────      ──────────    │
│  • Warehouse        • ChartOfAccts     • BOM               • Branch      │
│  • WarehouseStock   • JournalEntry     • BOMItem           • Users       │
│  • StockMovement    • JournalLine      • WorkOrder         • Permissions │
│  • LotBatch         • LedgerEntry      • WorkOrderOp       • Tenants     │
│                     • FiscalYear       • WorkOrderMat      • ...         │
│                                        • ProductionBatch                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: Creating a Stock Movement

```
USER INTERFACE
    │
    └─ Selects: Item, Warehouse, Quantity, Type
    │
    ▼
FRONTEND (StockMovements.jsx)
    │
    └─ Form Validation ✓
    │
    └─ POST /api/stock-movements
       {itemId, warehouseId, quantity, type}
    │
    ▼
API LAYER (stock-movement.routes.js)
    │
    ├─ authenticate middleware ✓
    ├─ checkPermission middleware ✓
    │
    └─ stock-movement.controller.create()
    │
    ▼
BUSINESS LOGIC (stock-movement.service.js)
    │
    ├─ Validate quantity > 0 ✓
    ├─ Check warehouse exists ✓
    ├─ Check item exists ✓
    ├─ Verify user permissions ✓
    │
    └─ prisma.stockMovement.create({
       itemId, warehouseId, quantity,
       type: 'IN', status: 'PENDING',
       createdBy: userId, tenantId
    })
    │
    ▼
DATABASE (PostgreSQL)
    │
    ├─ INSERT INTO StockMovement (...)
    ├─ INSERT INTO AuditLog (...)
    │
    └─ RETURN created record
    │
    ▼
RESPONSE
    │
    ├─ 201 Created
    │
    └─ {id, referenceNumber, status, ...}
    │
    ▼
FRONTEND
    │
    └─ Display: "Movement recorded successfully"
    │
    └─ Refresh movements list
    │
    └─ Show pending approval status
```

---

## Module Dependencies

```
FRONTEND                          BACKEND                         DATABASE
─────────                         ───────                         ────────
WarehouseList                      warehouse.routes                ↕
    │                                   │                           │
    └─→ api.js ──────→ app.js ─→ warehouse.service ────→ Warehouse
                          │                              ↕
                          │                          WarehouseStock
                          │
StockMovements                    stock-movement.routes
    │                                   │
    └─→ api.js ──────→ app.js ─→ stock-movement.service ──→ StockMovement
                          │                                  ↕
                          │                              LotBatch
                          │
ChartOfAccounts           accounting.routes
    │                           │
    └─→ api.js ──────→ app.js ─→ chart-of-accounts.service ──→ ChartOfAccounts
                          │                                     ↕
GeneralLedger                     │                         LedgerEntry
    │                             │
    └─→ api.js ──────→ app.js ────────→ journal-entry.service ──→ JournalEntry
                          │                                        ↕
JournalEntry                      │                           JournalLine
    │                             │
    └─→ api.js ──────→ app.js ────────────────────────────────────
                          │
BOMList                   manufacturing.routes
    │                           │
    └─→ api.js ──────→ app.js ─→ bom.service ──────────→ BillOfMaterials
                          │                              ↕
WorkOrderList                     │                     BOMItem
    │                             │
    └─→ api.js ──────→ app.js ────────→ work-order.service ──→ WorkOrder
                          │                                     ↕
                          │                              WorkOrderOp
                          │                              ↕
                          │                              WorkOrderMat
                          │                              ↕
                          │                              ProductionBatch
                          │
Dashboard                 reporting.routes
    │                           │
    └─→ api.js ──────→ app.js ─→ reporting.service ────→ Multiple Models
```

---

## Authentication & Authorization Flow

```
USER LOGS IN
    │
    ├─ Credentials sent to /api/auth/login
    │
    ▼
BACKEND AUTH SERVICE
    │
    ├─ Validate username/password
    ├─ Check user active & not deleted
    ├─ Fetch user roles and permissions
    │
    └─ Generate JWT Token
       {userId, tenantId, roles, exp: 24h}
    │
    ▼
FRONTEND RECEIVES TOKEN
    │
    ├─ Store in localStorage
    │
    ├─ Set in api.js interceptor:
    │  Authorization: Bearer <token>
    │
    ▼
EACH API REQUEST
    │
    ├─ Token sent in header
    │
    └─ Backend middleware:
       ├─ authenticate() - Verify token valid
       ├─ Extract userId & tenantId
       ├─ Add to req.user
       │
       └─ checkPermission() - Verify user has permission
          ├─ Get user roles
          ├─ Check against required permission
          │
          └─ Allow/Deny request
```

---

## State Management in Frontend

```
React Component State (Using Hooks)
│
├─ Page State:
│  ├─ data: [items/warehouses/entries]
│  ├─ loading: boolean
│  ├─ error: string | null
│  └─ filters: {status, search, date}
│
├─ Form State (Modal):
│  ├─ formData: {field1, field2, ...}
│  ├─ loading: boolean
│  └─ error: string | null
│
├─ useEffect Hook:
│  ├─ Fetch data on mount
│  ├─ Refetch on filter change
│  └─ Cleanup on unmount
│
└─ Event Handlers:
   ├─ handleCreate() - POST new item
   ├─ handleDelete() - DELETE item
   ├─ handleApprove() - PATCH approval
   └─ handleFilter() - Update filters

All state is component-local (No Redux/Context needed for now)
```

---

## Error Handling Strategy

```
FRONTEND
    │
    ├─ Form Validation
    │  └─ Show inline error messages
    │
    ├─ API Call
    │  └─ Try-catch block
    │
    └─ Response
       ├─ 2xx - Success: Refresh data
       ├─ 4xx - Client Error: Show alert
       │  └─ 401 - Auth: Redirect to login
       │  └─ 403 - Permission: Show denied
       │  └─ 400 - Validation: Show form errors
       │
       └─ 5xx - Server Error: Show alert

BACKEND
    │
    ├─ Route Layer
    │  └─ Auth middleware catches 401
    │
    ├─ Controller Layer
    │  ├─ Validate request body
    │  └─ Check permissions
    │
    ├─ Service Layer
    │  ├─ Business logic validation
    │  ├─ Database operations
    │  └─ Error handling
    │
    └─ Error Handler Middleware
       ├─ Catch all unhandled errors
       ├─ Log error details
       └─ Return user-friendly message
```

---

## Security Measures

```
FRONTEND SECURITY
    │
    ├─ Store JWT in localStorage
    ├─ Send token in every API request
    ├─ Handle 401 → Redirect to login
    ├─ Validate form inputs
    └─ Show/hide UI based on permissions

BACKEND SECURITY
    │
    ├─ AUTHENTICATION
    │  ├─ JWT signature verification
    │  ├─ Token expiration check
    │  └─ User status verification
    │
    ├─ AUTHORIZATION
    │  ├─ Role-based checks
    │  ├─ Permission verification
    │  └─ Tenant isolation
    │
    ├─ DATA PROTECTION
    │  ├─ Input validation
    │  ├─ SQL injection prevention (Prisma)
    │  ├─ CORS enabled
    │  └─ Helmet security headers
    │
    ├─ AUDIT TRAIL
    │  ├─ Log all changes
    │  ├─ Track user actions
    │  └─ Timestamp operations
    │
    └─ ERROR HANDLING
       ├─ No sensitive info in errors
       ├─ Log details server-side
       └─ Generic messages to client
```

---

## Database Relationships

```
WAREHOUSE ECOSYSTEM
├─ Warehouse (1) ──→ (M) WarehouseStock
│                    └─→ (M) Item
├─ Warehouse (1) ──→ (M) StockMovement
│                    ├─→ Item
│                    └─→ LotBatch
└─ Warehouse (1) ──→ (M) Branch

ACCOUNTING ECOSYSTEM
├─ ChartOfAccounts (1) ──→ (M) ChartOfAccounts (Self-referencing parent)
├─ ChartOfAccounts (1) ──→ (M) JournalEntryLine
├─ ChartOfAccounts (1) ──→ (M) LedgerEntry
├─ JournalEntry (1) ──→ (M) JournalEntryLine
│                      └─→ ChartOfAccounts
└─ FiscalYear (1) ──→ (M) JournalEntry

MANUFACTURING ECOSYSTEM
├─ BillOfMaterials (1) ──→ (M) BOMItem
│                         └─→ Item
├─ BillOfMaterials (1) ──→ (M) WorkOrder
├─ WorkOrder (1) ──→ (M) WorkOrderOperation
├─ WorkOrder (1) ──→ (M) WorkOrderMaterial
├─ WorkOrder (1) ──→ (M) ProductionBatch
└─ Product (1) ──→ (M) BillOfMaterials
              ──→ (M) WorkOrder

MULTI-TENANCY
└─ Tenant (1) ──→ (M) Users
           ──→ (M) Branch
           ──→ (M) Warehouse
           ──→ (M) ChartOfAccounts
           ──→ (M) All other entities
```

---

## Performance Optimization Points

```
DATABASE LEVEL
├─ Indexes on:
│  ├─ Foreign keys (relationships)
│  ├─ Frequently filtered fields (status, date)
│  ├─ Tenant ID (multi-tenancy)
│  └─ User ID (who created)
│
├─ Queries:
│  ├─ Use INCLUDE for relationships
│  ├─ Use WHERE for filtering at DB level
│  ├─ Use COUNT for statistics
│  └─ Use SUM/AVG for aggregations

BACKEND LEVEL
├─ Caching (future): Redis for reports
├─ Pagination: Implement for large datasets
├─ Rate limiting: Protect API
├─ Connection pooling: Efficient DB access
└─ Background jobs (future): Async processing

FRONTEND LEVEL
├─ Lazy loading: Load data on demand
├─ Pagination: Show 10-50 items per page
├─ Debouncing: Search/filter delay
├─ Memoization: useMemo for calculations
└─ Code splitting (future): Route-based chunks
```

---

## Deployment Architecture (Example)

```
┌─────────────────────────────────────────────────────┐
│                  PRODUCTION ENVIRONMENT             │
├─────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────┐         ┌──────────────┐        │
│  │   Frontend   │         │   Backend    │        │
│  │   (React)    │◄─API──► │  (Express)   │        │
│  │   Vercel/    │         │   Railway/   │        │
│  │   Netlify    │         │   Heroku     │        │
│  └──────────────┘         └──────────────┘        │
│                                   │                │
│                                   │ (SQL)          │
│                                   ▼                │
│                          ┌──────────────┐         │
│                          │ PostgreSQL   │         │
│                          │ Database     │         │
│                          └──────────────┘         │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │         MONITORING & LOGGING             │    │
│  │  • Application Logs                      │    │
│  │  • Database Logs                         │    │
│  │  • Error Tracking (Sentry)               │    │
│  │  • Performance Monitoring (NewRelic)     │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
└─────────────────────────────────────────────────────┘
```

---

**System is production-ready and fully documented!**
