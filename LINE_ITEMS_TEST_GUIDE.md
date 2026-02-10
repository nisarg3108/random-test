# Line Items + Tax/Discount Calculations - Test Guide

## ✨ What's New

You can now manage **detailed line items** with per-item tax and discount calculations for:
- ✅ **Quotations**
- ✅ **Sales Orders**  
- ✅ **Invoices**

The system automatically calculates:
- **Subtotal** (sum of qty × price for all items)
- **Total Tax** (sum of per-item tax percentages)
- **Total Discount** (sum of per-item discount percentages)
- **Grand Total** (subtotal + tax - discount)

---

## 📋 Line Item Editor Features

### Each Line Item Includes:
| Field | Description | Example |
|-------|-------------|---------|
| **Item Description** | Product/service name | "Website Development" |
| **Quantity** | Number of units | 1 |
| **Price** | Unit price | 50000 |
| **Tax %** | Tax percentage per item | 18 (for 18% GST) |
| **Discount %** | Discount percentage per item | 5 (for 5% off) |
| **Line Total** | Auto-calculated | ₹56,500.00 |

### Line Total Calculation:
```
Base Amount = Quantity × Price
Tax Amount = Base Amount × (Tax % / 100)
Discount Amount = Base Amount × (Discount % / 100)
Line Total = Base Amount + Tax Amount - Discount Amount
```

**Example:**
- Quantity: 1
- Price: ₹50,000
- Tax: 18%
- Discount: 5%

**Calculation:**
- Base: 1 × 50,000 = ₹50,000
- Tax: 50,000 × 0.18 = ₹9,000
- Discount: 50,000 × 0.05 = ₹2,500
- **Line Total: 50,000 + 9,000 - 2,500 = ₹56,500**

---

## 🧪 Testing the Line Items Feature

### Test 1: Create Quotation with Multiple Items

1. Navigate to **Sales → Quotations**
2. Click **"New Quotation"**
3. Fill in basic info:
   - Title: "Software Development Project"
   - Customer Name: "Tech Corp"
   - Customer Email: "billing@techcorp.com"
   - Status: DRAFT

4. **Add First Line Item:**
   - Click **"Add Item"** (default one is already there)
   - Description: "Frontend Development"
   - Quantity: 40 (hours)
   - Price: 1500 (per hour)
   - Tax %: 18
   - Discount %: 0
   - ✅ Verify Line Total: ₹70,800.00

5. **Add Second Line Item:**
   - Click **"Add Item"**
   - Description: "Backend API Development"
   - Quantity: 60 (hours)
   - Price: 2000 (per hour)
   - Tax %: 18
   - Discount %: 10 (volume discount)
   - ✅ Verify Line Total: ₹129,600.00

6. **Add Third Line Item:**
   - Click **"Add Item"**
   - Description: "Hosting (Annual)"
   - Quantity: 1
   - Price: 12000
   - Tax %: 18
   - Discount %: 0
   - ✅ Verify Line Total: ₹14,160.00

7. **Verify Totals Panel:**
   ```
   Subtotal:    ₹192,000.00  (40×1500 + 60×2000 + 1×12000)
   Tax:         +₹31,560.00  (sum of all tax amounts)
   Discount:    -₹12,000.00  (sum of all discount amounts)
   Grand Total:  ₹211,560.00
   ```

8. Click **"Create Quotation"**
9. ✅ Verify quotation shows Total: ₹211,560.00 in the list

---

### Test 2: Edit Existing Line Items

1. Click **Edit** (pencil icon) on the quotation you just created
2. ✅ Verify all 3 line items are loaded correctly
3. **Modify Second Item:**
   - Change Discount % from 10 to 15
   - ✅ Verify Line Total updates to: ₹123,480.00
4. **Remove Third Item:**
   - Click the red trash icon on "Hosting" line
   - ✅ Verify item is removed and totals recalculate
5. ✅ Verify New Grand Total: ₹194,280.00
6. Click **"Update Quotation"**

---

### Test 3: Convert with Line Items (Quotation → Order → Invoice)

1. **Accept the Quotation:**
   - Edit the quotation
   - Change Status to ACCEPTED
   - Update

2. **Convert to Order:**
   - Click the green arrow (→) button
   - Confirm conversion
   - Navigate to **Sales → Orders**
   - Edit the new order
   - ✅ Verify all line items are preserved
   - ✅ Verify totals match: ₹194,280.00

3. **Convert to Invoice:**
   - Change order Status to CONFIRMED
   - Update order
   - Click the green invoice (📄) button
   - Navigate to **Sales → Invoicing**
   - Edit the new invoice
   - ✅ Verify all line items are preserved
   - ✅ Verify totals match: ₹194,280.00

