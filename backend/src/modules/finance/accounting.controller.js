import chartOfAccountsService from './chart-of-accounts.service.js';

class AccountingController {
  // Chart of Accounts
  async createAccount(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const account = await chartOfAccountsService.createAccount(req.body, tenantId);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllAccounts(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        accountType: req.query.accountType,
        category: req.query.category,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search
      };
      const accounts = await chartOfAccountsService.getAllAccounts(tenantId, filters);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAccountById(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const account = await chartOfAccountsService.getAccountById(req.params.id, tenantId);
      res.json(account);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateAccount(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const account = await chartOfAccountsService.updateAccount(req.params.id, req.body, tenantId);
      res.json(account);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const tenantId = req.user.tenantId;
      await chartOfAccountsService.deleteAccount(req.params.id, tenantId);
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAccountBalance(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };
      const balance = await chartOfAccountsService.getAccountBalance(req.params.id, tenantId, filters);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAccountHierarchy(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const hierarchy = await chartOfAccountsService.getAccountHierarchy(tenantId);
      res.json(hierarchy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async initializeDefaultAccounts(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const accounts = await chartOfAccountsService.initializeDefaultAccounts(tenantId);
      res.json(accounts);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AccountingController();
