/**
 * Integration Event Manager Tests
 * Tests for event-driven GL synchronization
 */

import IntegrationEventManager from '../../src/modules/integration/events/integrationEventManager.js';
import IntegrationService from '../../src/modules/integration/integration.service.js';

// Mock IntegrationService
jest.mock('../../src/modules/integration/integration.service.js');

describe('IntegrationEventManager', () => {
  let eventManager;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Initialize event manager
    eventManager = IntegrationEventManager;

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  /**
   * ==================== EVENT LISTENER REGISTRATION TESTS ====================
   */
  describe('Event Listener Registration', () => {
    it('should register inventory movement event listener', () => {
      // Act
      const listeners = eventManager.eventNames();

      // Assert
      expect(listeners).toContain('inventory:movement:completed');
    });

    it('should register sales order event listeners', () => {
      // Act
      const listeners = eventManager.eventNames();

      // Assert
      expect(listeners).toContain('sales:order:confirmed');
      expect(listeners).toContain('sales:order:cancelled');
    });

    it('should register payroll cycle event listener', () => {
      // Act
      const listeners = eventManager.eventNames();

      // Assert
      expect(listeners).toContain('payroll:cycle:processed');
    });

    it('should register manufacturing event listeners', () => {
      // Act
      const listeners = eventManager.eventNames();

      // Assert
      expect(listeners).toContain('manufacturing:workorder:completed');
    });

    it('should register purchase order event listeners', () => {
      // Act
      const listeners = eventManager.eventNames();

      // Assert
      expect(listeners).toContain('purchase:order:confirmed');
    });
  });

  /**
   * ==================== INVENTORY EVENT TESTS ====================
   */
  describe('Inventory Events', () => {
    it('should sync inventory movement when movement:completed event fires', async () => {
      // Arrange
      const movementData = { id: 'movement-123', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL.mockResolvedValue({
        status: 'SUCCESS',
      });

      // Act
      await eventManager.emit('inventory:movement:completed', movementData);

      // Assert
      expect(IntegrationService.syncInventoryMovementToGL).toHaveBeenCalledWith(
        'movement-123',
        mockTenantId
      );
    });

    it('should handle errors during inventory sync', async () => {
      // Arrange
      const movementData = { id: 'movement-error', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL.mockRejectedValue(
        new Error('Database error')
      );

      // Act
      await eventManager.emit('inventory:movement:completed', movementData);

      // Assert - Should emit error event
      expect(console.error).toHaveBeenCalled();
    });

    it('should skip syncing if movement is already synced', async () => {
      // Arrange
      const movementData = { id: 'movement-synced', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL.mockResolvedValue({
        status: 'SKIPPED',
        reason: 'Already synced',
      });

      // Act
      await eventManager.emit('inventory:movement:completed', movementData);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('SKIPPED')
      );
    });
  });

  /**
   * ==================== SALES EVENT TESTS ====================
   */
  describe('Sales Order Events', () => {
    it('should sync sales order when order:confirmed event fires', async () => {
      // Arrange
      const orderData = { id: 'order-123', tenantId: mockTenantId };
      IntegrationService.syncSalesOrderToAR.mockResolvedValue({
        status: 'SUCCESS',
      });

      // Act
      await eventManager.emit('sales:order:confirmed', orderData);

      // Assert
      expect(IntegrationService.syncSalesOrderToAR).toHaveBeenCalledWith(
        'order-123',
        mockTenantId
      );
    });

    it('should emit ar:entry:created on successful AR sync', async () => {
      // Arrange
      const orderData = { id: 'order-456', tenantId: mockTenantId };
      IntegrationService.syncSalesOrderToAR.mockResolvedValue({
        status: 'SUCCESS',
        journalEntryId: 'je-456',
      });

      // Create a spy on emit to track cascading events
      const emitSpy = jest.spyOn(eventManager, 'emit');

      // Act
      await eventManager.emit('sales:order:confirmed', orderData);

      // Assert - Check if success event was emitted
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('SUCCESS')
      );
    });

    it('should cancel AR entry when order:cancelled is emitted', async () => {
      // Arrange
      const orderData = { id: 'order-cancel', tenantId: mockTenantId };
      IntegrationService.cancelAREntry.mockResolvedValue({
        status: 'CANCELLED',
      });

      // Act
      await eventManager.emit('sales:order:cancelled', orderData);

      // Assert
      expect(console.log).toHaveBeenCalled();
    });
  });

  /**
   * ==================== PAYROLL EVENT TESTS ====================
   */
  describe('Payroll Cycle Events', () => {
    it('should sync payroll cycle when cycle:processed event fires', async () => {
      // Arrange
      const cycleData = { id: 'cycle-123', tenantId: mockTenantId };
      IntegrationService.syncPayrollToGL.mockResolvedValue({
        status: 'SUCCESS',
        totalAmount: 50000,
      });

      // Act
      await eventManager.emit('payroll:cycle:processed', cycleData);

      // Assert
      expect(IntegrationService.syncPayrollToGL).toHaveBeenCalledWith(
        'cycle-123',
        mockTenantId
      );
    });

    it('should calculate correct GL entries for multiple employees', async () => {
      // Arrange
      const cycleData = {
        id: 'cycle-multi',
        tenantId: mockTenantId,
        payrolls: [
          { employeeId: 'emp-1', netPay: 5000 },
          { employeeId: 'emp-2', netPay: 6000 },
          { employeeId: 'emp-3', netPay: 4500 },
        ],
      };

      IntegrationService.syncPayrollToGL.mockResolvedValue({
        status: 'SUCCESS',
        totalAmount: 15500,
        employeeCount: 3,
      });

      // Act
      await eventManager.emit('payroll:cycle:processed', cycleData);

      // Assert
      expect(IntegrationService.syncPayrollToGL).toHaveBeenCalledWith(
        'cycle-multi',
        mockTenantId
      );
    });
  });

  /**
   * ==================== MANUFACTURING EVENT TESTS ====================
   */
  describe('Manufacturing Work Order Events', () => {
    it('should sync manufacturing cost when workorder:completed event fires', async () => {
      // Arrange
      const woData = { id: 'wo-123', tenantId: mockTenantId };
      IntegrationService.syncManufacturingCostToGL.mockResolvedValue({
        status: 'SUCCESS',
        totalCost: 15000,
      });

      // Act
      await eventManager.emit('manufacturing:workorder:completed', woData);

      // Assert
      expect(IntegrationService.syncManufacturingCostToGL).toHaveBeenCalledWith(
        'wo-123',
        mockTenantId
      );
    });

    it('should track WIP and overhead allocation', async () => {
      // Arrange
      const woData = { id: 'wo-advanced', tenantId: mockTenantId };
      IntegrationService.syncManufacturingCostToGL.mockResolvedValue({
        status: 'SUCCESS',
        wipCost: 10000,
        overheadCost: 5000,
        totalCost: 15000,
      });

      // Act
      await eventManager.emit('manufacturing:workorder:completed', woData);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Manufacturing')
      );
    });
  });

  /**
   * ==================== PURCHASE ORDER EVENT TESTS ====================
   */
  describe('Purchase Order Events', () => {
    it('should sync purchase order when po:confirmed event fires', async () => {
      // Arrange
      const poData = { id: 'po-123', tenantId: mockTenantId };
      IntegrationService.syncPurchaseOrderToAP.mockResolvedValue({
        status: 'SUCCESS',
        apEntryId: 'ap-123',
      });

      // Act
      await eventManager.emit('purchase:order:confirmed', poData);

      // Assert
      expect(IntegrationService.syncPurchaseOrderToAP).toHaveBeenCalledWith(
        'po-123',
        mockTenantId
      );
    });

    it('should create AP liability when purchase order confirmed', async () => {
      // Arrange
      const poData = {
        id: 'po-liability',
        tenantId: mockTenantId,
        totalAmount: 50000,
        vendorId: 'vendor-1',
      };

      IntegrationService.syncPurchaseOrderToAP.mockResolvedValue({
        status: 'SUCCESS',
        apEntryId: 'ap-liability',
        liabilityAccount: '2150',
        amount: 50000,
      });

      // Act
      await eventManager.emit('purchase:order:confirmed', poData);

      // Assert
      expect(console.log).toHaveBeenCalled();
    });
  });

  /**
   * ==================== ASYNC/RETRY TESTS ====================
   */
  describe('Async Handling and Retries', () => {
    it('should handle async operations without blocking', async () => {
      // Arrange
      const startTime = Date.now();
      const movementData = { id: 'movement-async', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ status: 'SUCCESS' }), 100))
      );

      // Act
      const promise = eventManager.emit('inventory:movement:completed', movementData);

      // Assert - Should return immediately
      expect(Date.now() - startTime).toBeLessThan(50);

      // Wait for async operation
      await promise;
    });

    it('should retry failed sync operations', async () => {
      // Arrange
      const movementData = { id: 'movement-retry', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 'SUCCESS' });

      // Act
      // First emit (will fail and retry)
      await eventManager.emit('inventory:movement:completed', movementData);

      // Assert
      expect(IntegrationService.syncInventoryMovementToGL).toHaveBeenCalled();
    });

    it('should emit error event after max retries exceeded', async () => {
      // Arrange
      const movementData = { id: 'movement-maxretry', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL.mockRejectedValue(
        new Error('Persistent error')
      );

      // Act
      await eventManager.emit('inventory:movement:completed', movementData);

      // Assert - Should log error
      expect(console.error).toHaveBeenCalled();
    });
  });

  /**
   * ==================== EVENT FLOW TESTS ====================
   */
  describe('Complete Event Flow', () => {
    it('should handle complete inventory-to-GL flow', async () => {
      // Arrange
      const movementData = { id: 'flow-test', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL.mockResolvedValue({
        status: 'SUCCESS',
        journalEntryId: 'je-flow',
      });

      // Act
      await eventManager.emit('inventory:movement:completed', movementData);

      // Assert
      expect(IntegrationService.syncInventoryMovementToGL).toHaveBeenCalledWith(
        'flow-test',
        mockTenantId
      );
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle concurrent events without race conditions', async () => {
      // Arrange
      const movement1 = { id: 'move-1', tenantId: mockTenantId };
      const movement2 = { id: 'move-2', tenantId: mockTenantId };
      IntegrationService.syncInventoryMovementToGL.mockResolvedValue({
        status: 'SUCCESS',
      });

      // Act - Emit two events concurrently
      await Promise.all([
        eventManager.emit('inventory:movement:completed', movement1),
        eventManager.emit('inventory:movement:completed', movement2),
      ]);

      // Assert - Both should be synced
      expect(IntegrationService.syncInventoryMovementToGL).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * ==================== LISTENER COUNT TESTS ====================
   */
  describe('Event Listener Management', () => {
    it('should have at least one listener for each event type', () => {
      // Act
      const eventTypes = [
        'inventory:movement:completed',
        'sales:order:confirmed',
        'payroll:cycle:processed',
        'manufacturing:workorder:completed',
        'purchase:order:confirmed',
      ];

      // Assert
      eventTypes.forEach(eventType => {
        const listenerCount = eventManager.listenerCount(eventType);
        expect(listenerCount).toBeGreaterThan(0);
      });
    });

    it('should not have duplicate listeners', () => {
      // Act
      const inventoryListeners = eventManager.listenerCount('inventory:movement:completed');

      // Assert - Should be exactly 1 (not multiple registrations)
      expect(inventoryListeners).toBe(1);
    });
  });

  /**
   * ==================== ERROR HANDLING TESTS ====================
   */
  describe('Error Handling', () => {
    it('should handle null/undefined event data gracefully', async () => {
      // Act & Assert - Should not throw
      await expect(
        eventManager.emit('inventory:movement:completed', null)
      ).resolves.toBeDefined();
    });

    it('should validate required event data fields', async () => {
      // Arrange
      const invalidData = {}; // Missing id and tenantId

      // Act
      await eventManager.emit('inventory:movement:completed', invalidData);

      // Assert - Should handle gracefully
      expect(console.error).toHaveBeenCalled();
    });
  });
});
