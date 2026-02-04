import journalEntryService from './journal-entry.service.js';

class JournalController {
  async createJournalEntry(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const createdBy = req.user.id;
      const entry = await journalEntryService.createJournalEntry(req.body, tenantId, createdBy);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllJournalEntries(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        status: req.query.status,
        type: req.query.type,
        referenceType: req.query.referenceType,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        search: req.query.search
      };
      const entries = await journalEntryService.getAllJournalEntries(tenantId, filters);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJournalEntryById(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const entry = await journalEntryService.getJournalEntryById(req.params.id, tenantId);
      res.json(entry);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateJournalEntry(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const entry = await journalEntryService.updateJournalEntry(req.params.id, req.body, tenantId);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async postJournalEntry(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const postedBy = req.user.id;
      const entry = await journalEntryService.postJournalEntry(req.params.id, tenantId, postedBy);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async reverseJournalEntry(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const reversedBy = req.user.id;
      const { reason } = req.body;
      const entry = await journalEntryService.reverseJournalEntry(req.params.id, tenantId, reversedBy, reason);
      res.json(entry);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteJournalEntry(req, res) {
    try {
      const tenantId = req.user.tenantId;
      await journalEntryService.deleteJournalEntry(req.params.id, tenantId);
      res.json({ message: 'Journal entry deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getJournalStatistics(req, res) {
    try {
      const tenantId = req.user.tenantId;
      const filters = {
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };
      const stats = await journalEntryService.getJournalStatistics(tenantId, filters);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new JournalController();
