# 🧪 Maintenance Workflow Testing Guide

## Overview
This guide walks you through testing the complete maintenance lifecycle implementation, including:
- ✅ Creating maintenance schedules
- ✅ Starting maintenance (transitions asset status to MAINTENANCE)
- ✅ Status tracking with `statusBeforeMaintenance`
- ✅ Completing maintenance (restores original asset status)
- ✅ Handling multiple concurrent maintenance schedules

---

## 🚀 Quick Test (UI Method)

### Prerequisites
1. Backend server running on `http://localhost:5000`
2. Frontend running on `http://localhost:3000`
3. Logged in as a user with access to Asset Management

### Test Steps

#### **Step 1: Prepare Test Asset**
1. Navigate to **Assets** → **Asset List**
2. Find or create an asset with status **"AVAILABLE"** or **"ALLOCATED"**
3. Note the asset name and current status (e.g., "Laptop Dell XPS 15" - AVAILABLE)

#### **Step 2: Create Maintenance Schedule**
1. Go to **Assets** → **Maintenance**
2. Click **"Schedule Maintenance"**
3. Fill in the form:
   - **Asset**: Select your test asset
   - **Type**: PREVENTIVE
   - **Description**: "Test maintenance - Oil change and inspection"
   - **Scheduled Date**: Today's date
   - **Cost**: 500
   - **Performed By**: "Test Technician"
4. Click **Create**
5. **✅ Verify**: New record appears with status **SCHEDULED** (yellow badge)

#### **Step 3: Start Maintenance**
1. Find the maintenance record you just created
2. Click the **"Start"** button (▶️ Play icon)
3. Confirm the action
4. **✅ Verify**: Status changes to **IN_PROGRESS** (blue badge)

#### **Step 4: Check Asset Status Changed**
1. Navigate to **Assets** → **Asset List**
2. Find your test asset
3. **✅ Verify**: Status should now be **MAINTENANCE** (gray/blue indicator)
4. **🎯 Expected**: Asset was AVAILABLE → now MAINTENANCE

#### **Step 5: Check Backend Data (Optional)**
Open your database tool and check:
```sql
-- Check maintenance record
SELECT id, "assetId", status, "statusBeforeMaintenance", "maintenanceType"
FROM "AssetMaintenance"
WHERE id = <your_maintenance_id>;

-- Expected:
-- status: 'IN_PROGRESS'
-- statusBeforeMaintenance: 'AVAILABLE' (or whatever it was before)
```

#### **Step 6: Complete Maintenance** (Coming Soon in UI)
For now, use the API directly:
```bash
# Get your auth token from browser dev tools → Application → Local Storage
# Look for 'token' key

curl -X PUT http://localhost:5000/api/asset-maintenance/<maintenance_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "x-tenant-id: 1" \
  -d '{
    "status": "COMPLETED",
    "performedBy": "Test Technician",
    "cost": 550,
    "conditionAfter": "GOOD",
    "notes": "All systems checked and operating normally"
  }'
```

#### **Step 7: Verify Asset Status Restored**
1. Go back to **Assets** → **Asset List**
2. Find your test asset
3. **✅ Verify**: Status restored to original (e.g., AVAILABLE)
4. **🎯 Expected**: Asset MAINTENANCE → back to AVAILABLE

---

## 🔬 Advanced Test: Multiple Concurrent Maintenance

This tests that status restoration only happens when **all** maintenance is complete.

### Scenario
An asset can have multiple maintenance schedules active simultaneously. The asset should only return to its original status when **all** maintenance is completed.

### Test Steps

1. **Create Asset** (if needed):
   - Name: "Multi-Maintenance Test Vehicle"
   - Status: ALLOCATED
   - Location: "Warehouse A"

2. **Create First Maintenance**:
   - Type: PREVENTIVE
   - Description: "Oil change"
   - Status: SCHEDULED

3. **Create Second Maintenance**:
   - Type: INSPECTION
   - Description: "Safety inspection"
   - Status: SCHEDULED

4. **Start First Maintenance**:
   - Click "Start" on oil change
   - **✅ Verify**: Asset status → MAINTENANCE
   - **✅ Verify**: Maintenance status → IN_PROGRESS

