# AP Module - Testing Session Guide
## 🎯 February 9, 2026

---

## ✅ Server Status

### Backend Server
- **Status:** ✅ RUNNING
- **Port:** 5000
- **PID:** 40376
- **URL:** http://localhost:5000

### Frontend Server
- **Status:** ✅ RUNNING
- **Port:** 5173
- **PID:** 38776
- **URL:** http://localhost:5173

---

## 🚀 Quick Access Links

### Main AP Pages
1. **AP Bills:** http://localhost:5173/ap/bills
2. **AP Payments:** http://localhost:5173/ap/payments
3. **AP Aging Report:** http://localhost:5173/ap/aging

### Prerequisites
- Ensure you have vendors created in the system
- Have at least 1-2 Purchase Orders (with RECEIVED status)
- Login credentials ready

---

## 🆕 New Features to Test (Phase 2 Enhancements)

### 1. File Attachments (Priority: HIGH)
**On Bills List:**
- Find any bill in the table
- Look for the **"Files"** column
- Click the **Upload icon** (cloud with arrow)
- Select a PDF invoice or image (e.g., receipt scan)
- ✅ **Expected:** Upload completes, shows "📎 1" count
- Hover over "View" link
- ✅ **Expected:** Popup shows attachment with filename
- Click attachment link
- ✅ **Expected:** Opens in new tab
- Click X to delete attachment
- ✅ **Expected:** Confirmation prompt, then file removed

**On Payments List:**
- Same process for payment receipts
- Upload check images, bank confirmations, etc.

**Supported Formats:**
- PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX
- Max size: 5MB per file

### 2. Pagination (Priority: HIGH)
**Test with Bills:**
- Create 60+ bills to trigger pagination (50 per page)
- ✅ **Expected:** Pagination controls appear at bottom
- Click **"Next"** button
- ✅ **Expected:** Shows page 2 (bills 51-60)
- Click page number **"1"**
- ✅ **Expected:** Returns to page 1
- Check page info: "Showing page 1 of 2 (60 total bills)"

**Test with Payments:**
- Same process with 60+ payments

**Features:**
- Desktop: Page numbers (1, 2, 3, 4, 5)
- Mobile: Simple Previous/Next buttons
- Disabled states at boundaries

### 3. Excel Export (Priority: MEDIUM)
**On Aging Report:**
- Navigate to http://localhost:5173/ap/aging
- Click green **"Export"** button (top right)
- ✅ **Expected:** Button shows "Exporting..."
- ✅ **Expected:** Excel file downloads: `AP-Aging-Report-2026-02-09.xlsx`
- Open in Excel/LibreOffice
- ✅ **Sheet 1 (Summary):** Aging buckets, amounts, counts
- ✅ **Sheet 2 (Details):** All bills with vendor, amounts, days overdue
- ✅ **Formatting:** Currency format, bold headers

---

## 📋 Core Functionality Testing (Use AP_QUICK_TEST_GUIDE.md)

### Essential Test Scenarios

#### 1️⃣ Create Bill without PO (5 min)
```
Path: AP Bills → New Bill
Steps:
1. Select vendor
2. Enter invoice number
3. Set dates (bill date = today, due date = +30 days)
4. Add line item (description, qty, price)
5. Add tax amount
6. Create
Expected: Bill appears with PENDING status
```

#### 2️⃣ Create Payment (5 min)
```
Path: AP Payments → New Payment
Steps:
1. Select vendor
2. Enter amount
3. Select payment method (CHECK)
4. Enter reference number
5. Allocate to bills
6. Create
Expected: Payment created, bill balances update
```

#### 3️⃣ View Aging Report (3 min)
```
Path: AP Aging Report
Steps:
1. View 6 aging buckets
2. Click on a bucket (e.g., "Current")
3. Bills table filters to that bucket
4. Change "As of Date"
Expected: Calculations update dynamically
```

#### 4️⃣ Approve Bill (2 min)
```
Path: AP Bills
Steps:
1. Find PENDING bill
2. Click green checkmark
Expected: Status → APPROVED
```

#### 5️⃣ Test Overdue Bills (3 min)
```
Path: AP Bills
Steps:
1. Create bill with past due date
2. Check "Show Overdue Only"
Expected: Only overdue bills visible (red badge)
```

---

## 📊 Sample Data Creation Script

### Quick Setup (Run in Browser Console on Bills page)

