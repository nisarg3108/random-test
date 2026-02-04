# Quick Start Guide - Phase 2 Features

## 🚀 Quick Setup (5 Minutes)

### Step 1: Database Migration
```bash
cd backend
npx prisma migrate dev --name "phase_2_features"
```

### Step 2: Install Dependencies
```bash
# Backend (if not already done)
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 4: Login
Navigate to http://localhost:5173 and login with your credentials.

---

## 🎯 Feature Testing Checklist

### ✅ Manufacturing Module

**Test BOM Creation:**
1. Go to `/manufacturing/boms`
2. Click "Create BOM"
3. Select a finished product
4. Add component items with quantities
5. Save and verify cost calculation

**Test Work Order:**
1. Go to `/manufacturing/work-orders`
2. Click "Create Work Order"
3. Select a BOM
4. Set quantity and priority
5. Track status changes: Draft → Planned → In Progress → Completed

### ✅ Warehouse Management

**Test Warehouse:**
1. Go to `/warehouses`
2. Create a new warehouse (code: WH001)
3. View warehouse dashboard
4. Check capacity and stock metrics

**Test Stock Movements:**
1. Go to `/stock-movements`
2. Create an "IN" movement to receive stock
3. Create a "TRANSFER" between warehouses
4. Approve a pending movement
5. View movement history

### ✅ Accounting Module

**Test Chart of Accounts:**
1. Go to `/accounting/chart-of-accounts`
2. Create default accounts (if not exists)
3. Add a new account with parent
4. View hierarchical structure

**Test Journal Entry:**
1. Go to `/accounting/journal-entry`
2. Create a new entry
3. Add debit and credit lines (must balance)
4. Post to general ledger
5. View in general ledger page

### ✅ Data Import/Export

**Test CSV Import:**
```bash
# Download template
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/data/templates/items > items-template.csv

# Edit template and import
curl -X POST http://localhost:3000/api/data/import/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @import-data.json
```

**Test CSV Export:**
```bash
# Export items
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/data/export/items > items-export.csv

# Export general ledger
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/data/export/general-ledger?startDate=2024-01-01" > ledger.csv
```

---

## 📋 Sample Data Scripts

### Create Sample BOM
```javascript
// POST /api/manufacturing/boms
{
  "itemId": 1,
  "version": "1.0",
  "description": "Standard BOM for Widget A",
  "quantity": 1,
  "items": [
    {
      "itemId": 2,
      "quantity": 5,
      "unit": "pcs",
      "notes": "Plastic components"
    },
    {
      "itemId": 3,
      "quantity": 2,
      "unit": "kg",
      "notes": "Steel parts"
    }
  ]
}
```

### Create Sample Work Order
```javascript
// POST /api/manufacturing/work-orders
{
  "bomId": 1,
  "orderNumber": "WO-2024-001",
  "quantityToProduce": 100,
  "priority": "HIGH",
  "targetCompletionDate": "2024-12-31",
  "notes": "Urgent order for customer ABC"
}
```

### Create Sample Warehouse
```javascript
// POST /api/warehouses
{
  "code": "WH001",
  "name": "Main Warehouse",
  "type": "MAIN",
  "location": "123 Industrial Blvd, Building A",
  "capacity": 10000,
  "description": "Primary storage facility"
}
```

### Create Sample Stock Movement
```javascript
// POST /api/stock-movements
{
  "type": "IN",
  "itemId": 1,
  "targetWarehouseId": 1,
  "quantity": 100,
  "unitCost": 50.00,
  "date": "2024-01-15",
  "reference": "PO-2024-001",
  "notes": "Received from supplier XYZ"
}
```

### Create Sample Chart of Accounts
```javascript
// POST /api/accounting/chart-of-accounts
{
  "code": "1000",
  "name": "Assets",
  "type": "ASSET",
  "description": "Parent account for all assets"
}

// Child account
{
  "code": "1100",
  "name": "Current Assets",
  "type": "ASSET",
  "parentId": 1,
  "description": "Liquid assets"
}

