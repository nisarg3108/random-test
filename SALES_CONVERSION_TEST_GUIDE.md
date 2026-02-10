# Sales Conversion Workflow - Test Guide

## Testing the Complete Flow: Quotation → Order → Invoice

### Prerequisites
- ✅ Backend running on port 5000
- ✅ Frontend running on http://localhost:5175/
- ✅ Logged in as ADMIN or MANAGER user

---

## 📝 Step 1: Create a Quotation

1. Navigate to **Sales → Quotations** from the sidebar
2. Click **"New Quotation"** button
3. Fill in the form:
   - **Title**: "Website Development Project"
   - **Customer Name**: "Acme Corporation"
   - **Customer Email**: "contact@acme.com"
   - **Total**: 50000
   - **Status**: DRAFT
   - **Valid Until**: (Set a future date, e.g., 2026-03-01)
4. Click **"Create Quotation"**
5. ✅ Verify the quotation appears in the list

---

## ✅ Step 2: Accept the Quotation

1. Find the quotation you just created
2. Click the **Edit** (pencil) button
3. Change **Status** from DRAFT to **ACCEPTED**
4. Click **"Update Quotation"**
5. ✅ Verify status badge shows "Accepted" in green
6. ✅ Verify a green arrow (→) button now appears in the Actions column

---

## 🔄 Step 3: Convert to Sales Order

1. Click the **green arrow (→)** button on the ACCEPTED quotation
2. Confirm the conversion in the popup dialog
3. ✅ Verify success alert: "Successfully converted quotation to sales order!"
4. Navigate to **Sales → Sales Orders** from the sidebar
5. ✅ Verify a new order exists with:
   - Same customer name ("Acme Corporation")
   - Same total (₹50,000.00)
   - Status: "Pending" (amber badge)
   - Notes field contains: "Converted from quotation: Website Development Project"

---

## ✅ Step 4: Confirm the Order

1. In the Sales Orders list, find the converted order
2. Click the **Edit** (pencil) button
3. Change **Status** from PENDING to **CONFIRMED**
4. Click **"Update Order"**
5. ✅ Verify status badge shows "Confirmed" in blue
6. ✅ Verify a green invoice (📄) button now appears in the Actions column

---

## 💰 Step 5: Create Invoice from Order

1. Click the **green invoice (📄)** button on the CONFIRMED order
2. Confirm the conversion in the popup dialog
3. ✅ Verify success alert: "Successfully created invoice from sales order!"
4. Navigate to **Sales → Invoicing** from the sidebar
5. ✅ Verify a new invoice exists with:
   - Same customer name ("Acme Corporation")
   - Same total (₹50,000.00)
   - **Paid**: ₹0.00
   - **Status**: "Draft" (gray badge)
   - **Due date**: ~30 days from today (around March 10, 2026)

---

## 📊 Step 6: Verify Analytics

1. Navigate to **Sales → Sales Analytics** from the sidebar
2. ✅ Verify the new data reflects in:
   - Total Orders count
   - Total Invoices count
   - Quotation Status Distribution chart (1 ACCEPTED)
   - Order Status Distribution chart (1 CONFIRMED)
   - Invoice Status Distribution chart (1 DRAFT)
   - Conversion Metrics showing ~100% quotation to order rate

---

## 🔗 Step 7: Verify Data Linkage (Backend Validation)

To verify the complete audit trail, you can check the database relationships:

1. **Quotation** has `id` = X
2. **Sales Order** has `quotationId` = X (linked!)
3. **Invoice** has `orderId` = Y (linked!)

This creates a complete traceable flow: Quotation → Order → Invoice

---

## Expected Behavior Summary

| Step | Record Type | Status | Linked To |
|------|-------------|--------|-----------|
| 1 | Quotation | DRAFT → ACCEPTED | - |
| 2 | Sales Order | PENDING → CONFIRMED | quotationId |
| 3 | Invoice | DRAFT | orderId |

---

## Conversion Button Visibility Rules

✅ **"Convert to Order" button** (green arrow):
- Shows ONLY on quotations with status = ACCEPTED
- Hidden on DRAFT, SENT, REJECTED, EXPIRED

✅ **"Create Invoice" button** (green document):
- Shows ONLY on orders with status = CONFIRMED, SHIPPED, or DELIVERED
- Hidden on PENDING, CANCELLED

---

## Troubleshooting

### Button not appearing?
- Check the status is correct (ACCEPTED for quotations, CONFIRMED/SHIPPED/DELIVERED for orders)
- Refresh the page to ensure latest data

### Conversion fails?
- Check browser console (F12) for error messages
- Check backend terminal for validation errors
- Verify you're logged in as ADMIN or MANAGER (USER role cannot convert)

### Success message but no new record?
- Check the correct list page (Orders after quotation conversion, Invoices after order conversion)
- Click refresh or navigate away and back to reload the data

---

## Test Complete! 🎉

You've successfully tested the complete sales conversion workflow. The system now supports:
- ✅ Quotation → Sales Order conversion
- ✅ Sales Order → Invoice conversion
- ✅ Complete audit trail via linking IDs
- ✅ Status-based button visibility
- ✅ Role-based access control (ADMIN, MANAGER only)
