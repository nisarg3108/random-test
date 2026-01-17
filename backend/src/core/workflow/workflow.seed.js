import prisma from '../../config/db.js';

export const seedInventoryWorkflow = async (tenantId) => {
  return prisma.workflow.create({
    data: {
      tenantId,
      module: 'INVENTORY',
      action: 'STOCK_REQUEST',
      steps: {
        create: [
          {
            stepOrder: 1,
            permission: 'inventory.approve',
          },
        ],
      },
    },
  });
};

export const seedFinanceExpenseWorkflow = async (tenantId) => {
  return prisma.workflow.create({
    data: {
      tenantId,
      module: 'FINANCE',
      action: 'EXPENSE_CLAIM',
      steps: {
        create: [
          {
            stepOrder: 1,
            permission: 'expense.approve',
          },
        ],
      },
    },
  });
};