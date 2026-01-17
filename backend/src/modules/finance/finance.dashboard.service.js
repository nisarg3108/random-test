import { prisma } from '../../config/database.js';

export const getFinanceDashboard = async (tenantId) => {
  const [pending, approved, totalAmount] = await Promise.all([
    prisma.expenseClaim.count({
      where: { tenantId, status: 'PENDING' },
    }),
    prisma.expenseClaim.count({
      where: { tenantId, status: 'APPROVED' },
    }),
    prisma.expenseClaim.aggregate({
      where: { tenantId, status: 'APPROVED' },
      _sum: { amount: true },
    }),
  ]);

  return {
    pendingClaims: pending,
    approvedClaims: approved,
    totalApprovedAmount: totalAmount._sum.amount || 0,
  };
};