5. **Start Second Maintenance**:
   - Click "Start" on safety inspection
   - **✅ Verify**: Asset still MAINTENANCE
   - **✅ Verify**: Both maintenance records show IN_PROGRESS

6. **Complete First Maintenance**:
   - Complete oil change via API/UI
   - **✅ Verify**: Asset **remains** MAINTENANCE (because inspection is still active)

7. **Complete Second Maintenance**:
   - Complete safety inspection
   - **✅ Verify**: Asset status restored to ALLOCATED (original status)

---

## 🛠️ Automated Test Script

### Option 1: Update Credentials and Run

1. Open `test-maintenance-workflow.js`
2. Update credentials at the top:
   ```javascript
   const TEST_USER = {
     email: 'your-email@example.com',    // Your actual login email
     password: 'your-actual-password'     // Your actual password
   };
   ```
3. Run the script:
   ```bash
   node test-maintenance-workflow.js
   ```

### Option 2: Get Token from Browser

1. Login to the frontend
2. Open browser DevTools → Application → Local Storage
3. Copy the `token` value
4. Use curl or Postman to test endpoints directly

---

## 📊 Expected Results Summary

| Step | Action | Asset Status | Maintenance Status | Key Field |
|------|--------|--------------|-------------------|-----------|
| 1 | Create schedule | AVAILABLE | SCHEDULED | - |
| 2 | Start maintenance | MAINTENANCE | IN_PROGRESS | statusBeforeMaintenance = 'AVAILABLE' |
| 3 | Complete (no other active) | AVAILABLE | COMPLETED | Restored from statusBeforeMaintenance |
| 4 | Complete (others active) | MAINTENANCE | COMPLETED | Stays MAINTENANCE |

---

## 🐛 Troubleshooting

### Issue: "Authorization header missing"
**Solution**: Make sure you're logged in and the token is included in requests.

### Issue: Asset status not changing
**Solution**: Check backend logs. Verify the maintenance service is correctly updating the asset table.

### Issue: Status not restoring after completion
**Solution**: Check if there are other IN_PROGRESS maintenance records for the same asset.

### Issue: "Start" button not appearing
**Solution**: Refresh the page. The button only shows for SCHEDULED maintenance records.

---

## 🧪 Database Verification Queries

```sql
-- Check maintenance records for an asset
SELECT 
  m.id,
  m.status,
  m."statusBeforeMaintenance",
  m."maintenanceType",
  m.description,
  a.name AS asset_name,
  a.status AS current_asset_status
FROM "AssetMaintenance" m
JOIN "Asset" a ON m."assetId" = a.id
WHERE m."assetId" = <asset_id>
ORDER BY m."createdAt" DESC;

-- Count active maintenance per asset
SELECT 
  "assetId",
  COUNT(*) AS active_maintenance_count
FROM "AssetMaintenance"
WHERE status = 'IN_PROGRESS'
GROUP BY "assetId";

-- Check status transition history (if audit logs exist)
SELECT * FROM "AuditLog"
WHERE "entityType" = 'Asset'
  AND "entityId" = <asset_id>
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## ✅ Success Criteria

- [x] Maintenance schedule created with SCHEDULED status
- [x] Starting maintenance transitions asset to MAINTENANCE status
- [x] statusBeforeMaintenance field populated correctly
- [x] Maintenance status changes to IN_PROGRESS
- [x] Multiple concurrent maintenance schedules handled properly
- [x] Completing single maintenance restores asset status
- [x] Completing with other active maintenance keeps asset in MAINTENANCE
- [x] Audit logs created for all status changes

---

## 📝 Notes

- **Status Flow**: SCHEDULED → IN_PROGRESS → COMPLETED
- **Asset Protection**: An asset stays in MAINTENANCE until **all** active maintenance is complete
- **Status Memory**: `statusBeforeMaintenance` stores the original status for restoration
- **Concurrent Safe**: Multiple maintenance schedules can be active simultaneously

---

## 🎯 Next Steps After Testing

Once manual testing is complete:
1. Consider implementing automated E2E tests with Playwright/Cypress
2. Add UI for completing maintenance (currently API-only)
3. Implement OVERDUE status calculation for past scheduled dates
4. Add notifications for upcoming maintenance schedules
5. Create maintenance calendar view
