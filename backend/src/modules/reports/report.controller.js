import {
  generateProfitLossReport,
  generateBalanceSheetReport,
  generateHRAnalyticsReport,
  generateInventoryReport,
  executeCustomReport,
  createReportTemplate,
  listReportTemplates,
  getReportTemplate,
  saveReport,
  listReports,
  getReport,
} from './report.service.js';
import { exportToExcel } from './export.excel.js';
import { exportToPDF } from './export.pdf.js';
import { logAudit } from '../../core/audit/audit.service.js';

// ==================== FINANCIAL REPORTS ====================

export const getProfitLossReportController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { tenantId, userId } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const report = await generateProfitLossReport(tenantId, startDate, endDate);

    await logAudit({
      userId,
      tenantId,
      action: 'GENERATE',
      entity: 'REPORT',
      entityId: 'profit-loss',
      metadata: { startDate, endDate },
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
};

export const getBalanceSheetReportController = async (req, res, next) => {
  try {
    const { asOfDate } = req.query;
    const { tenantId, userId } = req.user;

    const date = asOfDate || new Date().toISOString().split('T')[0];
    const report = await generateBalanceSheetReport(tenantId, date);

    await logAudit({
      userId,
      tenantId,
      action: 'GENERATE',
      entity: 'REPORT',
      entityId: 'balance-sheet',
      metadata: { asOfDate: date },
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// ==================== HR REPORTS ====================

export const getHRAnalyticsReportController = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { tenantId, userId } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const report = await generateHRAnalyticsReport(tenantId, startDate, endDate);

    await logAudit({
      userId,
      tenantId,
      action: 'GENERATE',
      entity: 'REPORT',
      entityId: 'hr-analytics',
      metadata: { startDate, endDate },
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// ==================== INVENTORY REPORTS ====================

export const getInventoryReportController = async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;

    const report = await generateInventoryReport(tenantId);

    await logAudit({
      userId,
      tenantId,
      action: 'GENERATE',
      entity: 'REPORT',
      entityId: 'inventory',
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// ==================== CUSTOM REPORTS ====================

export const executeCustomReportController = async (req, res, next) => {
  try {
    const { config } = req.body;
    const { tenantId, userId } = req.user;

    if (!config || !config.dataSource) {
      return res.status(400).json({ message: 'Report configuration is required' });
    }

    const report = await executeCustomReport(tenantId, config);

    await logAudit({
      userId,
      tenantId,
      action: 'GENERATE',
      entity: 'REPORT',
      entityId: 'custom',
      metadata: { dataSource: config.dataSource },
    });

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// ==================== REPORT TEMPLATES ====================

export const createReportTemplateController = async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;

    const template = await createReportTemplate(req.body, tenantId, userId);

    await logAudit({
      userId,
      tenantId,
      action: 'CREATE',
      entity: 'REPORT_TEMPLATE',
      entityId: template.id,
    });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

export const listReportTemplatesController = async (req, res, next) => {
  try {
    const { type } = req.query;
    const { tenantId } = req.user;

    const templates = await listReportTemplates(tenantId, type);
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

export const getReportTemplateController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const template = await getReportTemplate(id, tenantId);
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (err) {
    next(err);
  }
};

// ==================== SAVED REPORTS ====================

export const saveReportController = async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;

    const report = await saveReport(req.body, tenantId, userId);

    await logAudit({
      userId,
      tenantId,
      action: 'CREATE',
      entity: 'REPORT',
      entityId: report.id,
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};

export const listReportsController = async (req, res, next) => {
  try {
    const { type } = req.query;
    const { tenantId } = req.user;

    const reports = await listReports(tenantId, type);
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const getReportController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const report = await getReport(id, tenantId);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
};

// ==================== EXPORT FUNCTIONALITY ====================

export const exportReportController = async (req, res, next) => {
  try {
    const { format, reportType, reportName } = req.query;
    const { tenantId, userId } = req.user;

    // Get report data based on type
    let reportData;
    let name = reportName || 'Report';

    switch (reportType) {
      case 'profit-loss':
        const { startDate: plStart, endDate: plEnd } = req.query;
        reportData = {
          type: 'FINANCIAL',
          data: await generateProfitLossReport(tenantId, plStart, plEnd),
        };
        name = 'Profit & Loss Report';
        break;

      case 'balance-sheet':
        const { asOfDate } = req.query;
        reportData = {
          type: 'FINANCIAL',
          data: await generateBalanceSheetReport(tenantId, asOfDate || new Date().toISOString().split('T')[0]),
        };
        name = 'Balance Sheet Report';
        break;

      case 'hr-analytics':
        const { startDate: hrStart, endDate: hrEnd } = req.query;
        reportData = {
          type: 'HR',
          data: await generateHRAnalyticsReport(tenantId, hrStart, hrEnd),
        };
        name = 'HR Analytics Report';
        break;

      case 'inventory':
        reportData = {
          type: 'INVENTORY',
          data: await generateInventoryReport(tenantId),
        };
        name = 'Inventory Report';
        break;

      case 'custom':
        const { config } = req.body;
        reportData = {
          type: 'CUSTOM',
          data: await executeCustomReport(tenantId, config),
        };
        name = config.name || 'Custom Report';
        break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    let buffer;
    let contentType;
    let filename;

    if (format === 'excel') {
      buffer = await exportToExcel(reportData, name);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `${name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    } else if (format === 'pdf') {
      buffer = await exportToPDF(reportData, name);
      contentType = 'application/pdf';
      filename = `${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    } else {
      return res.status(400).json({ message: 'Invalid export format. Use "excel" or "pdf"' });
    }

    await logAudit({
      userId,
      tenantId,
      action: 'EXPORT',
      entity: 'REPORT',
      entityId: reportType,
      metadata: { format, reportName: name },
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
