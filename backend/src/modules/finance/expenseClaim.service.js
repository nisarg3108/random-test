import prisma from '../../config/db.js';

export const createExpenseClaim = async (data, tenantId, userId) => {
  const { expenseDate, ...rest } = data;
  
  // Get employee record for the user
  const employee = await prisma.employee.findUnique({
    where: { userId }
  });
  
  if (!employee) {
    throw new Error('Employee record not found for user');
  }
  
  return prisma.expenseClaim.create({
    data: {
      ...rest,
      expenseDate: new Date(expenseDate),
      tenantId,
      employeeId: employee.id,
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
