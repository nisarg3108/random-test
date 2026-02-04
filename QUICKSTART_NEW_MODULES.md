# ERP System - New Modules Quick Start Guide

## Getting Started

### 1. Database Setup

```bash
# Navigate to backend
cd backend

# Run migrations to create new tables
npx prisma migrate dev --name "add_warehouse_accounting_manufacturing"

# Seed default data (chart of accounts, warehouses, etc.)
npm run seed
```

### 2. Start Backend Server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:5000/api`

### 3. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The UI will be available at `http://localhost:5173` (or shown in terminal)

---

## Testing New Modules

### Warehouse Management

#### Test Warehouse Creation
1. Navigate to Warehouse Management
2. Click "Add Warehouse"
3. Fill in:
   - Code: `WH001`
   - Name: `Main Warehouse`
   - Type: `GENERAL`
   - City: `New York`
   - Capacity: `10000`
4. Click "Create Warehouse"

#### Test Stock Movement
1. Go to Stock Movements
2. Click "Record Movement"
3. Select:
   - Type: `Inbound`
   - Item: (select from dropdown)
   - Warehouse: `Main Warehouse`
   - Quantity: `100`
4. Submit
5. View pending movements
6. Approve the movement

#### Test Warehouse Transfer
1. Record Movement
2. Select Type: `Transfer`
3. Select:
   - From Warehouse: `WH001`
   - To Warehouse: `WH002` (create second warehouse first)
   - Quantity: `50`
4. Submit and approve

---

### Financial Accounting

#### Test Chart of Accounts
1. Navigate to Chart of Accounts
2. View default accounts (ASSETS, LIABILITIES, etc.)
3. Click "Add Account"
4. Create new account:
   - Type: `ASSET`
   - Number: `1100`
   - Name: `Cash in Bank`
5. Create hierarchical structure by selecting parent accounts

#### Test Journal Entry
1. Go to Journal Entries
2. Click "New Entry"
3. Add lines:
   - Line 1: Debit Cash Account (1000) / Credit Sales Revenue (4000)
   - Line 2: Credit amount must equal debit amount
4. Entry must balance before posting
5. Click "Create Entry"
6. Once created, click "Post" to record in general ledger

#### Test General Ledger
1. Go to General Ledger
2. Filter by date range or account
3. View running balance calculation
4. Verify debits = credits

---

### Manufacturing

#### Test BOM Creation
1. Navigate to Bills of Material
2. Click "Create BOM"
3. Fill in:
   - BOM Number: `BOM-001`
   - Product: (select from dropdown)
   - Items: Add 2-3 items with quantities
4. Click "Create BOM"
5. View estimated cost calculation

#### Test Work Order
1. Go to Work Orders
2. Click "Create Work Order"
3. Fill in:
   - WO Number: `WO-001`
   - BOM: `BOM-001` (previously created)
   - Quantity: `10`
   - Target Completion: (select date)
   - Priority: `HIGH`
4. Click "Create Work Order"

#### Test Work Order Workflow
1. View created work order
2. Click "Plan" (Draft → Planned)
3. Click "Start" (Planned → In Progress)
4. View progress bar
5. Click "Complete" (In Progress → Completed)

---

### Reports & Analytics

#### Test Financial Reports
```bash
# Income Statement
GET /api/reporting/income-statement?fromDate=2024-01-01&toDate=2024-12-31

# Balance Sheet
GET /api/reporting/balance-sheet?asOfDate=2024-12-31

# Dashboard Summary
GET /api/reporting/dashboard-summary
```

#### Test Inventory Reports
```bash
# Inventory Summary
GET /api/reporting/inventory-summary

# Stock Movement Report
GET /api/reporting/stock-movement?fromDate=2024-01-01&toDate=2024-12-31
```

#### Test Manufacturing Reports
```bash
# Production Report
GET /api/reporting/production?fromDate=2024-01-01&toDate=2024-12-31

# BOM Analysis
GET /api/reporting/bom-analysis
```

---

## API Testing with cURL

### Create Warehouse
```bash
curl -X POST http://localhost:5000/api/warehouses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "code": "WH001",
    "name": "Main Warehouse",
    "type": "GENERAL",
    "city": "New York",
    "capacity": 10000
  }'
```

### Create Journal Entry
```bash
curl -X POST http://localhost:5000/api/accounting/journal-entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "referenceNumber": "JE-001",
    "description": "Initial entry",
    "transactionDate": "2024-01-15",
    "lines": [
      {
        "accountId": "acc-001",
        "debitAmount": 1000,
        "creditAmount": 0,
        "description": "Cash in"
      },
      {
        "accountId": "acc-002",
        "debitAmount": 0,
        "creditAmount": 1000,
        "description": "Revenue"
      }
    ]
  }'
```

### Create BOM
```bash
curl -X POST http://localhost:5000/api/manufacturing/bom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bomNumber": "BOM-001",
    "productId": "prod-001",
    "description": "Standard product BOM",
    "items": [
      {
        "itemId": "item-001",
        "quantity": 5,
        "unitCost": 100
      }
    ]
  }'
```

---

## Data Import/Export

### Import Items via CSV
```bash
# Create CSV file: items.csv
itemCode,name,category,unitCost,minimumQuantity
ITEM001,Bolt M5,Hardware,10.50,100
ITEM002,Washer M5,Hardware,2.50,500

# Upload via API
POST /api/import/items (with file upload)
```

### Export Warehouse Stock
```bash
# Get warehouse stock export
GET /api/export/warehouse-stock?warehouseId=wh-001
```

---

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run: `npx prisma db push` to ensure schema is up to date

### API Not Responding
- Check backend is running on port 5000
- Verify REACT_APP_API_URL in frontend .env
- Check browser console for CORS errors

### Missing Data in Frontend
- Verify user has proper permissions
- Check tenant ID is set correctly
- View API response in Network tab

### Journal Entry Won't Balance
- Ensure debit lines total = credit lines total
- Check calculation before submission
- Entry must balance before posting

---

## Key Endpoints Summary

| Feature | Method | Endpoint |
|---------|--------|----------|
| List Warehouses | GET | /api/warehouses |
| Create Warehouse | POST | /api/warehouses |
| Record Movement | POST | /api/stock-movements |
| Approve Movement | PATCH | /api/stock-movements/:id/approve |
| Chart of Accounts | GET | /api/accounting/chart-of-accounts |
| Create Journal | POST | /api/accounting/journal-entries |
| Post Journal | PATCH | /api/accounting/journal-entries/:id/post |
| General Ledger | GET | /api/accounting/general-ledger |
| Create BOM | POST | /api/manufacturing/bom |
| Create Work Order | POST | /api/manufacturing/work-orders |
| Dashboard | GET | /api/reporting/dashboard-summary |
| Income Statement | GET | /api/reporting/income-statement |
| Inventory Report | GET | /api/reporting/inventory-summary |

---

## Notes

- All endpoints require authentication token in header: `Authorization: Bearer TOKEN`
- Tenant ID is automatically extracted from authenticated user
- All dates should be in ISO format: `YYYY-MM-DD`
- Amounts are in base currency (no decimal places for cents)
- Delete operations may be soft-delete (status change) depending on entity

---

**For issues or questions, check:**
1. Backend logs in terminal
2. Browser DevTools Network tab
3. Database queries in Prisma Studio: `npx prisma studio`
