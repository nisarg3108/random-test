# AP Module - Testing Quick Reference
*Keep this open while testing*

## 🔗 Quick Links
- **Bills:** http://localhost:5173/ap/bills
- **Payments:** http://localhost:5173/ap/payments  
- **Aging:** http://localhost:5173/ap/aging
- **Backend:** http://localhost:5000

## ✅ Server Status
- Backend: Port 5000 ✓
- Frontend: Port 5173 ✓

## 🆕 New Features This Session

### 1. File Attachments
- **Upload:** Click upload icon in "Files" column
- **View:** Hover over "View" link
- **Delete:** Click X in popup
- **Limits:** 5MB, PDF/images/Office docs

### 2. Pagination
- **Trigger:** Create 50+ records
- **Controls:** Bottom of table
- **Info:** "Showing page X of Y"

### 3. Excel Export
- **Location:** Aging Report page
- **Button:** Green "Export" (top right)
- **Output:** `AP-Aging-Report-{date}.xlsx`

## 🧪 5-Minute Test Sequence

### Test 1: Create Bill (2 min)
```
Bills → New Bill
- Vendor: Any
- Invoice: INV-TEST-001
- Date: Today
- Due: +30 days
- Item: Test Item, Qty: 1, Price: 100
- Tax: 5
→ Create
✓ Appears in list
```

### Test 2: Upload File (1 min)
```
Find bill → Click upload icon → Select PDF
✓ Shows "Uploading..."
✓ Count shows "📎 1"
✓ Hover "View" → See filename
```

### Test 3: Make Payment (2 min)
```
Payments → New Payment
- Vendor: Same as bill
- Amount: 105
- Method: CHECK
- Reference: TEST-CHK
- Allocate: Full to bill
→ Create
✓ Bill balance = $0
✓ Bill status = PAID
```

## 📊 Sample Data Values

**Bill Data:**
- Vendor: Acme Corp
- Invoice: INV-2024-001
- Bill Date: 2026-02-09
- Due Date: 2026-03-09
- Item: Office Supplies, 10 @ $50
- Tax: $25
- **Total: $525**

**Overdue Bill:**
- Due Date: **2026-01-01** (past)
- Status will show: **OVERDUE** (red)

**Payment Data:**
- Amount: $525
- Method: CHECK
- Reference: CHK-12345

## 🐛 Quick Troubleshooting

**Upload fails:**
- Check file size (<5MB)
- Check file type (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX)

**Pagination not showing:**
- Need 50+ records
- Or change limit in code temporarily

**Export fails:**
- Check browser downloads folder
- Try different browser
- Check Network tab (F12)

**Bill not saving:**
- Check all required fields (*)
- Check browser console (F12)
- Check backend terminal for errors

## ✨ Expected Results

**Bills Page:**
- ✅ 4 stat cards
- ✅ Search + filters
- ✅ Files column
- ✅ Pagination (if >50 bills)
- ✅ Color-coded status badges

**Payments Page:**
- ✅ 4 stat cards  
- ✅ Files column
- ✅ Allocation grid
- ✅ Pagination (if >50)

**Aging Report:**
- ✅ 6 aging buckets
- ✅ Export button (green)
- ✅ Clickable buckets
- ✅ Bills detail table

## 📸 Screenshots Needed
1. Bills list with attachments
2. Pagination controls
3. Aging report
4. Attachment popup
5. Excel file opened
6. Payment allocation

## ⏱️ Time Estimates
- Basic test: 10 min
- Full test: 45-60 min
- With 60 bills created: +20 min

## 🎯 Success Criteria
- [ ] Created 5+ bills
- [ ] Created 2+ payments
- [ ] Uploaded file to bill
- [ ] Viewed attachment
- [ ] Exported Excel
- [ ] Tested pagination (50+ records)
- [ ] Approved bill
- [ ] Viewed aging report

## 📝 Take Notes On
- Any errors encountered
- Confusing UI elements
- Missing features
- Performance issues
- Improvement suggestions

---

**Happy Testing! 🚀**

*For detailed scenarios, see: AP_QUICK_TEST_GUIDE.md*  
*For full session guide, see: AP_TESTING_SESSION_GUIDE.md*
