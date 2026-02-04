import bomService from './bom.service.js';
import workOrderService from './work-order.service.js';

class ManufacturingController {
  // BOM Controllers
  async createBOM(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      const bom = await bomService.createBOM(req.body, tenantId, createdBy);
      res.status(201).json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllBOMs(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        productId: req.query.productId,
        status: req.query.status,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isDefault: req.query.isDefault === 'true' ? true : req.query.isDefault === 'false' ? false : undefined,
        search: req.query.search
      };
      const boms = await bomService.getAllBOMs(tenantId, filters);
      res.json(boms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBOMById(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const bom = await bomService.getBOMById(req.params.id, tenantId);
      res.json(bom);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getDefaultBOM(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const bom = await bomService.getDefaultBOM(req.params.productId, tenantId);
      if (!bom) {
        return res.status(404).json({ error: 'Default BOM not found' });
      }
      res.json(bom);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateBOM(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const bom = await bomService.updateBOM(req.params.id, req.body, tenantId);
      res.json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async setAsDefault(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const bom = await bomService.setAsDefault(req.params.id, tenantId);
      res.json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async activateBOM(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const bom = await bomService.activateBOM(req.params.id, tenantId);
      res.json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async archiveBOM(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const bom = await bomService.archiveBOM(req.params.id, tenantId);
      res.json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteBOM(req, res) {
    try {
      const tenantId = req.user.tenantId;
      await bomService.deleteBOM(req.params.id, tenantId);
      res.json({ message: 'BOM deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async cloneBOM(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      const { newVersion } = req.body;
      const bom = await bomService.cloneBOM(req.params.id, tenantId, newVersion, createdBy);
      res.status(201).json(bom);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Work Order Controllers
  async createWorkOrder(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      const wo = await workOrderService.createWorkOrder(req.body, tenantId, createdBy);
      res.status(201).json(wo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllWorkOrders(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        productId: req.query.productId,
        assignedTo: req.query.assignedTo,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        search: req.query.search
      };
      const workOrders = await workOrderService.getAllWorkOrders(tenantId, filters);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWorkOrderById(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const wo = await workOrderService.getWorkOrderById(req.params.id, tenantId);
      res.json(wo);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateWorkOrder(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const wo = await workOrderService.updateWorkOrder(req.params.id, req.body, tenantId);
      res.json(wo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async planWorkOrder(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const wo = await workOrderService.planWorkOrder(req.params.id, tenantId);
      res.json(wo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async startWorkOrder(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const wo = await workOrderService.startWorkOrder(req.params.id, tenantId);
      res.json(wo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async completeWorkOrder(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const completedBy = req.user.id;
      const wo = await workOrderService.completeWorkOrder(req.params.id, req.body, tenantId, completedBy);
      res.json(wo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async cancelWorkOrder(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const wo = await workOrderService.cancelWorkOrder(req.params.id, tenantId);
      res.json(wo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getWorkOrderStatistics(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };
      const stats = await workOrderService.getWorkOrderStatistics(tenantId, filters);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWorkOrderDashboard(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const data = await workOrderService.getWorkOrderDashboard(tenantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Operations
  async addOperation(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const operation = await workOrderService.addOperation(req.params.workOrderId, req.body, tenantId);
      res.status(201).json(operation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateOperation(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const operation = await workOrderService.updateOperation(req.params.operationId, req.body, tenantId);
      res.json(operation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async startOperation(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const operation = await workOrderService.startOperation(req.params.operationId, tenantId);
      res.json(operation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async completeOperation(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const operation = await workOrderService.completeOperation(req.params.operationId, req.body, tenantId);
      res.json(operation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Materials
  async addMaterialRequirement(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const material = await workOrderService.addMaterialRequirement(req.params.workOrderId, req.body, tenantId);
      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async issueMaterial(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const issuedBy = req.user.id;
      const material = await workOrderService.issueMaterial(req.params.materialId, req.body, tenantId, issuedBy);
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async consumeMaterial(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const material = await workOrderService.consumeMaterial(req.params.materialId, req.body, tenantId);
      res.json(material);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new ManufacturingController();
