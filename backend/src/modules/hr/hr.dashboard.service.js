import prisma from '../../config/db.js';

export const getHRDashboard = async (tenantId) => {
  const [employees, leaves] = await Promise.all([
    prisma.employee.count({ where: { tenantId } }),
    prisma.leaveRequest.count({ where: { tenantId, status: 'PENDING' } }),
  ]);

  return {
    totalEmployees: employees,
    pendingLeaveRequests: leaves,
  };
};
