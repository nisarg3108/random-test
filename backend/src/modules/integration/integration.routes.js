/**
 * Integration Routes
 * API endpoints for cross-module synchronization
 */

import express from 'express';
import IntegrationController from './integration.controller.js';
import { requireAuth } from '../../core/auth/auth.middleware.js';

const router = express.Router();

/**
 * Sync Operations - Individual
 */

// Inventory sync
router.post(
  '/sync-inventory/:movementId',
  requireAuth,
  (req, res) => IntegrationController.syncInventoryMovement(req, res)
);

// Sales sync
router.post(
  '/sync-sales/:orderId',
  requireAuth,
  (req, res) => IntegrationController.syncSalesOrder(req, res)
);

// Payroll sync
router.post(
  '/sync-payroll/:cycleId',
  requireAuth,
  (req, res) => IntegrationController.syncPayrollCycle(req, res)
);

// Manufacturing sync
router.post(
  '/sync-manufacturing/:workOrderId',
  requireAuth,
  (req, res) => IntegrationController.syncWorkOrder(req, res)
);

// Purchase sync
router.post(
  '/sync-purchase/:poId',
  requireAuth,
  (req, res) => IntegrationController.syncPurchaseOrder(req, res)
);

/**
 * Batch Operations
 */

// Batch sync all modules
router.post(
  '/batch-sync',
  requireAuth,
  (req, res) => IntegrationController.performBatchSync(req, res)
);

// Batch sync specific module
router.post(
  '/sync-all/:moduleName',
  requireAuth,
  (req, res) => {
    const { moduleName } = req.params;
    switch (moduleName) {
      case 'inventory':
        return IntegrationController.syncAllInventory(req, res);
      // Add more module-specific handlers as needed
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown module: ${moduleName}`,
        });
    }
  }
);

/**
 * Status & Monitoring
 */

// Get sync status for a module
router.get(
  '/status/:moduleName',
  requireAuth,
  (req, res) => IntegrationController.getSyncStatus(req, res)
);

// Get all integration configuration
router.get(
  '/config',
  requireAuth,
  (req, res) => IntegrationController.getConfiguration(req, res)
);

// Test integration
router.post(
  '/test',
  requireAuth,
  (req, res) => IntegrationController.testIntegration(req, res)
);

export default router;
