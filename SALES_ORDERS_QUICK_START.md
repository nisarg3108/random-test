# Sales & Orders Management - Quick Start Guide

## Prerequisites
- Backend server running on port 5000
- Frontend running on port 5176 (or default Vite port)
- User logged in with ADMIN or MANAGER role
- Database migration completed

## Feature 1: Conversion Workflows

### Test Quotation → Order Conversion

1. **Navigate to Sales → Quotations**
2. **Create a new quotation:**
   - Click "New Quotation"
   - Fill in customer information
   - Add line items:
     - Description: "Web Development Services"
     - Quantity: 10
     - Unit Price: 5000
     - Tax: 18%
     - Discount: 10%
   - Set status to **ACCEPTED**
   - Click "Create Quotation"

3. **Convert to Order:**
   - Find the quotation in the list
   - Look for the "Convert to Order" button (should appear for ACCEPTED status)
   - Click "Convert to Order"
   - Success message should appear

4. **Verify:**
   - Navigate to Sales → Sales Orders
   - Find the newly created order
   - Verify it contains:
     - Same customer information
     - Same line items
     - Same totals
     - Status: PENDING

### Test Order → Invoice Conversion

1. **Update Order Status:**
   - In Sales Orders list, edit the order
   - Change status to **CONFIRMED** (or SHIPPED/DELIVERED)
   - Save changes

2. **Convert to Invoice:**
   - Find the order in the list
   - Look for the "Convert to Invoice" button
   - Click "Convert to Invoice"
   - Success message should appear

3. **Verify:**
   - Navigate to Sales → Invoicing
   - Find the newly created invoice
   - Verify it contains:
     - Same customer information
     - Same line items
     - Same totals
     - Status: DRAFT
     - Amount Paid: 0

## Feature 2: Line Items Management

### Test Line Items Editor

1. **Create a Quotation with Multiple Items:**
   - Click "New Quotation"
   - In the Line Items section, click "Add Item"
   - Add first item:
     - Description: "Project Management"
     - Quantity: 1
     - Unit Price: 15000
     - Tax: 18%
     - Discount: 0%
   
2. **Add More Items:**
   - Click "Add Item" again
   - Add second item:
     - Description: "Website Hosting"
     - Quantity: 12
     - Unit Price: 500
     - Tax: 18%
     - Discount: 20%
   
3. **Verify Calculations:**
   - Check the totals section updates automatically
   - Verify:
     - Subtotal = sum of (qty × price)
     - Total Tax = sum of (qty × price × tax%)
     - Total Discount = sum of (qty × price × discount%)
     - Grand Total = subtotal + tax - discount

4. **Remove an Item:**
   - Click "Remove" on one of the items
   - Verify totals recalculate immediately

5. **Save and Verify:**
   - Click "Create Quotation"
   - Reopen the quotation
   - Verify all line items are preserved

## Feature 3: Invoice Payment Tracking

### Test Payment Recording

1. **Open an Invoice:**
   - Navigate to Sales → Invoicing
   - Find an invoice with DRAFT or SENT status
   - Note the total amount (e.g., ₹50,000)

2. **Open Payment History:**
   - Click the credit card icon (💳) in the Actions column
   - Payment History modal opens
   - Verify summary shows:
     - Invoice Total: ₹50,000
     - Total Paid: ₹0.00
     - Remaining: ₹50,000

