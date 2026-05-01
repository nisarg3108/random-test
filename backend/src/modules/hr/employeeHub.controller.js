import employeeHubService from './employeeHub.service.js';

export const getEmployeeHubController = async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const data = await employeeHubService.getEmployeeHubData(tenantId, userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export default {
  getEmployeeHubController,
};
