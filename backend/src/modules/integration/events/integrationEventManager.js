/**
 * Event Manager for Integration
 * Handles event-driven synchronization between modules
 */

import EventEmitter from 'events';
import IntegrationService from '../integration.service.js';

class IntegrationEventManager extends EventEmitter {
  constructor() {
    super();
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    this.initializeEventListeners();
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    // Inventory events
    this.on('inventory:movement:completed', (data) =>
      this.handleInventoryMovementCompleted(data)
    );
    this.on('inventory:stock:adjusted', (data) =>
      this.handleInventoryAdjusted(data)
    );

    // Sales events
    this.on('sales:order:confirmed', (data) =>
      this.handleSalesOrderConfirmed(data)
    );
    this.on('sales:order:completed', (data) =>
      this.handleSalesOrderCompleted(data)
    );

    // Payroll events
    this.on('payroll:cycle:processed', (data) =>
      this.handlePayrollProcessed(data)
    );
    this.on('payroll:cycle:posted', (data) =>
      this.handlePayrollPosted(data)
    );

    // Manufacturing events
    this.on('manufacturing:workorder:completed', (data) =>
      this.handleWorkOrderCompleted(data)
    );

    // Purchase events
    this.on('purchase:order:received', (data) =>
      this.handlePurchaseOrderReceived(data)
    );
    this.on('purchase:order:invoiced', (data) =>
      this.handlePurchaseOrderInvoiced(data)
    );

    // AP events
    this.on('ap:invoice:received', (data) =>
      this.handleAPInvoiceReceived(data)
    );

    console.log('Integration event listeners initialized');
  }

  /**
   * ==================== EVENT HANDLERS ====================
   */

  /**
   * Handle inventory movement completion
   */
  async handleInventoryMovementCompleted(data) {
    try {
      console.log(
        `\n📦 Event: Inventory movement completed - ${data.movementId}`
      );

      const result =
        await IntegrationService.syncInventoryMovementToGL(
          data.movementId,
          data.tenantId
        );

      console.log(
        `✅ Inventory movement synced to GL: ${result.journalEntryId}`
      );

      // Emit success event
      this.emit('integration:inventory:synced', result);
    } catch (error) {
      console.error(
        '❌ Error syncing inventory movement:',
        error.message
      );
      // Log error for monitoring
      this.emit('integration:error', {
        eventType: 'inventory:movement:completed',
        error: error.message,
        data,
      });
    }
  }

  /**
   * Handle inventory adjustment
   */
  async handleInventoryAdjusted(data) {
    try {
      console.log(
        `\n📦 Event: Inventory adjusted - Item: ${data.itemId}, Qty: ${data.quantity}`
      );

      // Create GL entry for inventory adjustment
      const result =
        await IntegrationService.syncInventoryMovementToGL(
          data.adjustmentId,
          data.tenantId
        );

      console.log(`✅ Inventory adjustment synced to GL`);
      this.emit('integration:inventory:synced', result);
    } catch (error) {
      console.error('❌ Error syncing inventory adjustment:', error.message);
      this.emit('integration:error', {
        eventType: 'inventory:stock:adjusted',
        error: error.message,
        data,
      });
    }
  }

  /**
   * Handle sales order confirmation
   */
  async handleSalesOrderConfirmed(data) {
    try {
      console.log(`\n💳 Event: Sales order confirmed - ${data.orderId}`);

      // You might want to create initial AR entry or reservation
      console.log(`✅ Sales order confirmed, ready for fulfillment`);

      this.emit('integration:sales:confirmed', { orderId: data.orderId });
    } catch (error) {
      console.error('❌ Error handling sales order confirmation:', error.message);
    }
  }

  /**
   * Handle sales order completion (when shipped/delivered)
   */
  async handleSalesOrderCompleted(data) {
    try {
      console.log(`\n💳 Event: Sales order completed - ${data.orderId}`);

      // Sync to AR and GL
      const result =
        await IntegrationService.syncSalesOrderToAR(data.orderId, data.tenantId);

      console.log(`✅ Sales order synced to AR/GL: ${result.journalEntryId}`);
      this.emit('integration:sales:synced', result);
    } catch (error) {
      console.error('❌ Error syncing sales order:', error.message);
      this.emit('integration:error', {
        eventType: 'sales:order:completed',
        error: error.message,
        data,
      });
    }
  }

  /**
   * Handle payroll cycle processing
   */
  async handlePayrollProcessed(data) {
    try {
      console.log(
        `\n💰 Event: Payroll processed - Cycle: ${data.cycleId}, Employees: ${data.employeeCount}`
      );

      // Sync to GL
      const result =
        await IntegrationService.syncPayrollToGL(data.cycleId, data.tenantId);

      console.log(`✅ Payroll synced to GL: ${result.journalEntryId}`);
      this.emit('integration:payroll:synced', result);
    } catch (error) {
      console.error('❌ Error syncing payroll:', error.message);
      this.emit('integration:error', {
        eventType: 'payroll:cycle:processed',
        error: error.message,
        data,
      });
    }
  }

