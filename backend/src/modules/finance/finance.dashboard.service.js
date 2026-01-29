import prisma from '../../config/db.js';

export const getFinanceDashboard = async (tenantId) => {
  const [totalClaims, pending, totalAmount, categoriesCount] = await Promise.all([
    prisma.expenseClaim.count({
      where: { tenantId },
    }),
    prisma.expenseClaim.count({
      where: { tenantId, status: 'PENDING' },
    }),
    prisma.expenseClaim.aggregate({
      where: { tenantId, status: 'APPROVED' },
      _sum: { amount: true },
    }),
    prisma.expenseCategory.count({
      where: { tenantId },
    }),
  ]);

  return {
    totalExpenseClaims: totalClaims,
    pendingClaims: pending,
    totalAmount: totalAmount._sum.amount || 0,
    categoriesCount: categoriesCount,
  };
};
