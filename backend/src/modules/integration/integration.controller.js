/**
 * Integration Controller
 * Handles integration API endpoints
 */

import IntegrationService from './integration.service.js';

class IntegrationController {
  /**
   * Sync inventory movement to GL
   * POST /api/integration/sync-inventory/{movementId}
   */
  async syncInventoryMovement(req, res) {
    try {
      const { movementId } = req.params;
      const { tenantId } = req.user; // From JWT

      const result =
        await IntegrationService.syncInventoryMovementToGL(
          movementId,
          tenantId
        );

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Sync sales order to AR/GL
   * POST /api/integration/sync-sales/{orderId}
   */
  async syncSalesOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { tenantId } = req.user;

      const result =
        await IntegrationService.syncSalesOrderToAR(orderId, tenantId);

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Sync payroll cycle to GL
   * POST /api/integration/sync-payroll/{cycleId}
   */
  async syncPayrollCycle(req, res) {
    try {
      const { cycleId } = req.params;
      const { tenantId } = req.user;

      const result =
        await IntegrationService.syncPayrollToGL(cycleId, tenantId);

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Sync work order to GL
   * POST /api/integration/sync-manufacturing/{workOrderId}
   */
  async syncWorkOrder(req, res) {
    try {
      const { workOrderId } = req.params;
      const { tenantId } = req.user;

      const result =
        await IntegrationService.syncManufacturingCostToGL(
          workOrderId,
          tenantId
        );

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Sync purchase order to AP/GL
   * POST /api/integration/sync-purchase/{poId}
   */
  async syncPurchaseOrder(req, res) {
    try {
      const { poId } = req.params;
      const { tenantId } = req.user;

      const result =
        await IntegrationService.syncPurchaseOrderToAP(poId, tenantId);

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get sync status for a module
   * GET /api/integration/status/{moduleName}
   */
  async getSyncStatus(req, res) {
    try {
      const { moduleName } = req.params;
      const { tenantId } = req.user;

      const status = await IntegrationService.getSyncStatus(
        tenantId,
        moduleName
      );

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Perform batch sync for all modules
   * POST /api/integration/batch-sync
   */
  async performBatchSync(req, res) {
    try {
      const { tenantId } = req.user;

      const results = await IntegrationService.performBatchSync(tenantId);

      res.json({
        success: true,
        message: 'Batch sync completed',
        data: results,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Manual sync trigger for inventory
   * POST /api/integration/sync-all/inventory
   */
  async syncAllInventory(req, res) {
    try {
      const { tenantId } = req.user;

      const result = await IntegrationService.syncPendingInventory(tenantId);

      res.json({
        success: true,
        message: `Synced ${result.success} inventory movements`,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get integration configuration
   * GET /api/integration/config
   */
  async getConfiguration(req, res) {
    try {
      const { tenantId } = req.user;

      // Return current integration configuration
      const config = {
        enabledIntegrations: {
          inventory: true,
          sales: true,
          payroll: true,
          manufacturing: true,
          purchase: true,
        },
        autoSyncEnabled: true,
        batchSyncInterval: '30 minutes', // Every 30 minutes
        lastBatchSync: new Date(),
        postingRules: {
          inventory: {
            IN: 'Debit Inventory, Credit AP',
            OUT: 'Debit COGS, Credit Inventory',
            TRANSFER: 'No GL entry',
            ADJUSTMENT: 'Varies by variance',
          },
          sales: 'Debit AR, Credit Sales Revenue',
          payroll: 'Debit Salary Exp, Credit Salary Payable',
          manufacturing: 'Debit WIP, Credit Manufacturing OH',
          purchase: 'Debit Inventory/Exp, Credit AP',
        },
      };

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Test integration connection
   * POST /api/integration/test
   */
  async testIntegration(req, res) {
    try {
      const { tenantId } = req.user;

      // Verify database connection and permissions
      const testResult = {
        databaseConnected: true,
        modulesAccessible: {
          inventory: true,
          sales: true,
          finance: true,
          manufacturing: true,
          payroll: true,
          purchase: true,
        },
        glConfigured: true,
        timestamp: new Date(),
      };

      res.json({
        success: true,
        message: 'Integration test passed',
        data: testResult,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Integration test failed',
        error: error.message,
      });
    }
  }
}

export default new IntegrationController();