3. **Record First Payment (Partial):**
   - Click "Record Payment"
   - Fill in form:
     - Amount: 20000
     - Payment Date: (select today's date)
     - Payment Method: BANK_TRANSFER
     - Reference Number: TXN123456789
     - Notes: "Advance payment received"
   - Click "Record Payment"

4. **Verify Partial Payment:**
   - Payment appears in history table
   - Summary updates:
     - Total Paid: ₹20,000.00
     - Remaining: ₹30,000.00
   - Close modal
   - **Verify invoice status changed to PARTIALLY_PAID**

5. **Record Second Payment (Full):**
   - Click credit card icon again
   - Click "Record Payment"
   - Fill in form:
     - Amount: 30000
     - Payment Date: (select today's date)
     - Payment Method: CASH
     - Reference Number: (leave empty)
     - Notes: "Final payment"
   - Click "Record Payment"

6. **Verify Full Payment:**
   - Payment appears in history table
   - Summary updates:
     - Total Paid: ₹50,000.00
     - Remaining: ₹0.00
   - "Record Payment" button is now **disabled**
   - Close modal
   - **Verify invoice status changed to PAID**

### Test Payment Editing

1. **Open Payment History** for the invoice
2. **Edit a Payment:**
   - Click "Edit" next to the first payment
   - Change amount to 25000
   - Click "Update Payment"

3. **Verify:**
   - Payment amount updated in table
   - Summary recalculates:
     - Total Paid: ₹55,000.00
     - Remaining: ₹-5,000.00 (overpayment)
   - Status remains **PAID** (because paid >= total)

### Test Payment Deletion

1. **Delete a Payment:**
   - Click "Delete" next to a payment
   - Confirm deletion

2. **Verify:**
   - Payment removed from table
   - Summary recalculates
   - Invoice status updates appropriately:
     - If remaining > 0: PARTIALLY_PAID
     - If remaining = 0: PAID

## Complete Workflow Test

### End-to-End Scenario

1. **Create Quotation:**
   - Customer: "ABC Corporation"
   - Line items:
     - "Software Development" - 100 hours @ ₹1,000/hr - 18% tax - 0% discount
     - "Testing Services" - 50 hours @ ₹800/hr - 18% tax - 10% discount
   - Total should calculate automatically
   - Set status to ACCEPTED
   - Save

2. **Convert to Order:**
   - Click "Convert to Order"
   - Verify order created with same details
   - Edit order, set status to CONFIRMED

3. **Convert to Invoice:**
   - Click "Convert to Invoice"
   - Verify invoice created with same details
   - Note the invoice total

4. **Record Payments:**
   - Record 30% payment via BANK_TRANSFER
   - Verify status: PARTIALLY_PAID
   - Record 40% payment via CREDIT_CARD
   - Verify status: Still PARTIALLY_PAID
   - Record remaining 30% via CASH
   - Verify status: PAID

5. **Verify Final State:**
   - Invoice shows PAID status
   - Invoice list shows green badge
   - Payment history shows all 3 payments
   - Dashboard stats update (if applicable)

## Troubleshooting

### Conversion Button Not Appearing
**Problem:** "Convert to Order" button not visible
**Solution:** 
- Verify quotation status is ACCEPTED
- Check you have ADMIN or MANAGER role
- Refresh the page

### Line Items Not Calculating
**Problem:** Totals not updating
**Solution:**
- Check browser console for errors
- Verify all numeric fields have valid values
- Ensure quantity > 0
- Try removing and re-adding items

### Payment Recording Fails
**Problem:** "Failed to save payment" error
**Solution:**
- Check user has ADMIN or MANAGER role
- Verify amount is > 0
- Ensure payment date is filled
- Check backend server is running
- Check browser console for API errors

### Invoice Status Not Updating
**Problem:** Status remains DRAFT after payments
**Solution:**
- Verify backend migration was run successfully
- Check backend logs for errors
- Verify `updateInvoicePaymentStatus` function is being called
- Manually refresh the invoice list

### Payment Modal Won't Open
**Problem:** Clicking credit card icon does nothing
**Solution:**
- Check browser console for React errors
- Verify PaymentHistory component is imported
- Check if invoice has valid id
- Try hard refresh (Ctrl+Shift+R)

## Feature Locations

### Navigation
- **Quotations:** Main Menu → Sales & Orders → Quotations
- **Sales Orders:** Main Menu → Sales & Orders → Sales Orders
- **Invoices:** Main Menu → Sales & Orders → Invoicing

### UI Elements
- **Line Items:** Visible in all Create/Edit forms
- **Convert Buttons:** In Actions column of list tables
- **Payment History:** Credit card icon (💳) in invoice Actions column

## Data Validation

### Line Items
- ✅ Description: Required, max 255 characters
- ✅ Quantity: Must be > 0
- ✅ Unit Price: Must be >= 0
- ✅ Tax %: Must be >= 0, typically 0-100
- ✅ Discount %: Must be >= 0, typically 0-100

### Payments
- ✅ Amount: Must be > 0
- ✅ Payment Date: Required
- ✅ Payment Method: Required, from dropdown
- ✅ Reference Number: Optional
- ✅ Notes: Optional

## Expected Behavior

### Status Transitions

**Quotations:**
- DRAFT → SENT → ACCEPTED/REJECTED
- ACCEPTED can convert to Order

**Orders:**
- PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- CONFIRMED/SHIPPED/DELIVERED can convert to Invoice

**Invoices:**
- DRAFT → SENT
- SENT + payments → PARTIALLY_PAID → PAID
- Overdue logic (if implemented)

### Automatic Calculations

**Line Items:**
- Real-time calculation on any value change
- Precision to 2 decimal places
- Currency symbol: ₹ (Indian Rupee)

**Payments:**
- Real-time summary update
- Status auto-update on any payment CRUD
- Remaining balance calculation

## Support

If you encounter issues not covered in this guide:
1. Check browser console for errors
2. Check backend server logs
3. Verify database migration status: `npx prisma migrate status`
4. Refer to detailed documentation:
   - [SALES_ORDERS_COMPLETE.md](./SALES_ORDERS_COMPLETE.md)
   - [INVOICE_PAYMENT_SYSTEM.md](./INVOICE_PAYMENT_SYSTEM.md)

## Success Criteria

✅ Can create quotation with line items
✅ Can convert ACCEPTED quotation to order
✅ Order contains all quotation data
✅ Can convert CONFIRMED order to invoice
✅ Invoice contains all order data
✅ Can record payments on invoice
✅ Invoice status auto-updates to PARTIALLY_PAID
✅ Invoice status auto-updates to PAID when fully paid
✅ Can edit and delete payments
✅ Status recalculates on payment changes
✅ All line item calculations are accurate
✅ All features work with tenant isolation

## Performance Benchmarks

- Page load: < 2 seconds
- Line item calculation: Instant (< 100ms)
- Conversion operation: < 1 second
- Payment recording: < 1 second
- Payment history load: < 1 second

Enjoy your enhanced Sales & Orders Management system! 🎉
