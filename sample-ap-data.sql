-- AP Module Sample Data Script
-- Run this in your database after getting tenant and vendor IDs

-- PREREQUISITES:
-- 1. Get your tenantId: SELECT id, name FROM "Tenant";
-- 2. Get vendor IDs: SELECT id, name FROM "Vendor" WHERE "tenantId" = 'YOUR_TENANT_ID';
-- 3. Replace placeholders below with actual IDs

-- ==========================================
-- CONFIGURATION - UPDATE THESE VALUES
-- ==========================================
-- Replace these with your actual IDs from the database
DO $$
DECLARE
    tenant_id TEXT := 'YOUR_TENANT_ID_HERE';           -- Get from Tenant table
    vendor1_id TEXT := 'VENDOR_1_ID_HERE';             -- Acme Corp
    vendor2_id TEXT := 'VENDOR_2_ID_HERE';             -- TechSupplies Inc
    vendor3_id TEXT := 'VENDOR_3_ID_HERE';             -- Office Depot
    user_id TEXT := 'YOUR_USER_ID_HERE';               -- Get from User table
BEGIN

-- ==========================================
-- SAMPLE BILLS
-- ==========================================

-- Bill 1: Current bill (not due yet)
INSERT INTO "APBill" (
    id, "tenantId", "vendorId", "billNumber", "invoiceNumber",
    "billDate", "dueDate", "subtotal", "taxAmount", "discountAmount",
    "shippingCost", "totalAmount", "paidAmount", "balanceAmount",
    status, "approvalStatus", items, "createdById"
) VALUES (
    gen_random_uuid(),
    tenant_id,
    vendor1_id,
    'BILL-000001',
    'INV-2024-001',
    '2026-02-01',
    '2026-03-01',
    500.00,
    25.00,
    0.00,
    0.00,
    525.00,
    0.00,
    525.00,
    'PENDING',
    'PENDING',
    '[{"description":"Office Supplies","quantity":10,"unitPrice":50,"amount":500}]'::jsonb,
    user_id
);

-- Bill 2: Overdue bill
INSERT INTO "APBill" (
    id, "tenantId", "vendorId", "billNumber", "invoiceNumber",
    "billDate", "dueDate", "subtotal", "taxAmount", "discountAmount",
    "shippingCost", "totalAmount", "paidAmount", "balanceAmount",
    status, "approvalStatus", items, "createdById"
) VALUES (
    gen_random_uuid(),
    tenant_id,
    vendor2_id,
    'BILL-000002',
    'INV-2024-002',
    '2025-12-01',
    '2026-01-01',  -- PAST DATE - will be overdue
    3000.00,
    150.00,
    0.00,
    0.00,
    3150.00,
    0.00,
    3150.00,
    'OVERDUE',
    'PENDING',
    '[{"description":"Computers","quantity":2,"unitPrice":1500,"amount":3000}]'::jsonb,
    user_id
);

-- Bill 3: Approved bill
INSERT INTO "APBill" (
    id, "tenantId", "vendorId", "billNumber", "invoiceNumber",
    "billDate", "dueDate", "subtotal", "taxAmount", "discountAmount",
    "shippingCost", "totalAmount", "paidAmount", "balanceAmount",
    status, "approvalStatus", items, "createdById", "approvedById", "approvedAt"
) VALUES (
    gen_random_uuid(),
    tenant_id,
    vendor3_id,
    'BILL-000003',
    'INV-2024-003',
    '2026-02-01',
    '2026-03-01',
    1000.00,
    50.00,
    0.00,
    0.00,
    1050.00,
    0.00,
    1050.00,
    'APPROVED',
    'APPROVED',
    '[{"description":"Furniture","quantity":5,"unitPrice":200,"amount":1000}]'::jsonb,
    user_id,
    user_id,
    NOW()
);

-- Bill 4: Partially paid bill
INSERT INTO "APBill" (
    id, "tenantId", "vendorId", "billNumber", "invoiceNumber",
    "billDate", "dueDate", "subtotal", "taxAmount", "discountAmount",
    "shippingCost", "totalAmount", "paidAmount", "balanceAmount",
    status, "approvalStatus", items, "createdById"
) VALUES (
    gen_random_uuid(),
    tenant_id,
    vendor1_id,
    'BILL-000004',
    'INV-2024-004',
    '2026-01-15',
    '2026-02-15',
    2000.00,
    100.00,
    0.00,
    50.00,
    2150.00,
    1000.00,  -- Partially paid
    1150.00,
    'PARTIALLY_PAID',
    'APPROVED',
    '[{"description":"Marketing Services","quantity":1,"unitPrice":2000,"amount":2000}]'::jsonb,
    user_id
);

