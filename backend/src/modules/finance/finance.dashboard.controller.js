import { getFinanceDashboard } from './finance.dashboard.service.js';

export const financeDashboardController = async (req, res, next) => {
  try {
    const data = await getFinanceDashboard(req.user.tenantId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};