// Leaf account
{
  "code": "1110",
  "name": "Cash",
  "type": "ASSET",
  "parentId": 2,
  "description": "Cash on hand and in bank"
}
```

### Create Sample Journal Entry
```javascript
// POST /api/accounting/journal-entries
{
  "date": "2024-01-15",
  "reference": "JE-2024-001",
  "description": "Initial capital investment",
  "lines": [
    {
      "accountId": 1,  // Cash account
      "debit": 100000,
      "credit": 0,
      "description": "Cash received"
    },
    {
      "accountId": 5,  // Equity account
      "debit": 0,
      "credit": 100000,
      "description": "Owner's equity"
    }
  ]
}
```

---

## 🔧 Common Operations

### Approve Stock Movement
```bash
curl -X PUT http://localhost:3000/api/stock-movements/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Post Journal Entry to Ledger
```bash
curl -X PUT http://localhost:3000/api/accounting/journal-entries/1/post \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Set Default BOM
```bash
curl -X PUT http://localhost:3000/api/manufacturing/boms/1/set-default \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Start Work Order Production
```bash
curl -X PUT http://localhost:3000/api/manufacturing/work-orders/1/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📊 Dashboard Access

### Manufacturing Dashboard
```javascript
GET /api/reporting/production
```

### Warehouse Dashboard
```javascript
GET /api/warehouses/dashboard
```

### Financial Dashboard
```javascript
GET /api/reporting/income-statement?startDate=2024-01-01&endDate=2024-12-31
GET /api/reporting/balance-sheet?asOfDate=2024-12-31
```

### Inventory Dashboard
```javascript
GET /api/reporting/inventory-summary
```

---

## 🐛 Troubleshooting

### Issue: "Account not found" in Journal Entry
**Solution:** Create Chart of Accounts first
```bash
curl -X POST http://localhost:3000/api/accounting/chart-of-accounts/defaults \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "BOM not found" when creating Work Order
**Solution:** Ensure BOM exists and status is ACTIVE
```bash
# List BOMs
curl http://localhost:3000/api/manufacturing/boms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: "Warehouse not found" in Stock Movement
**Solution:** Create warehouse first
```bash
curl -X POST http://localhost:3000/api/warehouses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"WH001","name":"Main Warehouse","type":"MAIN"}'
```

### Issue: CSV Import Fails
**Solution:** Download and use official templates
```bash
curl http://localhost:3000/api/data/templates/items \
  -H "Authorization: Bearer YOUR_TOKEN" > template.csv
```

---

## ✅ Verification Steps

After testing each feature:

1. **Check Database:**
   ```bash
   npx prisma studio
   # Verify records in respective tables
   ```

2. **Check API Response:**
   - Status code should be 200 or 201
   - Response should include created/updated record
   - No error messages in console

3. **Check Frontend:**
   - Record appears in list view
   - Can edit and update record
   - Can delete record (if applicable)

4. **Check Logs:**
   ```bash
   # Backend terminal should show successful operations
   # No 500 errors or unhandled exceptions
   ```

---

## 📈 Performance Testing

### Load Testing
```bash
# Test concurrent BOM creation
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/manufacturing/boms \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"itemId\":1,\"version\":\"$i.0\",\"quantity\":1,\"items\":[]}" &
done
```

### Bulk Import Testing
```bash
# Create CSV with 100+ records
# Import and measure time
time curl -X POST http://localhost:3000/api/data/import/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @large-import.json
```

---

## 🎓 Next Steps After Testing

1. **Create User Documentation**
   - Screenshot each feature
   - Write step-by-step guides
   - Create video tutorials

2. **Set Up Monitoring**
   - Configure error tracking
   - Set up performance monitoring
   - Create usage analytics

3. **Plan Production Deployment**
   - Database backup procedures
   - Migration rollback plan
   - Downtime communication

4. **User Training**
   - Schedule training sessions
   - Prepare demo environment
   - Create FAQ document

---

## 📞 Support

If you encounter any issues:
1. Check error logs in backend terminal
2. Check browser console for frontend errors
3. Verify database connection
4. Ensure all migrations are applied
5. Contact development team with error details

---

**Happy Testing! 🚀**
