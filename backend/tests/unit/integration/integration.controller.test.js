/**
 * Integration Controller Tests
 * Tests for integration API endpoints
 */

import IntegrationController from '../../src/modules/integration/integration.controller.js';
import IntegrationService from '../../src/modules/integration/integration.service.js';

// Mock the service
jest.mock('../../src/modules/integration/integration.service.js');

describe('IntegrationController', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;
  const mockTenantId = 'tenant-123';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock request
    mockRequest = {
      params: {},
      body: {},
      user: {
        id: 'user-123',
        tenantId: mockTenantId,
        role: 'ADMIN',
      },
      tenantId: mockTenantId,
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  /**
   * ==================== SYNC INVENTORY TESTS ====================
   */
  describe('POST /api/integration/sync-inventory/:id', () => {
    it('should successfully sync inventory movement', async () => {
      // Arrange
      mockRequest.params = { id: 'movement-123' };
      IntegrationService.syncInventoryMovementToGL.mockResolvedValue({
        status: 'SUCCESS',
        journalEntryId: 'je-123',
      });

      // Act
      await IntegrationController.syncInventoryMovement(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          journalEntryId: 'je-123',
        })
      );
    });

    it('should return 400 if movement ID not provided', async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      await IntegrationController.syncInventoryMovement(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('should return 404 if service throws NotFound error', async () => {
      // Arrange
      mockRequest.params = { id: 'movement-notfound' };
      IntegrationService.syncInventoryMovementToGL.mockRejectedValue(
        new Error('Movement not found')
      );

      // Act
      await IntegrationController.syncInventoryMovement(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  /**
   * ==================== SYNC SALES TESTS ====================
   */
  describe('POST /api/integration/sync-sales/:id', () => {
    it('should successfully sync sales order', async () => {
      // Arrange
      mockRequest.params = { id: 'order-123' };
      IntegrationService.syncSalesOrderToAR.mockResolvedValue({
        status: 'SUCCESS',
        journalEntryId: 'je-sales-123',
      });

      // Act
      await IntegrationController.syncSalesOrder(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
        })
      );
    });

    it('should skip if sales order not in confirmed state', async () => {
      // Arrange
      mockRequest.params = { id: 'order-draft' };
      IntegrationService.syncSalesOrderToAR.mockResolvedValue({
        status: 'SKIPPED',
        reason: 'Order status is DRAFT',
      });

      // Act
      await IntegrationController.syncSalesOrder(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SKIPPED',
        })
      );
    });
  });

  /**
   * ==================== SYNC PAYROLL TESTS ====================
   */
  describe('POST /api/integration/sync-payroll/:id', () => {
    it('should successfully sync payroll cycle', async () => {
      // Arrange
      mockRequest.params = { id: 'cycle-123' };
      IntegrationService.syncPayrollToGL.mockResolvedValue({
        status: 'SUCCESS',
        totalAmount: 50000,
        employeeCount: 10,
      });

      // Act
      await IntegrationController.syncPayrollCycle(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          totalAmount: 50000,
        })
      );
    });
  });

  /**
   * ==================== SYNC MANUFACTURING TESTS ====================
   */
  describe('POST /api/integration/sync-manufacturing/:id', () => {
    it('should successfully sync manufacturing work order', async () => {
      // Arrange
      mockRequest.params = { id: 'wo-123' };
      IntegrationService.syncManufacturingCostToGL.mockResolvedValue({
        status: 'SUCCESS',
        totalCost: 15000,
      });

      // Act
      await IntegrationController.syncManufacturingWorkOrder(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          totalCost: 15000,
        })
      );
    });
  });

  /**
   * ==================== SYNC PURCHASE TESTS ====================
   */
  describe('POST /api/integration/sync-purchase/:id', () => {
    it('should successfully sync purchase order', async () => {
      // Arrange
      mockRequest.params = { id: 'po-123' };
      IntegrationService.syncPurchaseOrderToAP.mockResolvedValue({
        status: 'SUCCESS',
        apEntryId: 'ap-123',
      });

      // Act
      await IntegrationController.syncPurchaseOrder(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
        })
      );
    });
  });

  /**
   * ==================== BATCH SYNC TESTS ====================
   */
  describe('POST /api/integration/batch-sync', () => {
    it('should perform batch sync for all modules', async () => {
      // Arrange
      IntegrationService.performBatchSync.mockResolvedValue({
        inventory: { synced: 5, skipped: 2, errors: 0 },
        sales: { synced: 3, skipped: 1, errors: 0 },
        payroll: { synced: 1, skipped: 0, errors: 0 },
        manufacturing: { synced: 2, skipped: 0, errors: 1 },
        purchase: { synced: 4, skipped: 1, errors: 0 },
        totalTime: 1234,
      });

      // Act
      await IntegrationController.performBatchSync(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.objectContaining({
            inventory: expect.any(Object),
          }),
        })
      );
    });

    it('should handle batch sync errors gracefully', async () => {
      // Arrange
      IntegrationService.performBatchSync.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await IntegrationController.performBatchSync(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  /**
   * ==================== STATUS TESTS ====================
   */
  describe('GET /api/integration/status/:moduleName', () => {
    it('should return sync status for inventory module', async () => {
      // Arrange
      mockRequest.params = { moduleName: 'inventory' };
      IntegrationService.getSyncStatus.mockResolvedValue({
        moduleName: 'inventory',
        lastSyncTime: '2024-01-15T10:30:00Z',
        successCount: 150,
        errorCount: 5,
        pendingCount: 12,
      });

      // Act
      await IntegrationController.getSyncStatus(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleName: 'inventory',
        })
      );
    });

    it('should return 400 for invalid module name', async () => {
      // Arrange
      mockRequest.params = { moduleName: 'invalid-module' };

      // Act
      await IntegrationController.getSyncStatus(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  /**
   * ==================== CONFIGURATION TESTS ====================
   */
  describe('GET /api/integration/config', () => {
    it('should return integration configuration', async () => {
      // Arrange
      IntegrationService.getGLConfiguration.mockResolvedValue({
        modules: {
          inventory: { accountCode: '1200' },
          sales: { accountCode: '4100' },
          payroll: { accountCode: '6100' },
          manufacturing: { accountCode: '1400' },
          purchase: { accountCode: '1200' },
        },
      });

      // Act
      await IntegrationController.getConfiguration(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          modules: expect.any(Object),
        })
      );
    });
  });

  /**
   * ==================== CONFIGURATION UPDATE TESTS ====================
   */
  describe('PUT /api/integration/config', () => {
    it('should update integration configuration', async () => {
      // Arrange
      mockRequest.body = {
        moduleName: 'inventory',
        accountCode: '1250',
        batchSize: 100,
      };
      IntegrationService.updateGLConfiguration.mockResolvedValue({
        success: true,
        configuration: {
          moduleName: 'inventory',
          accountCode: '1250',
        },
      });

      // Act
      await IntegrationController.updateConfiguration(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should validate required fields in config update', async () => {
      // Arrange
      mockRequest.body = {
        // Missing required fields
      };

      // Act
      await IntegrationController.updateConfiguration(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  /**
   * ==================== TEST ENDPOINT TESTS ====================
   */
  describe('POST /api/integration/test', () => {
    it('should run integration test successfully', async () => {
      // Arrange
      IntegrationService.runIntegrationTest.mockResolvedValue({
        success: true,
        testResults: {
          inventorySync: 'PASSED',
          salesSync: 'PASSED',
          payrollSync: 'PASSED',
          manufacturingSync: 'PASSED',
          purchaseSync: 'PASSED',
        },
      });

      // Act
      await IntegrationController.testIntegration(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });
  });
});
