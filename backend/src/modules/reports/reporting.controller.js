import reportingService from './reporting.service.js';

// Financial Reports

export const getIncomeStatement = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const tenantId = req.user.tenantId;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    const statement = await reportingService.getIncomeStatement(fromDate, toDate, tenantId);
    res.json(statement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBalanceSheet = async (req, res) => {
  try {
    const { asOfDate } = req.query;
    const tenantId = req.user.tenantId;

    if (!asOfDate) {
      return res.status(400).json({ error: 'asOfDate is required' });
    }

    const statement = await reportingService.getBalanceSheet(asOfDate, tenantId);
    res.json(statement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Inventory Reports

export const getInventorySummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const summary = await reportingService.getInventorySummary(tenantId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStockMovementReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const tenantId = req.user.tenantId;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    const report = await reportingService.getStockMovementReport(fromDate, toDate, tenantId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manufacturing Reports

export const getProductionReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const tenantId = req.user.tenantId;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    const report = await reportingService.getProductionReport(fromDate, toDate, tenantId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBOMAnalysis = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const analysis = await reportingService.getBOMAnalysis(tenantId);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sales Reports

export const getSalesReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const tenantId = req.user.tenantId;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    const report = await reportingService.getSalesReport(fromDate, toDate, tenantId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dashboard

export const getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const summary = await reportingService.getDashboardSummary(tenantId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Report Scheduling

export const scheduleReport = async (req, res) => {
  try {
    const { reportType, schedule } = req.body;
    const tenantId = req.user.tenantId;

    if (!reportType || !schedule) {
      return res.status(400).json({ error: 'reportType and schedule are required' });
    }

    const report = await reportingService.scheduleReport(reportType, schedule, tenantId);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getScheduledReports = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const reports = await reportingService.getScheduledReports(tenantId);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
