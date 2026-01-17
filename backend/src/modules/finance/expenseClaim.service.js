import prisma from '../../config/db.js';

export const createExpenseClaim = async (data, tenantId) => {
  const { expenseDate, ...rest } = data;
  
  return prisma.expenseClaim.create({
    data: {
      ...rest,
      expenseDate: new Date(expenseDate),
      tenantId,
      status: 'PENDING',
    },
  });
};

export const listExpenseClaims = async (tenantId) => {
  return prisma.expenseClaim.findMany({
    where: { tenantId },
    include: {
      employee: true,
      category: true,
    },
  });
};
export const getEmployeeExpenses = async (employeeId, tenantId) => {
  return prisma.expenseClaim.findMany({
    where: { employeeId, tenantId },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
};
