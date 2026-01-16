import prisma from '../../config/db.js';

export const seedInventoryWorkflow = async (tenantId) => {
  return prisma.workflow.create({
    data: {
      tenantId,
      module: 'INVENTORY',
      action: 'CREATE',
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
