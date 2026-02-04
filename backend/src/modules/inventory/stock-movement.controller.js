import stockMovementService from './stock-movement.service.js';

class StockMovementController {
  /**
   * Create stock movement
   */
  async create(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      const movement = await stockMovementService.createMovement(req.body, tenantId, createdBy);
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all stock movements
   */
  async getAll(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        type: req.query.type,
        status: req.query.status,
        warehouseId: req.query.warehouseId,
        itemId: req.query.itemId,
        referenceType: req.query.referenceType,
        referenceId: req.query.referenceId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        search: req.query.search
      };

      const movements = await stockMovementService.getAllMovements(tenantId, filters);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get movement by ID
   */
  async getById(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const movement = await stockMovementService.getMovementById(req.params.id, tenantId);
      res.json(movement);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * Update stock movement
   */
  async update(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const movement = await stockMovementService.updateMovement(req.params.id, req.body, tenantId);
      res.json(movement);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Approve stock movement
   */
  async approve(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const approvedBy = req.user.id;
      const movement = await stockMovementService.approveMovement(req.params.id, tenantId, approvedBy);
      res.json(movement);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Cancel stock movement
   */
  async cancel(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const movement = await stockMovementService.cancelMovement(req.params.id, tenantId);
      res.json(movement);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get stock movement statistics
   */
  async getStatistics(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        warehouseId: req.query.warehouseId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const stats = await stockMovementService.getMovementStatistics(tenantId, filters);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new StockMovementController();
