import prisma from '../../config/db.js';

export const createExpenseCategory = (data, tenantId) => {
  const categoryData = {
    name: data.name,
    tenantId,
    code: data.code || data.name.toUpperCase().replace(/\s+/g, '_')
  };
  return prisma.expenseCategory.create({
    data: categoryData,
  });
};

export const listExpenseCategories = (tenantId) => {
  return prisma.expenseCategory.findMany({
    where: { tenantId },
  });
};
