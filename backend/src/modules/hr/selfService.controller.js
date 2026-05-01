import selfServiceService from './selfService.service.js';

export const getMySalaryInfoController = async (req, res, next) => {
  try {
    const data = await selfServiceService.getMySalaryInfo(req.user.id, req.user.tenantId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getMyPayslipsController = async (req, res, next) => {
  try {
    const payslips = await selfServiceService.getMyPayslips(req.user.id, req.user.tenantId, req.query);
    res.json(payslips);
  } catch (error) {
    next(error);
  }
};

export const downloadPayslipController = async (req, res, next) => {
  try {
    const payslip = await selfServiceService.downloadPayslip(req.params.id, req.user.id, req.user.tenantId);
    res.json(payslip);
  } catch (error) {
    next(error);
  }
};

export const getMyLeaveBalanceController = async (req, res, next) => {
  try {
    const balance = await selfServiceService.getMyLeaveBalance(req.user.id, req.user.tenantId);
    res.json(balance);
  } catch (error) {
    next(error);
  }
};

export const getMyAttendanceSummaryController = async (req, res, next) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    const data = await selfServiceService.getMyAttendanceSummary(
      req.user.id, 
      req.user.tenantId, 
      parseInt(month), 
      parseInt(year)
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};