**Option A: Create 5 Test Bills Manually**
1. Go to http://localhost:5173/ap/bills
2. Click "New Bill" 5 times
3. Use these values:
   - Vendor: Acme Corp, TechSupplies Inc, Office Depot, etc.
   - Invoice: INV-001, INV-002, INV-003, etc.
   - Amount: $500, $1200, $800, $3500, $650
   - Due dates: Vary between past (overdue) and future

**Option B: Create 60 Bills for Pagination Test**
- Repeat above process 60 times, or
- Use different vendors, amounts, dates
- Mix statuses: PENDING, APPROVED, PARTIALLY_PAID

**Sample Bill Data:**
```
Bill 1:
- Vendor: Acme Corp
- Invoice: INV-2024-001
- Bill Date: 2026-01-15
- Due Date: 2026-02-15
- Line Item: Office Supplies, Qty: 10, Price: $50
- Tax: $25
- Total: $525

Bill 2 (Overdue):
- Vendor: TechSupplies Inc
- Invoice: INV-2024-002
- Bill Date: 2025-12-01
- Due Date: 2026-01-01 (PAST DATE - will be overdue)
- Line Item: Computers, Qty: 2, Price: $1500
- Tax: $150
- Total: $3150

Bill 3:
- Vendor: Office Depot
- Invoice: INV-2024-003
- Bill Date: 2026-02-01
- Due Date: 2026-03-01
- Line Item: Furniture, Qty: 5, Price: $200
- Tax: $50
- Total: $1050
```

**Create Payments:**
```
Payment 1:
- Vendor: Acme Corp
- Amount: $525
- Method: CHECK
- Reference: CHK-12345
- Allocate to Bill 1 (full amount)

Payment 2:
- Vendor: TechSupplies Inc
- Amount: $1500 (partial)
- Method: ACH
- Reference: ACH-67890
- Allocate to Bill 2
```

---

## 🧪 Feature Testing Checklist

### File Upload System
- [ ] Upload PDF invoice to bill
- [ ] Upload image (JPG/PNG) to bill
- [ ] Upload multiple files to same bill
- [ ] View attachments in popup
- [ ] Download attachment (opens in new tab)
- [ ] Delete attachment
- [ ] Upload file to payment
- [ ] Verify 5MB limit (try larger file)
- [ ] Verify file type validation (try .exe or .txt)
- [ ] Check "Uploading..." indicator appears

### Pagination System
- [ ] Create 60+ bills
- [ ] Verify pagination appears at bottom
- [ ] Click "Next" button
- [ ] Click "Previous" button
- [ ] Click specific page number (e.g., "3")
- [ ] Verify page info text (e.g., "Showing page 2 of 5")
- [ ] Test on mobile (resize browser to <640px)
- [ ] Verify disabled states (page 1 = no Previous)
- [ ] Test with filters (pagination should reset)
- [ ] Repeat for payments list

