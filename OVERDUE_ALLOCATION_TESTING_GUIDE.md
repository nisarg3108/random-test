# 🧪 Overdue Allocation Testing Guide

## Overview
This guide provides multiple testing methods for the overdue allocation detection system, including automated scripts, manual UI testing, and database verification.

---

## 🚀 Quick Test Methods

### **Option 1: Browser Console Test** (Recommended - Easiest!)

**Perfect for quick testing - uses your current login session**

1. Login to frontend (http://localhost:3000)
2. Open browser DevTools (F12) → **Console** tab
3. Open `browser-test-overdue.js`
4. Copy all code and paste into console
5. Press Enter and watch the test run!

**What it tests:**
- ✅ Creates allocation with past due date (3 days ago)
- ✅ Triggers manual overdue detection
- ✅ Verifies allocation marked as OVERDUE
- ✅ Checks overdue allocations list
- ✅ Tests returning overdue allocation
- ✅ Verifies asset status restoration

---

### **Option 2: Manual UI Testing**

**Step-by-step testing through the user interface**

#### Prerequisites
- Backend running on port 5000
- Frontend running on port 3000
- At least 1 asset and 1 employee in database

#### Test Steps

1. **Create Overdue Allocation**
   - Go to **Assets** → **Allocations**
   - Click **"Allocate Asset"**
   - Fill in form:
     - Asset: Select any available asset
     - Employee: Select any employee
     - Expected Return Date: **Enter yesterday's date or earlier**
     - Purpose: "Test overdue detection"
   - Click **Create**
   - **✅ Verify**: Allocation appears with ACTIVE status (green badge)

2. **Trigger Overdue Detection**
   - Open browser console (F12)
   - Run this command:
   ```javascript
   fetch('http://localhost:5000/api/asset-allocations/mark-overdue', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token'),
       'x-tenant-id': localStorage.getItem('tenantId') || '1',
       'Content-Type': 'application/json'
     }
   }).then(r => r.json()).then(d => console.log(d));
   ```
   - **✅ Verify**: Console shows "Marked X allocation(s) as overdue"

3. **Check Overdue Stats**
   - Refresh the Allocations page
   - **✅ Verify**: "Overdue" stat card shows count > 0
   - **✅ Verify**: Red highlight indicating overdue items

4. **Filter Overdue Allocations**
   - Click on the **"Overdue"** stat card (or use dropdown filter)
   - **✅ Verify**: Only overdue allocations shown
   - **✅ Verify**: Rows have red background
   - **✅ Verify**: Shows "X days overdue" under expected return date

5. **Return Overdue Allocation**
   - Click **"Return"** button on overdue allocation
   - Enter condition: "GOOD"
   - Enter notes: "Returned after overdue test"
   - **✅ Verify**: Status changes to RETURNED (blue badge)
   - **✅ Verify**: Asset status changes to AVAILABLE

---

### **Option 3: Automated Node.js Script**

**For CI/CD integration or automated testing**

1. Update credentials in `test-overdue-allocations.js`:
   ```javascript
   const TEST_USER = {
     email: 'your-email@example.com',
     password: 'your-password'
   };
   ```

2. Run:
   ```bash
   node test-overdue-allocations.js
   ```

3. Watch the output for test results

---

## 📊 Database Verification

### Check Allocation Status

```sql
-- View all allocations with status and expected return dates
SELECT 
  id,
  status,
  "allocatedDate",
  "expectedReturnDate",
  "assetId",
  "employeeId",
  CASE 
    WHEN "expectedReturnDate" < NOW() AND status = 'ACTIVE' THEN 'SHOULD BE OVERDUE'
    ELSE 'OK'
  END as check_status
FROM "AssetAllocation"
WHERE status IN ('ACTIVE', 'OVERDUE')
ORDER BY "expectedReturnDate" ASC;
```

### Count Overdue Allocations

```sql
-- Count allocations that should be marked as overdue
SELECT 
  status,
  COUNT(*) as count
FROM "AssetAllocation"
WHERE "expectedReturnDate" < NOW()
  AND status IN ('ACTIVE', 'OVERDUE')
GROUP BY status;
```

### Find Past-Due ACTIVE Allocations

```sql
-- Find allocations that are past due but still marked as ACTIVE
-- These should be marked as OVERDUE by the scheduled job
SELECT 
  a.id,
  a.status,
  a."expectedReturnDate",
  EXTRACT(DAY FROM NOW() - a."expectedReturnDate") as days_overdue,
  ast.name as asset_name,
  emp.name as employee_name
FROM "AssetAllocation" a
JOIN "Asset" ast ON a."assetId" = ast.id
JOIN "Employee" emp ON a."employeeId" = emp.id
WHERE a.status = 'ACTIVE'
  AND a."expectedReturnDate" < NOW()
ORDER BY a."expectedReturnDate" ASC;
```

---

## 🔄 Scheduled Job Testing

### Verify Scheduled Job is Running

1. Check server startup logs:
   ```
   ⏰ Initializing scheduled jobs...
   ✅ Scheduled jobs initialized
      - Overdue allocations: Daily at midnight (00:00)
   ```

2. The job runs automatically at **midnight (00:00)** every day

### Test Scheduled Job Immediately

If you want to test the scheduled job without waiting for midnight:

**Option A: Restart Server**
- The `initializeScheduledJobs()` function is called on server startup
- Jobs begin monitoring immediately

**Option B: Modify Schedule Temporarily**

Edit `backend/src/core/scheduler.js`:
```javascript
// Change from daily at midnight to every minute (for testing)
cron.schedule('* * * * *', async () => {  // Runs every minute
  console.log('🔍 Running scheduled job: Check overdue allocations');
  // ... rest of the code
});
```

**Remember to change it back after testing!**

**Option C: Manual API Call**
```bash
curl -X POST http://localhost:5000/api/asset-allocations/mark-overdue \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: 1" \
  -H "Content-Type: application/json"
```

---

## 🎯 Expected Results

### Immediately After Creating Past-Due Allocation
- Status: **ACTIVE** (not yet detected as overdue)
- Asset Status: **ALLOCATED**
- Overdue stat card: Does not include this allocation yet

### After Running Overdue Detection
- Allocation Status: **OVERDUE** (red badge)
- Asset Status: **ALLOCATED** (unchanged)
- Overdue stat card: Count increased
- Row background: Red highlight
- Shows: "X days overdue" message

### After Returning Overdue Allocation
- Allocation Status: **RETURNED** (blue badge)
- Asset Status: **AVAILABLE**
- Overdue stat card: Count decreased
- Return date populated

---

## 🐛 Troubleshooting

### Issue: Allocations not being marked as OVERDUE

**Check:**
1. Is `expectedReturnDate` actually in the past?
   ```javascript
   console.log(new Date(allocation.expectedReturnDate) < new Date()); // Should be true
   ```

2. Is the scheduled job running?
   - Check server logs for "Initializing scheduled jobs..."
   - Manually trigger: `POST /api/asset-allocations/mark-overdue`

3. Check database directly:
   ```sql
   SELECT * FROM "AssetAllocation" 
   WHERE status = 'ACTIVE' 
     AND "expectedReturnDate" < NOW();
   ```

### Issue: Overdue count not showing in UI

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Verify API endpoint: `GET /api/asset-allocations/overdue`
4. Clear browser cache

### Issue: Can't return overdue allocation

**Solution:**
1. Verify the "Return" button is visible (should show for OVERDUE status)
2. Check browser console for API errors
3. Verify asset is still ALLOCATED

### Issue: Scheduled job not running

**Solution:**
1. Check `node-cron` is installed: `npm list node-cron`
2. Verify server started successfully
3. Check for errors in server startup logs
4. Ensure `initializeScheduledJobs()` is called in `server.js`

---

## ✅ Test Checklist

Use this checklist to verify all functionality:

- [ ] Create allocation with past due date (3 days ago)
- [ ] Verify allocation starts with ACTIVE status
- [ ] Verify asset status changes to ALLOCATED
- [ ] Trigger manual overdue detection via API
- [ ] Verify allocation status changes to OVERDUE
- [ ] Verify asset status remains ALLOCATED
- [ ] Check overdue allocations endpoint returns the allocation
- [ ] Verify overdue stat card shows correct count
- [ ] Click on overdue stat card to filter
- [ ] Verify filtered view shows only overdue items
- [ ] Verify rows have red background
- [ ] Verify "X days overdue" message displays
- [ ] Click "Return" on overdue allocation
- [ ] Enter return condition and notes
- [ ] Verify allocation status changes to RETURNED
- [ ] Verify asset status changes to AVAILABLE
- [ ] Verify overdue count decreased

---

## 📝 Test Data Examples

### Create Test Allocation (3 days overdue)

```javascript
{
  "assetId": "asset-uuid-here",
  "employeeId": "employee-uuid-here",
  "allocatedDate": "2026-02-11T00:00:00.000Z",
  "expectedReturnDate": "2026-02-08T00:00:00.000Z",  // 3 days ago
  "purpose": "Test overdue detection",
  "location": "Office"
}
```

### Create Test Allocation (1 week overdue)

```javascript
{
  "assetId": "asset-uuid-here",
  "employeeId": "employee-uuid-here",
  "allocatedDate": "2026-01-28T00:00:00.000Z",
  "expectedReturnDate": "2026-02-04T00:00:00.000Z",  // 7 days ago
  "purpose": "Long overdue test",
  "location": "Remote"
}
```

---

## 🔔 Production Notes

1. **Scheduled Job**: Runs automatically at midnight (00:00) every day
2. **No Manual Intervention**: System automatically detects and marks overdue allocations
3. **Email Notifications**: Consider adding email alerts for overdue allocations (future enhancement)
4. **Grace Period**: Consider adding a grace period (e.g., mark as overdue only after 1 day past due)
5. **Escalation**: Consider escalation after X days overdue (e.g., notify manager)

---

## 💡 Future Enhancements

- [ ] Email notifications to employees with overdue allocations
- [ ] Email notifications to managers when items are overdue
- [ ] SMS notifications for critical overdue items
- [ ] Dashboard widget showing overdue trends
- [ ] Automatic escalation after X days overdue
- [ ] Grace period configuration per asset category
- [ ] Late fees calculation for overdue allocations
- [ ] Overdue history and analytics

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review server logs for errors
3. Verify database state using SQL queries above
4. Test with browser console script for debugging
5. Check that backend server is running and accessible