---

### Test 4: Complex Tax Scenarios

Create an invoice with mixed tax rates:

| Item | Qty | Price | Tax % | Discount % | Line Total |
|------|-----|-------|-------|------------|------------|
| Books (Tax-Free) | 10 | 500 | 0 | 0 | ₹5,000.00 |
| Electronics | 2 | 20000 | 18 | 5 | ₹44,080.00 |
| Luxury Item | 1 | 50000 | 28 | 0 | ₹64,000.00 |

**Expected Totals:**
- Subtotal: ₹125,000.00
- Tax: +₹19,080.00
- Discount: -₹1,000.00
- **Grand Total: ₹143,080.00**

---

## 🎯 UI Features in Line Item Editor

### Table Interface:
- ✅ **Responsive columns** for all fields
- ✅ **Real-time calculations** as you type
- ✅ **Add Item button** to add more rows
- ✅ **Remove button** (trash icon) per row
- ✅ **Minimum 1 item** enforced (can't delete if only one)
- ✅ **Totals panel** shows breakdown

### Automatic Behaviors:
- ✅ Calculations update **instantly** on any field change
- ✅ Parent form's totals update automatically
- ✅ Line items persisted to backend as JSON array
- ✅ Backend service validates and recalculates totals

### Modal Improvements:
- ✅ Modal width increased to **max-w-4xl** for comfortable editing
- ✅ Scrollable content for many line items
- ✅ Clear visual hierarchy

---

## 🔍 Backend Data Structure

Line items are stored as JSON in the database:

```json
{
  "items": [
    {
      "id": 1708347723000,
      "description": "Frontend Development",
      "quantity": 40,
      "price": 1500,
      "tax": 18,
      "discount": 0
    },
    {
      "id": 1708347745000,
      "description": "Backend API Development",
      "quantity": 60,
      "price": 2000,
      "tax": 18,
      "discount": 15
    }
  ],
  "subtotal": 180000,
  "tax": 31320,
  "discount": 18000,
  "total": 193320
}
```

---

## 📊 Benefits Over Simple Total Field

### Before (Old System):
- ❌ Manual total entry
- ❌ No itemization
- ❌ No tax/discount breakdown
- ❌ No audit trail of what was sold

### After (New System):
- ✅ Auto-calculated totals
- ✅ Detailed line items
- ✅ Per-item tax/discount
- ✅ Complete itemization for accounting
- ✅ Professional quotations/invoices

---

## 🐛 Troubleshooting

### Line items not showing?
- Check browser console for errors
- Ensure `items` field is an array in formData
- Refresh the page

### Totals not calculating?
- Verify `onTotalsChange` callback is connected
- Check that all numeric fields have valid numbers (not strings)
- Open browser DevTools → Console for calculation logs

### Items not saving?
- Ensure at least one item has a description
- Check backend logs for validation errors
- Verify items array is included in the POST/PUT request

### Modal too narrow?
- Modal should be `max-w-4xl` (fixed in all three components)
- If still narrow, check for CSS conflicts

---

## ✅ Checklist: Line Items Working Correctly

- [ ] Can add multiple line items
- [ ] Can remove line items (except last one)
- [ ] Line totals calculate correctly per row
- [ ] Subtotal = sum of (qty × price) for all items
- [ ] Tax calculates correctly per item
- [ ] Discount calculates correctly per item
- [ ] Grand total = subtotal + tax - discount
- [ ] Changes reflect immediately (real-time)
- [ ] Line items save when creating new record
- [ ] Line items load when editing existing record
- [ ] Line items carry over in conversions
- [ ] Modal is wide enough to show all fields

---

## 🚀 Next Enhancement Ideas

1. **Product Catalog Integration**: Add dropdown to select from inventory items
2. **Unit of Measure**: Add UOM field (pcs, kg, hours, etc.)
3. **Export to PDF**: Generate professional PDF quotations/invoices
4. **Templates**: Save frequently used item lists as templates
5. **Currency Support**: Multi-currency line items
6. **Bulk Import**: Import line items from CSV/Excel

---

## 🎉 Summary

You now have a **professional line item editor** that:
- ✅ Works across Quotations, Orders, and Invoices
- ✅ Calculates subtotals, taxes, discounts automatically
- ✅ Preserves itemization through conversion workflows
- ✅ Provides clear visual breakdown of totals
- ✅ Stores detailed data for accounting and reporting

**Test it out and enjoy the professional sales management experience!** 🎊