### Excel Export
- [ ] Navigate to Aging Report
- [ ] Click "Export" button
- [ ] Verify "Exporting..." appears
- [ ] Verify file downloads
- [ ] Open Excel file
- [ ] Check Summary sheet (6 rows + header)
- [ ] Check Details sheet (all bills listed)
- [ ] Verify currency formatting ($#,##0.00)
- [ ] Verify filename includes date
- [ ] Test export with different "As of Date"

### Core AP Functionality
- [ ] Create bill without PO
- [ ] Create bill from PO
- [ ] Three-way matching
- [ ] Approve bill
- [ ] Create single-bill payment
- [ ] Create multi-bill payment
- [ ] View aging report
- [ ] Filter by status
- [ ] Filter by vendor
- [ ] Show overdue toggle
- [ ] Edit bill
- [ ] Delete bill (without payments)
- [ ] Try delete bill with payments (should fail)
- [ ] Search by bill number
- [ ] Stats cards update correctly

---

## 🐛 Bug Testing

### Edge Cases to Test

1. **Upload Very Large File (>5MB)**
   - Expected: Error message "File too large"

2. **Upload Invalid File Type (.exe)**
   - Expected: Error message "File type not allowed"

3. **Navigate to Page 999 (doesn't exist)**
   - Expected: Shows empty page or last valid page

4. **Export with No Bills**
   - Expected: Excel with empty details sheet

5. **Allocate Payment > Bill Balance**
   - Expected: Validation error

6. **Delete Attachment During Upload**
   - Expected: Upload cancels gracefully

7. **Click Pagination While Loading**
   - Expected: No double requests

8. **Approve Already Approved Bill**
   - Expected: No change or error message

---

## 📸 Screenshots to Capture

For documentation/demo purposes:

1. **Bills List** with attachments showing
2. **Pagination controls** (desktop view)
3. **Aging Report** with export button
4. **Attachment popup** on hover
5. **Excel file** opened in Excel
6. **File upload in progress** (Uploading...)
7. **Payment with multiple allocations**
8. **Overdue bills** with red badges

---

## 📈 Performance Metrics to Note

### Expected Performance
- ✅ Page load: <2 seconds
- ✅ Pagination switch: <500ms
- ✅ File upload (1MB): <3 seconds
- ✅ Excel export (100 bills): <5 seconds
- ✅ Search/filter: <200ms

### If Slower:
- Check browser console for errors
- Check network tab for failed requests
- Verify backend logs for slow queries
- Consider adding database indexes (see enhancement docs)

---

## 🎯 User Feedback Questions

After testing, gather feedback on:

### Usability
1. Is the file upload button obvious enough?
2. Are the attachment popups easy to use?
3. Is pagination intuitive?
4. Is the Export button placement good?
5. Are the stats cards helpful?

### Missing Features
1. Do you need bulk file upload (multiple files at once)?
2. Should attachments preview inline (PDF viewer)?
3. Do you want email notifications enabled by default?
4. Should pagination default to 25 or 50 items?
5. Do you need CSV export in addition to Excel?

### Workflow Improvements
1. Should bill approval require confirmation dialog?
2. Should payments auto-allocate to oldest bills?
3. Do you need bill templates (recurring bills)?
4. Should overdue bills send automatic reminders?
5. Do you need mobile app support?

---

## 📝 Feedback Collection

### Record Issues
Create a document or spreadsheet with columns:
- Feature
- Issue Description
- Severity (Critical, High, Medium, Low)
- Steps to Reproduce
- Expected vs Actual Result
- Screenshot (if applicable)

### Example Issue:
```
Feature: File Upload
Issue: Upload button hard to see
Severity: Medium
Steps: Go to Bills list, look for upload button
Expected: Clear upload icon/button
Actual: Small icon, blends with table
Screenshot: [attach]
Suggestion: Larger icon or "Upload" text label
```

---

## 🚀 Next Steps After Testing

### Phase 2 Priorities (Based on Testing)
1. Fix any critical bugs found
2. Implement high-priority user requests
3. Optimize performance issues
4. Add mobile responsiveness improvements
5. Set up email notifications (if requested)

### Phase 3 Planning
1. Cloud storage (S3) for attachments
2. OCR for invoice data extraction
3. Automated email reports
4. Mobile app development
5. Advanced analytics dashboard

---

## 📞 Support During Testing

### If You Encounter Issues:

**Backend Errors:**
- Check `backend/` terminal for error logs
- Common fix: Restart backend server

**Frontend Errors:**
- Check browser console (F12)
- Common fix: Clear cache, hard refresh (Ctrl+Shift+R)

**Database Issues:**
- Check Prisma schema changes applied
- Re-run migration: `cd backend; npx prisma migrate dev`

**File Upload Not Working:**
- Verify `backend/uploads/ap-attachments/` directory exists
- Check file permissions on upload directory
- Verify CORS settings in `backend/src/app.js`

**Excel Export Not Downloading:**
- Check browser's download settings
- Try different browser
- Check response type in Network tab

---

## ✅ Testing Complete When:

- [ ] All 10 core scenarios tested (from AP_QUICK_TEST_GUIDE.md)
- [ ] All 3 new features tested (uploads, pagination, export)
- [ ] At least 20 bills created (mix of statuses)
- [ ] At least 5 payments created
- [ ] Aging report shows data in all buckets
- [ ] File uploads working on bills and payments
- [ ] Pagination tested with 50+ records
- [ ] Excel export downloads and opens correctly
- [ ] All edge cases tested
- [ ] Screenshots captured
- [ ] Feedback form filled
- [ ] Issues documented

---

**Estimated Testing Time:** 45-60 minutes for comprehensive testing

**Ready to begin? Start with:** http://localhost:5173/ap/bills

Good luck! 🎉