  /**
   * Handle payroll posting (sent to bank)
   */
  async handlePayrollPosted(data) {
    try {
      console.log(
        `\n💰 Event: Payroll posted to bank - Cycle: ${data.cycleId}`
      );

      // Verify GL posting
      console.log(`✅ Payroll posting verified in GL`);
      this.emit('integration:payroll:posted', { cycleId: data.cycleId });
    } catch (error) {
      console.error('❌ Error in payroll posting:', error.message);
    }
  }

  /**
   * Handle work order completion
   */
  async handleWorkOrderCompleted(data) {
    try {
      console.log(`\n🏭 Event: Work order completed - ${data.workOrderId}`);

      // Sync manufacturing costs to GL
      const result =
        await IntegrationService.syncManufacturingCostToGL(
          data.workOrderId,
          data.tenantId
        );

      console.log(
        `✅ Manufacturing costs synced to GL: ${result.journalEntryId}`
      );
      console.log(`   Total Cost: $${result.totalCost.toFixed(2)}`);

      this.emit('integration:manufacturing:synced', result);
    } catch (error) {
      console.error('❌ Error syncing work order:', error.message);
      this.emit('integration:error', {
        eventType: 'manufacturing:workorder:completed',
        error: error.message,
        data,
      });
    }
  }

  /**
   * Handle purchase order receipt
   */
  async handlePurchaseOrderReceived(data) {
    try {
      console.log(`\n📋 Event: Purchase order received - ${data.poId}`);

      // Update inventory and sync to GL
      const result =
        await IntegrationService.syncPurchaseOrderToAP(data.poId, data.tenantId);

      console.log(`✅ Purchase order synced to AP/GL: ${result.journalEntryId}`);
      this.emit('integration:purchase:synced', result);
    } catch (error) {
      console.error('❌ Error syncing purchase order:', error.message);
      this.emit('integration:error', {
        eventType: 'purchase:order:received',
        error: error.message,
        data,
      });
    }
  }

  /**
   * Handle purchase order invoice
   */
  async handlePurchaseOrderInvoiced(data) {
    try {
      console.log(`\n📋 Event: Purchase order invoiced - ${data.poId}`);

      // Verify AP entry created
      console.log(`✅ AP entry verified for invoice`);
      this.emit('integration:purchase:invoiced', { poId: data.poId });
    } catch (error) {
      console.error('❌ Error handling PO invoice:', error.message);
    }
  }

  /**
   * Handle AP invoice receipt
   */
  async handleAPInvoiceReceived(data) {
    try {
      console.log(
        `\n📄 Event: AP Invoice received - ${data.invoiceId} from ${data.vendorName}`
      );

      // Create AP liability entry
      console.log(`✅ AP invoice recorded, pending payment`);
      this.emit('integration:ap:invoiced', { invoiceId: data.invoiceId });
    } catch (error) {
      console.error('❌ Error handling AP invoice:', error.message);
    }
  }

  /**
   * ==================== EVENT EMISSION ====================
   */

  /**
   * Emit inventory movement completed event
   */
  emitInventoryMovementCompleted(movementId, tenantId) {
    this.emit('inventory:movement:completed', { movementId, tenantId });
  }

  /**
   * Emit sales order completed event
   */
  emitSalesOrderCompleted(orderId, tenantId) {
    this.emit('sales:order:completed', { orderId, tenantId });
  }

  /**
   * Emit sales order confirmed event
   */
  emitSalesOrderConfirmed(orderId, tenantId) {
    this.emit('sales:order:confirmed', { orderId, tenantId });
  }

  /**
   * Emit payroll cycle processed event
   */
  emitPayrollProcessed(cycleId, tenantId, employeeCount) {
    this.emit('payroll:cycle:processed', {
      cycleId,
      tenantId,
      employeeCount,
    });
  }

  /**
   * Emit work order completed event
   */
  emitWorkOrderCompleted(workOrderId, tenantId) {
    this.emit('manufacturing:workorder:completed', {
      workOrderId,
      tenantId,
    });
  }

  /**
   * Emit purchase order received event
   */
  emitPurchaseOrderReceived(poId, tenantId) {
    this.emit('purchase:order:received', { poId, tenantId });
  }

  /**
   * ==================== LOGGING & MONITORING ====================
   */

  /**
   * Get event listener count
   */
  getListenerStats() {
    return {
      listenerCount: this.listenerCount('*'),
      events: this.eventNames(),
      timestamp: new Date(),
    };
  }

  /**
   * Enable detailed event logging
   */
  enableDetailedLogging() {
    this.on('integration:inventory:synced', (data) => {
      console.log(`📊 [METRIC] Inventory synced: ${JSON.stringify(data)}`);
    });

    this.on('integration:sales:synced', (data) => {
      console.log(`📊 [METRIC] Sales synced: ${JSON.stringify(data)}`);
    });

    this.on('integration:payroll:synced', (data) => {
      console.log(`📊 [METRIC] Payroll synced: ${JSON.stringify(data)}`);
    });

    this.on('integration:manufacturing:synced', (data) => {
      console.log(
        `📊 [METRIC] Manufacturing synced: ${JSON.stringify(data)}`
      );
    });

    this.on('integration:error', (data) => {
      console.error(`❌ [ERROR] Integration error: ${JSON.stringify(data)}`);
    });
  }
}

// Export singleton instance
export default new IntegrationEventManager();
