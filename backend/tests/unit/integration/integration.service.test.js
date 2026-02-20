/**
 * Integration Service Tests
 * Tests for cross-module synchronization and GL posting
 */

import { jest } from '@jest/globals';
import IntegrationService from '../../../src/modules/integration/integration.service.js';
import { PrismaClient } from '@prisma/client';

describe('IntegrationService', () => {
  let mockPrisma;
  const mockTenantId = 'tenant-123';
  const mockMovementId = 'movement-456';

  const buildMockJournalEntry = (id) => ({
    id,
    status: 'DRAFT',
    description: 'Test Entry',
    postDate: new Date(),
    journalLines: [
      {
        accountCode: '1000',
        debitAmount: 5000,
        creditAmount: 0,
      },
      {
        accountCode: '2000',
        debitAmount: 0,
        creditAmount: 5000,
      },
    ],
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ==================== INVENTORY TESTS ====================
   */
  describe('syncInventoryMovementToGL', () => {
    it('should successfully sync completed inventory movement to GL', async () => {
      // Arrange
      const mockMovement = {
        id: mockMovementId,
        status: 'COMPLETED',
        type: 'IN',
        quantity: 100,
        unitCost: 50,
        itemId: 'item-1',
        warehouse: { id: 'warehouse-1', name: 'Main Warehouse' },
      };

      mockPrisma.stockMovement.findFirst.mockResolvedValue(mockMovement);
      mockPrisma.item.findFirst.mockResolvedValue({ name: 'Item A' });
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-123',
      });
      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        buildMockJournalEntry('je-123')
      );
      mockPrisma.journalEntry.update.mockResolvedValue({
        status: 'POSTED',
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({});

      // Act
      const result =
        await IntegrationService.syncInventoryMovementToGL(
          mockMovementId,
          mockTenantId
        );

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.journalEntryId).toBe('je-123');
    });

    it('should skip inventory movement that is not completed', async () => {
      // Arrange
      const mockMovement = {
        id: mockMovementId,
        status: 'PENDING',
      };

      mockPrisma.stockMovement.findFirst.mockResolvedValue(mockMovement);

      // Act
      const result =
        await IntegrationService.syncInventoryMovementToGL(
          mockMovementId,
          mockTenantId
        );

      // Assert
      expect(result.status).toBe('SKIPPED');
      expect(result.reason).toContain('not yet completed');
    });

    it('should throw error if movement not found', async () => {
      // Arrange
      mockPrisma.stockMovement.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        IntegrationService.syncInventoryMovementToGL(mockMovementId, mockTenantId)
      ).rejects.toThrow('not found');
    });

    it('should create correct GL entries for OUT movement', async () => {
      // Arrange
      const mockMovement = {
        id: mockMovementId,
        status: 'COMPLETED',
        type: 'OUT',
        quantity: 50,
        unitCost: 100,
        itemId: 'item-2',
        warehouse: { id: 'warehouse-1', name: 'Main Warehouse' },
      };

      mockPrisma.stockMovement.findFirst.mockResolvedValue(mockMovement);
      mockPrisma.item.findFirst.mockResolvedValue({ name: 'Item B' });
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-456',
      });
      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        buildMockJournalEntry('je-456')
      );
      mockPrisma.journalEntry.update.mockResolvedValue({
        status: 'POSTED',
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({});

      // Act
      const result =
        await IntegrationService.syncInventoryMovementToGL(
          mockMovementId,
          mockTenantId
        );

      // Assert
      expect(result.status).toBe('SUCCESS');
      // Verify journal entry was created
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });
  });

  /**
   * ==================== SALES TESTS ====================
   */
  describe('syncSalesOrderToAR', () => {
    it('should successfully sync confirmed sales order to AR/GL', async () => {
      // Arrange
      const mockOrder = {
        id: 'order-123',
        status: 'CONFIRMED',
        total: 10000,
        customer: { id: 'cust-1', name: 'Customer A' },
        customerName: 'Customer A',
      };

      mockPrisma.salesOrder.findFirst.mockResolvedValue(mockOrder);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-789',
      });
      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        buildMockJournalEntry('je-789')
      );
      mockPrisma.journalEntry.update.mockResolvedValue({
        status: 'POSTED',
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({});

      // Act
      const result =
        await IntegrationService.syncSalesOrderToAR('order-123', mockTenantId);

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.journalEntryId).toBe('je-789');
    });

    it('should skip sales order that is not confirmed', async () => {
      // Arrange
      const mockOrder = {
        id: 'order-123',
        status: 'DRAFT',
      };

      mockPrisma.salesOrder.findFirst.mockResolvedValue(mockOrder);

      // Act
      const result =
        await IntegrationService.syncSalesOrderToAR('order-123', mockTenantId);

      // Assert
      expect(result.status).toBe('SKIPPED');
    });
  });

  /**
   * ==================== PAYROLL TESTS ====================
   */
  describe('syncPayrollToGL', () => {
    it('should successfully sync processed payroll to GL', async () => {
      // Arrange
      const mockCycle = {
        id: 'cycle-123',
        status: 'PROCESSING',
        payslips: [
          {
            netSalary: 5000,
            grossSalary: 7000,
            taxDeductions: 1000,
            totalDeductions: 2000,
            employee: { id: 'emp-1' },
          },
          {
            netSalary: 6000,
            grossSalary: 8000,
            taxDeductions: 1200,
            totalDeductions: 2400,
            employee: { id: 'emp-2' },
          },
        ],
      };

      mockPrisma.payrollCycle.findFirst.mockResolvedValue(mockCycle);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-payroll-123',
      });
      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        buildMockJournalEntry('je-payroll-123')
      );
      mockPrisma.journalEntry.update.mockResolvedValue({
        status: 'POSTED',
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({});

      // Act
      const result =
        await IntegrationService.syncPayrollToGL('cycle-123', mockTenantId);

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(mockPrisma.journalEntry.create).toHaveBeenCalled();
    });

    it('should skip payroll that is not processed', async () => {
      // Arrange
      const mockCycle = {
        id: 'cycle-123',
          status: 'DRAFT',
      };

      mockPrisma.payrollCycle.findFirst.mockResolvedValue(mockCycle);

      // Act
      const result =
        await IntegrationService.syncPayrollToGL('cycle-123', mockTenantId);

      // Assert
      expect(result.status).toBe('SKIPPED');
    });
  });

  /**
   * ==================== MANUFACTURING TESTS ====================
   */
  describe('syncManufacturingCostToGL', () => {
    it('should successfully sync completed work order to GL', async () => {
      // Arrange
      const mockWorkOrder = {
        id: 'wo-123',
        status: 'COMPLETED',
        bom: { id: 'bom-1' },
        materials: [{ cost: 2000 }, { cost: 1000 }],
        operations: [
          { actualDuration: 5 }, // 5 hours
          { actualDuration: 3 }, // 3 hours
        ],
      };

      mockPrisma.workOrder.findFirst.mockResolvedValue(mockWorkOrder);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-mfg-123',
      });
      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        buildMockJournalEntry('je-mfg-123')
      );
      mockPrisma.journalEntry.update.mockResolvedValue({
        status: 'POSTED',
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({});

      // Act
      const result =
        await IntegrationService.syncManufacturingCostToGL(
          'wo-123',
          mockTenantId
        );

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.totalCost).toBeGreaterThan(0);
    });
  });

  /**
   * ==================== PURCHASE TESTS ====================
   */
  describe('syncPurchaseOrderToAP', () => {
    it('should successfully sync confirmed PO to AP/GL', async () => {
      // Arrange
      const mockPO = {
        id: 'po-123',
        status: 'CONFIRMED',
        totalAmount: 50000,
        vendor: { id: 'vendor-1', name: 'Vendor A' },
        items: [],
      };

      mockPrisma.purchaseOrder.findFirst.mockResolvedValue(mockPO);
      mockPrisma.journalEntry.create.mockResolvedValue({
        id: 'je-ap-123',
      });
      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        buildMockJournalEntry('je-ap-123')
      );
      mockPrisma.journalEntry.update.mockResolvedValue({
        status: 'POSTED',
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({});

      // Act
      const result =
        await IntegrationService.syncPurchaseOrderToAP('po-123', mockTenantId);

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.apEntryId).toBeDefined();
    });
  });

  /**
   * ==================== HELPER FUNCTION TESTS ====================
   */
  describe('getGLConfiguration', () => {
    it('should return inventory GL config', async () => {
      // Act
      const config = await IntegrationService.getGLConfiguration(
        mockTenantId,
        'INVENTORY'
      );

      // Assert
      expect(config).toBeDefined();
      expect(config.accountCode).toBe('1200');
    });

    it('should return sales GL config', async () => {
      // Act
      const config = await IntegrationService.getGLConfiguration(
        mockTenantId,
        'SALES'
      );

      // Assert
      expect(config).toBeDefined();
      expect(config.accountCode).toBe('4100');
    });

    it('should return payroll GL config', async () => {
      // Act
      const config = await IntegrationService.getGLConfiguration(
        mockTenantId,
        'PAYROLL'
      );

      // Assert
      expect(config).toBeDefined();
      expect(config.accountCode).toBe('6100');
    });
  });

  /**
   * ==================== GL POSTING TESTS ====================
   */
  describe('postJournalEntryToGL', () => {
    it('should post balanced journal entry to GL', async () => {
      // Arrange
      const mockJournalEntry = {
        id: 'je-test',
        status: 'DRAFT',
        description: 'Test Entry',
        postDate: new Date(),
        journalLines: [
          {
            accountCode: '1000',
            debitAmount: 5000,
            creditAmount: 0,
          },
          {
            accountCode: '2000',
            debitAmount: 0,
            creditAmount: 5000,
          },
        ],
      };

      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        mockJournalEntry
      );
      mockPrisma.ledgerEntry.create.mockResolvedValue({});
      mockPrisma.journalEntry.update.mockResolvedValue({
        status: 'POSTED',
      });

      // Act
      const result = await IntegrationService.postJournalEntryToGL(
        'je-test',
        mockTenantId
      );

      // Assert
      expect(result.status).toBe('POSTED');
      expect(result.ledgerEntriesCount).toBe(2);
    });

    it('should fail if journal entry does not balance', async () => {
      // Arrange
      const mockJournalEntry = {
        id: 'je-unbalanced',
        status: 'DRAFT',
        journalLines: [
          {
            accountCode: '1000',
            debitAmount: 5000,
            creditAmount: 0,
          },
          {
            accountCode: '2000',
            debitAmount: 0,
            creditAmount: 4000, // Unbalanced!
          },
        ],
      };

      mockPrisma.journalEntry.findUnique.mockResolvedValue(
        mockJournalEntry
      );

      // Act & Assert
      await expect(
        IntegrationService.postJournalEntryToGL('je-unbalanced', mockTenantId)
      ).rejects.toThrow(/does not balance/);
    });
  });

  /**
   * ==================== BATCH SYNC TESTS ====================
   */
  describe('performBatchSync', () => {
    it('should perform batch sync for all modules', async () => {
      // Arrange
      mockPrisma.stockMovement.findMany.mockResolvedValue([]);

      // Act
      const result =
        await IntegrationService.performBatchSync(mockTenantId);

      // Assert
      expect(result).toHaveProperty('inventory');
      expect(result).toHaveProperty('sales');
      expect(result).toHaveProperty('payroll');
      expect(result).toHaveProperty('manufacturing');
    });
  });
});
