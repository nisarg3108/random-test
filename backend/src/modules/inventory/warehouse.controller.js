import warehouseService from './warehouse.service.js';

class WarehouseController {
  /**
   * Create warehouse
   */
  async create(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const warehouse = await warehouseService.createWarehouse(req.body, tenantId);
      res.status(201).json(warehouse);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all warehouses
   */
  async getAll(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        branchId: req.query.branchId,
        type: req.query.type,
        search: req.query.search
      };
      
      const warehouses = await warehouseService.getAllWarehouses(tenantId, filters);
      res.json(warehouses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get warehouse by ID
   */
  async getById(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const warehouse = await warehouseService.getWarehouseById(req.params.id, tenantId);
      res.json(warehouse);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * Update warehouse
   */
  async update(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body, tenantId);
      res.json(warehouse);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete warehouse
   */
  async delete(req, res) {
    try {
      const tenantId = req.user.tenantId;
      await warehouseService.deleteWarehouse(req.params.id, tenantId);
      res.json({ message: 'Warehouse deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get warehouse statistics
   */
  async getStatistics(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const stats = await warehouseService.getWarehouseStatistics(req.params.id, tenantId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get warehouse stock
   */
  async getStock(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        lowStock: req.query.lowStock === 'true',
        zone: req.query.zone,
        search: req.query.search
      };
      
      const stock = await warehouseService.getWarehouseStock(req.params.id, tenantId, filters);
      res.json(stock);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update warehouse stock
   */
  async updateStock(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const { warehouseId, itemId } = req.params;
      const stock = await warehouseService.updateWarehouseStock(warehouseId, itemId, req.body, tenantId);
      res.json(stock);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const data = {
        ...req.body,
        createdBy: req.user.id
      };
      const transfer = await warehouseService.transferStock(data, tenantId);
      res.status(201).json(transfer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Complete stock transfer
   */
  async completeTransfer(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const transfer = await warehouseService.completeStockTransfer(
        req.params.id,
        tenantId,
        req.user.id
      );
      res.json(transfer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new WarehouseController();
