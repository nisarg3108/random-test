import branchService from './branch.service.js';

class BranchController {
  async create(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const branch = await branchService.createBranch(req.body, tenantId);
      res.status(201).json(branch);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        type: req.query.type,
        search: req.query.search
      };
      const branches = await branchService.getAllBranches(tenantId, filters);
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const branch = await branchService.getBranchById(req.params.id, tenantId);
      res.json(branch);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getByCode(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const branch = await branchService.getBranchByCode(req.params.code, tenantId);
      res.json(branch);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getMain(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const branch = await branchService.getMainBranch(tenantId);
      if (!branch) {
        return res.status(404).json({ error: 'Main branch not found' });
      }
      res.json(branch);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const branch = await branchService.updateBranch(req.params.id, req.body, tenantId);
      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const tenantId = req.user.tenantId;
      await branchService.deleteBranch(req.params.id, tenantId);
      res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async setAsMain(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const branch = await branchService.setAsMainBranch(req.params.id, tenantId);
      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStatistics(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const stats = await branchService.getBranchStatistics(req.params.id, tenantId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async transferBetweenBranches(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      const transfer = await branchService.transferBetweenBranches(req.body, tenantId, createdBy);
      res.status(201).json(transfer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new BranchController();
