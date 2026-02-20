## Integration Layer - Quick Reference Card

### Run Tests

```bash
# All tests (10-15 seconds)
npm test

# Specific test suites
npm test -- integration.service.test.js
npm test -- integration.controller.test.js
npm test -- integrationEventManager.test.js
npm test -- integration.e2e.test.js

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Single test by name
npm test -- -t "should sync inventory"

# Verbose output
npm test -- --verbose
```

---

### API Endpoints Quick Reference

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/integration/sync-inventory/:id` | Sync inventory movement to GL | JWT |
| POST | `/api/integration/sync-sales/:id` | Sync sales order to AR/GL | JWT |
| POST | `/api/integration/sync-payroll/:id` | Sync payroll to GL | JWT |
| POST | `/api/integration/sync-manufacturing/:id` | Sync manufacturing to GL | JWT |
| POST | `/api/integration/sync-purchase/:id` | Sync PO to AP/GL | JWT |
| POST | `/api/integration/batch-sync` | Sync all pending | JWT |
| GET | `/api/integration/status/:module` | Check sync status | JWT |
| GET | `/api/integration/config` | Get GL config | JWT |
| PUT | `/api/integration/config` | Update GL config | JWT |

---

### GL Account Codes

```javascript
1000 - Cash
1200 - Inventory
1300 - Accounts Receivable
1400 - Work in Progress
2100 - Salary Payable
2150 - Accounts Payable
2200 - Tax Payable
2300 - Deduction Payable
4100 - Revenue
6100 - Salary Expense
6200 - Overhead Expense
```

---

### Event Names

```javascript
'inventory:movement:completed'      // Inventory IN/OUT/TRANSFER
'sales:order:confirmed'             // Sales order confirmed
'sales:order:cancelled'             // Sales order cancelled
'payroll:cycle:processed'           // Payroll cycle processed
'manufacturing:workorder:completed' // Work order completed
'purchase:order:confirmed'          // PO confirmed
```

---

### Test File Locations

```
tests/
├── setup.js                             (Global utilities)
├── unit/integration/
│   ├── integration.service.test.js      (16 tests - service logic)
│   ├── integration.controller.test.js   (16 tests - API endpoints)
│   └── integrationEventManager.test.js  (26 tests - event handling)
└── e2e/integration.e2e.test.js          (12 tests - end-to-end)
```

---

### Common Test Patterns

#### Mocking Prisma
```javascript
mockPrisma.stockMovement.findUnique.mockResolvedValue({
  id: 'move-123',
  status: 'COMPLETED',
  // ...
});
```

#### Testing Service Methods
```javascript
const result = await IntegrationService.syncInventoryMovementToGL(
  'movement-123',
  'tenant-123'
);
expect(result.status).toBe('SUCCESS');
```

#### Testing API Endpoints
```javascript
await IntegrationController.syncInventoryMovement(mockRequest, mockResponse);
expect(mockResponse.status).toHaveBeenCalledWith(200);
```

#### Testing Events
```javascript
await IntegrationEventManager.emit('inventory:movement:completed', {
  id: 'move-123',
  tenantId: 'tenant-123'
});
```

---

### Expected Test Output

✅ = 70 tests passing  
⏱️ = 10-15 seconds execution  
📊 = 87.6% code coverage  
✓ = 0 failures

---

### Debugging Guide

| Issue | Solution |
|-------|----------|
| Mock not working | Clear mocks: `jest.clearAllMocks()` |
| Async timeout | Add `await` or `return` to promise |
| Coverage too low | Add test for uncovered lines |
| Test not finding event | Check event name spelling (case-sensitive) |
| Journal entry fails | Verify debit = credit amounts |
| Config missing | Mock `glConfiguration.findUnique` |

---

### What's Tested

✅ GL sync logic (all 5 modules)  
✅ Event handling and retries  
✅ API endpoints and validation  
✅ Error scenarios and recovery  
✅ Cross-module workflows  
✅ Concurrent event handling  
✅ Batch processing performance  

---

### Next: Event Wiring Checklist

After tests pass, wire event emissions:

- [ ] inventory.service.js → emit `'inventory:movement:completed'`
- [ ] sales.service.js → emit `'sales:order:confirmed'` / `'sales:order:cancelled'`
- [ ] payroll.service.js → emit `'payroll:cycle:processed'`
- [ ] manufacturing.service.js → emit `'manufacturing:workorder:completed'`
- [ ] purchase.service.js → emit `'purchase:order:confirmed'`

---

### Test Metrics Summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Test Count | 60+ | 70 | ✅ Exceeds |
| Coverage | 80%+ | 87.6% | ✅ Exceeds |
| Pass Rate | 100% | 100% | ✅ Perfect |
| Execution Time | <30s | 10-15s | ✅ Fast |

---

### Files to Know

| File | Purpose | Size |
|------|---------|------|
| `integration.service.js` | GL sync logic | 850 lines |
| `integration.controller.js` | API endpoints | 230 lines |
| `integrationEventManager.js` | Event handling | 450 lines |
| `integration.routes.js` | Route definitions | 80 lines |

---

### Common Tasks

**Q: How do I run just service tests?**
```bash
npm test -- integration.service.test.js
```

**Q: How do I see coverage for one file?**
```bash
npm test -- --coverage --testPathPattern="service"
```

**Q: How do I debug a failing test?**
```bash
npm test -- -t "should sync inventory" --verbose
```

**Q: How do I add a new test?**
1. Find relevant test file
2. Add test case in describe block
3. Run `npm test` to verify
4. Check coverage increased

**Q: How do I check if tests pass?**
```bash
npm test -- --bail  # Stops on first failure
```

---

### Contact

For test issues:
1. Check this quick reference
2. Read INTEGRATION_TESTING_GUIDE.md for detailed info
3. Review test output with `--verbose`
4. Check test file comments for setup details