-- Bill 5: 31-60 days overdue
INSERT INTO "APBill" (
    id, "tenantId", "vendorId", "billNumber", "invoiceNumber",
    "billDate", "dueDate", "subtotal", "taxAmount", "discountAmount",
    "shippingCost", "totalAmount", "paidAmount", "balanceAmount",
    status, "approvalStatus", items, "createdById"
) VALUES (
    gen_random_uuid(),
    tenant_id,
    vendor2_id,
    'BILL-000005',
    'INV-2024-005',
    '2025-11-15',
    '2025-12-15',  -- 55 days overdue
    750.00,
    37.50,
    0.00,
    0.00,
    787.50,
    0.00,
    787.50,
    'OVERDUE',
    'APPROVED',
    '[{"description":"Software License","quantity":1,"unitPrice":750,"amount":750}]'::jsonb,
    user_id
);

-- ==========================================
-- SAMPLE PAYMENTS
-- ==========================================

-- Payment 1: Full payment for Bill 4 (partial amount)
INSERT INTO "Payment" (
    id, "tenantId", "vendorId", "paymentNumber", "paymentDate",
    amount, "paymentMethod", "referenceNumber", status,
    allocations, "createdById"
) VALUES (
    gen_random_uuid(),
    tenant_id,
    vendor1_id,
    'PAY-000001',
    '2026-02-05',
    1000.00,
    'CHECK',
    'CHK-12345',
    'CLEARED',
    '[{"billId":"REPLACE_WITH_BILL4_ID","billNumber":"BILL-000004","allocatedAmount":1000}]'::jsonb,
    user_id
);

-- Payment 2: ACH payment
INSERT INTO "Payment" (
    id, "tenantId", "vendorId", "paymentNumber", "paymentDate",
    amount, "paymentMethod", "referenceNumber", "bankAccount", status,
    allocations, "createdById"
) VALUES (
    gen_random_uuid(),
    tenant_id,
    vendor2_id,
    'PAY-000002',
    '2026-02-08',
    1500.00,
    'ACH',
    'ACH-67890',
    'Business Checking ***1234',
    'PENDING',
    '[]'::jsonb,  -- No allocations yet
    user_id
);

END $$;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- View all bills
SELECT 
    "billNumber", 
    "invoiceNumber",
    "billDate",
    "dueDate",
    "totalAmount",
    "balanceAmount",
    status,
    "approvalStatus"
FROM "APBill"
ORDER BY "billNumber";

-- View all payments
SELECT 
    "paymentNumber",
    "paymentDate",
    amount,
    "paymentMethod",
    "referenceNumber",
    status
FROM "Payment"
ORDER BY "paymentNumber";

-- View aging summary
SELECT 
    CASE 
        WHEN "dueDate" >= CURRENT_DATE THEN 'Current'
        WHEN "dueDate" >= CURRENT_DATE - INTERVAL '30 days' THEN '1-30 Days'
        WHEN "dueDate" >= CURRENT_DATE - INTERVAL '60 days' THEN '31-60 Days'
        WHEN "dueDate" >= CURRENT_DATE - INTERVAL '90 days' THEN '61-90 Days'
        ELSE '90+ Days'
    END as aging_bucket,
    COUNT(*) as bill_count,
    SUM("balanceAmount") as total_balance
FROM "APBill"
WHERE status IN ('PENDING', 'APPROVED', 'PARTIALLY_PAID', 'OVERDUE')
GROUP BY aging_bucket
ORDER BY 
    CASE aging_bucket
        WHEN 'Current' THEN 1
        WHEN '1-30 Days' THEN 2
        WHEN '31-60 Days' THEN 3
        WHEN '61-90 Days' THEN 4
        ELSE 5
    END;

-- ==========================================
-- CLEANUP (if needed)
-- ==========================================

-- Uncomment to delete all sample data:
-- DELETE FROM "Payment" WHERE "paymentNumber" LIKE 'PAY-%';
-- DELETE FROM "APBill" WHERE "billNumber" LIKE 'BILL-%';
