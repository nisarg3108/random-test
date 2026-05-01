import payrollService from './payroll.service.js';
import { listLeaveRequests } from './leaveRequest.service.js';
import { getEmployeeByUserId } from './employee.service.js';

export const getEmployeeHubData = async (tenantId, userId) => {
  const profile = await getEmployeeByUserId(userId, tenantId);

  const employeeId = profile ? profile.id : null;

  const payslips = employeeId
    ? await payrollService.getPayslips(tenantId, { employeeId })
    : [];

  const leaveRequests = await listLeaveRequests(tenantId, userId);

  // Basic aggregation / counts for quick UI
  const summary = {
    payslipCount: payslips.length,
    leaveRequestCount: leaveRequests.length,
  };

  return {
    profile,
    payslips,
    leaveRequests,
    summary,
  };
};

export default {
  getEmployeeHubData,
};
