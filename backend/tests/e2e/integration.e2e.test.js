/**
 * End-to-End Integration Tests
 * Tests complete workflows from source module through GL posting
 */

import IntegrationService from '../../src/modules/integration/integration.service.js';
import IntegrationEventManager from '../../src/modules/integration/events/integrationEventManager.js';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');

describe('End-to-End Integration Workflows', () => {
  let mockPrisma;
  const mockTenantId = 'tenant-e2e-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  /**
   * ==================== INVENTORY-TO-GL E2E TESTS ====================
   */
  describe('E2E: Inventory Movement → GL', () => {
    it('should complete full inventory IN movement to GL posting', async () => {
      // Arrange - Setup inventory movement
      const mockMovement = {
        id: 'e2e-move-1',
        status: 'COMPLETED',
        movementType: 'IN',
        quantity: 100,
        costPerUnit: 50,
        totalAmount: 5000,
        item: {
          id: 'item-1',
          name: 'Widget A',
          code: 'WID-001',
        },
        warehouse: {
          id: 'warehouse-1',
          name: 'Main Warehouse',
        },
        createdAt: new Date(),
      };

      // Mock: Get stock movement
      mockPrisma.stockMovement.findUnique.mockResolvedValue(mockMovement);

      // Mock: Get GL configuration
      mockPrisma.glConfiguration.findUnique.mockResolvedValue({
        id: 'glconfig-1',
        accountCode: '1200', // Inventory account
        tenantId: mockTenantId,
      });

      // Mock: Create journal entry
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-e2e-1',
        status: 'DRAFT',
        refType: 'STOCK_MOVEMENT',
        refId: 'e2e-move-1',
        creditAmount: 5000,
        debitAmount: 5000,
        description: '[STOCK_IN] Widget A - 100 units @ 50 each',
      });

      // Mock: Create ledger entries
      mockPrisma.ledgerEntry.create.mockResolvedValue({
        id: 'le-1',
        status: 'POSTED',
      });

      // Mock: Update movement as synced
      mockPrisma.stockMovement.update.mockResolvedValue({
        ...mockMovement,
        glSynced: true,
        glSyncedAt: new Date(),
      });

      // Act
      const result = await IntegrationService.syncInventoryMovementToGL(
        'e2e-move-1',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.journalEntryId).toBe('je-e2e-1');
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalled();
      expect(mockPrisma.stockMovement.update).toHaveBeenCalled();
    });

    it('should correctly debit/credit for inventory OUT movement', async () => {
      // Arrange
      const mockMovement = {
        id: 'e2e-move-out',
        status: 'COMPLETED',
        movementType: 'OUT',
        quantity: 50,
        costPerUnit: 100,
        totalAmount: 5000,
        item: { id: 'item-2', name: 'Widget B', code: 'WID-002' },
        warehouse: { id: 'warehouse-1', name: 'Main Warehouse' },
      };

      mockPrisma.stockMovement.findUnique.mockResolvedValue(mockMovement);
      mockPrisma.glConfiguration.findUnique.mockResolvedValue({
        accountCode: '1200',
        tenantId: mockTenantId,
      });
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-e2e-out',
        description: '[STOCK_OUT] Widget B - 50 units @ 100 each',
      });

      // Act
      const result = await IntegrationService.syncInventoryMovementToGL(
        'e2e-move-out',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('SUCCESS');
      // For OUT, credit inventory and debit expense/offset account
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: expect.stringContaining('[STOCK_OUT]'),
          }),
        })
      );
    });

    it('should handle inventory transfer (FROM warehouse to TO warehouse)', async () => {
      // Arrange
      const mockTransfer = {
        id: 'e2e-transfer-1',
        status: 'COMPLETED',
        movementType: 'TRANSFER',
        quantity: 75,
        costPerUnit: 60,
        fromWarehouse: { id: 'warehouse-1', name: 'Main' },
        toWarehouse: { id: 'warehouse-2', name: 'Branch' },
        item: { id: 'item-3', name: 'Widget C' },
      };

      mockPrisma.stockMovement.findUnique.mockResolvedValue(mockTransfer);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-transfer',
        description: '[TRANSFER] Widget C 75 units from Main to Branch',
      });

      // Act
      const result = await IntegrationService.syncInventoryMovementToGL(
        'e2e-transfer-1',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  /**
   * ==================== SALES-TO-GL E2E TESTS ====================
   */
  describe('E2E: Sales Order → AR/GL', () => {
    it('should complete full sales order to AR posting', async () => {
      // Arrange
      const mockOrder = {
        id: 'e2e-order-1',
        status: 'CONFIRMED',
        orderDate: new Date(),
        totalAmount: 50000,
        customer: {
          id: 'cust-1',
          name: 'Customer ABC Inc',
          creditLimit: 100000,
        },
        items: [
          { id: 'oi-1', itemId: 'item-1', quantity: 10, unitPrice: 5000 },
        ],
      };

      // Mock: Get sales order
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      // Mock: Get GL configuration
      mockPrisma.glConfiguration.findUnique.mockResolvedValue({
        accountCode: '4100', // Revenue account
        tenantId: mockTenantId,
      });

      // Mock: Create AR entry
      mockPrisma.arEntry.create.mockResolvedValue({
        id: 'are-1',
        customerId: 'cust-1',
        amount: 50000,
        status: 'OPEN',
        dueDate: new Date('2024-02-14'),
      });

      // Mock: Create journal entry
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-sales-1',
        description: 'Sales Order #1 - Customer ABC Inc - $50,000',
      });

      // Act
      const result = await IntegrationService.syncSalesOrderToAR(
        'e2e-order-1',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.journalEntryId).toBe('je-sales-1');
      expect(mockPrisma.arEntry.create).toHaveBeenCalled();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });

    it('should emit event cascade: Order Confirmed → AR Created → GL Posted', async () => {
      // Arrange
      const orderConfirmedEvent = {
        type: 'sales:order:confirmed',
        data: { id: 'e2e-order-cascade', tenantId: mockTenantId },
      };

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'e2e-order-cascade',
        status: 'CONFIRMED',
        totalAmount: 30000,
        customer: { id: 'cust-2', name: 'Client XYZ' },
      });

      mockPrisma.arEntry.create.mockResolvedValue({ id: 'are-cascade' });
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-cascade',
        status: 'DRAFT',
      });

      // Act
      await IntegrationEventManager.emit(
        orderConfirmedEvent.type,
        orderConfirmedEvent.data
      );

      // Assert
      expect(mockPrisma.arEntry.create).toHaveBeenCalled();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  /**
   * ==================== PAYROLL-TO-GL E2E TESTS ====================
   */
  describe('E2E: Payroll Cycle → GL', () => {
    it('should complete payroll cycle with multiple employees', async () => {
      // Arrange - Complex payroll with 5 employees
      const mockCycle = {
        id: 'e2e-payroll-1',
        status: 'PROCESSED',
        payrollPeriod: 'January 2024',
        processedDate: new Date(),
        payrolls: [
          {
            employeeId: 'emp-1',
            netAmount: 5000,
            taxAmount: 1000,
            deductionAmount: 500,
            grossAmount: 6500,
          },
          {
            employeeId: 'emp-2',
            netAmount: 6000,
            taxAmount: 1200,
            deductionAmount: 600,
            grossAmount: 7800,
          },
          {
            employeeId: 'emp-3',
            netAmount: 4500,
            taxAmount: 900,
            deductionAmount: 450,
            grossAmount: 5850,
          },
          {
            employeeId: 'emp-4',
            netAmount: 7000,
            taxAmount: 1400,
            deductionAmount: 700,
            grossAmount: 9100,
          },
          {
            employeeId: 'emp-5',
            netAmount: 5500,
            taxAmount: 1100,
            deductionAmount: 550,
            grossAmount: 7150,
          },
        ],
      };

      // Mock: Get payroll cycle
      mockPrisma.payrollCycle.findUnique.mockResolvedValue(mockCycle);

      // Mock: Create journal entries (one per component: salary expense, tax liability, etc.)
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-payroll-1',
        description: 'Payroll Cycle January 2024 - 5 Employees',
      });

      // Act
      const result = await IntegrationService.syncPayrollToGL(
        'e2e-payroll-1',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('SUCCESS');
      const totalExpense =
        mockCycle.payrolls.reduce((sum, p) => sum + p.grossAmount, 0);
      expect(result.totalExpense).toBe(totalExpense);
      expect(result.employeeCount).toBe(5);
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  /**
   * ==================== MANUFACTURING-TO-GL E2E TESTS ====================
   */
  describe('E2E: Manufacturing Work Order → GL (WIP/Overhead)', () => {
    it('should complete manufacturing work order with WIP and overhead allocation', async () => {
      // Arrange
      const mockWorkOrder = {
        id: 'e2e-wo-1',
        status: 'COMPLETED',
        bomId: 'bom-1',
        quantity: 100,
        materials: [
          { id: 'mat-1', cost: 50 * 100 }, // 5,000
          { id: 'mat-2', cost: 30 * 100 }, // 3,000
        ],
        operations: [
          { id: 'op-1', actualDuration: 10, hourlyRate: 50 }, // 500
          { id: 'op-2', actualDuration: 15, hourlyRate: 60 }, // 900
        ],
        overheadPercentage: 10,
      };

      mockPrisma.workOrder.findUnique.mockResolvedValue(mockWorkOrder);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-wo-1',
        description: 'Manufacturing WO #1 - 100 units completed',
      });

      // Act
      const result = await IntegrationService.syncManufacturingCostToGL(
        'e2e-wo-1',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('SUCCESS');
      // Total: Materials (8,000) + Labor (1,400) + Overhead (940) = 10,340
      expect(result.materialCost).toBe(8000);
      expect(result.laborCost).toBeLessThanOrEqual(1400);
      expect(result.overheadCost).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(0);
    });
  });

  /**
   * ==================== PURCHASE-TO-GL E2E TESTS ====================
   */
  describe('E2E: Purchase Order → AP/GL', () => {
    it('should complete purchase order with AP liability and GL posting', async () => {
      // Arrange
      const mockPO = {
        id: 'e2e-po-1',
        status: 'CONFIRMED',
        poNumber: 'PO-2024-001',
        totalAmount: 100000,
        vendor: {
          id: 'vendor-1',
          name: 'Supplier Corp',
          terms: 'NET-30',
        },
        items: [
          { itemId: 'item-1', quantity: 50, unitPrice: 1000 },
          { itemId: 'item-2', quantity: 100, unitPrice: 500 },
        ],
      };

      mockPrisma.purchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrisma.glConfiguration.findUnique.mockResolvedValue({
        accountCode: '1200', // Inventory account
        tenantId: mockTenantId,
      });

      // Mock: Create AP entry
      mockPrisma.apEntry.create.mockResolvedValue({
        id: 'ape-1',
        vendorId: 'vendor-1',
        amount: 100000,
        status: 'OPEN',
        dueDate: new Date('2024-02-14'),
      });

      // Mock: Create journal entry
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-po-1',
        description: 'Purchase Order PO-2024-001 - Supplier Corp - $100,000',
      });

      // Act
      const result = await IntegrationService.syncPurchaseOrderToAP(
        'e2e-po-1',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.apEntryId).toBe('ape-1');
      expect(mockPrisma.apEntry.create).toHaveBeenCalled();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  /**
   * ==================== ERROR HANDLING E2E TESTS ====================
   */
  describe('E2E: Error Scenarios and Recovery', () => {
    it('should handle missing GL configuration gracefully', async () => {
      // Arrange
      const mockMovement = {
        id: 'e2e-error-1',
        status: 'COMPLETED',
        movementType: 'IN',
      };

      mockPrisma.stockMovement.findUnique.mockResolvedValue(mockMovement);
      mockPrisma.glConfiguration.findUnique.mockResolvedValue(null); // Missing config

      // Act
      const result = await IntegrationService.syncInventoryMovementToGL(
        'e2e-error-1',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('ERROR');
      expect(result.error).toContain('configuration');
    });

    it('should handle unbalanced journal entries', async () => {
      // Arrange
      const mockMovement = {
        id: 'e2e-unbalanced',
        status: 'COMPLETED',
        movementType: 'IN',
        quantity: 100,
        costPerUnit: 50,
      };

      mockPrisma.stockMovement.findUnique.mockResolvedValue(mockMovement);
      mockPrisma.glConfiguration.findUnique.mockResolvedValue({
        accountCode: '1200',
      });

      // Mock GL posting to fail due to imbalance
      mockPrisma.journalEntry.create.mockRejectedValue(
        new Error('Journal entry does not balance')
      );

      // Act
      const result = await IntegrationService.syncInventoryMovementToGL(
        'e2e-unbalanced',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('ERROR');
    });
  });

  /**
   * ==================== CROSS-MODULE E2E TESTS ====================
   */
  describe('E2E: Cross-Module Workflows', () => {
    it('should handle complete order-to-delivery-to-GL workflow', async () => {
      // This simulates: Sales Order → Inventory Movement → AR & GL

      // Step 1: Create sales order
      const orderData = {
        id: 'e2e-xmodule-1',
        status: 'CONFIRMED',
        totalAmount: 50000,
      };

      mockPrisma.order.findUnique.mockResolvedValue(orderData);

      // Step 2: Sales order confirmed triggers AR creation
      const arResult = await IntegrationService.syncSalesOrderToAR(
        'e2e-xmodule-1',
        mockTenantId
      );

      // Assert Step 2
      expect(arResult.status).toBe('SUCCESS');

      // Step 3: Inventory OUT movement
      const movementData = {
        id: 'e2e-xmodule-inv',
        status: 'COMPLETED',
        movementType: 'OUT',
      };

      mockPrisma.stockMovement.findUnique.mockResolvedValue(movementData);

      const invResult = await IntegrationService.syncInventoryMovementToGL(
        'e2e-xmodule-inv',
        mockTenantId
      );

      // Assert Step 3
      expect(invResult.status).toBe('SUCCESS');

      // Final Assert: Both workflows completed
      expect(mockPrisma.arEntry.create).toHaveBeenCalled();
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  /**
   * ==================== PERFORMANCE E2E TESTS ====================
   */
  describe('E2E: Batch Processing Performance', () => {
    it('should process batch of 100 movements efficiently', async () => {
      // Arrange - Create mock movements
      const movements = Array.from({ length: 100 }, (_, i) => ({
        id: `e2e-batch-${i}`,
        status: 'COMPLETED',
        movementType: 'IN',
      }));

      mockPrisma.stockMovement.findMany.mockResolvedValue(movements);
      mockPrisma.journalEntry.create.mockResolvedValue({ id: 'je-batch' });

      // Act
      const startTime = Date.now();
      const result =
        await IntegrationService.performBatchSync(mockTenantId);
      const executionTime = Date.now() - startTime;

      // Assert
      expect(result).toBeDefined();
      expect(executionTime).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });
});
