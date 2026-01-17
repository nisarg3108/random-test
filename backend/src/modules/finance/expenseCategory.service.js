import prisma from '../../config/db.js';

export const createExpenseCategory = (data, tenantId) => {
  return prisma.expenseCategory.create({
    data: { ...data, tenantId },
  });
};

export const listExpenseCategories = (tenantId) => {
  return prisma.expenseCategory.findMany({
    where: { tenantId },
  });
};
