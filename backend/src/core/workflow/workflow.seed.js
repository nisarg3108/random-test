import prisma from '../../config/db.js';

export const seedInventoryWorkflows = async (tenantId) => {
  const workflows = [];
  
  // Create workflow for inventory item creation
  const createWorkflow = await prisma.workflow.create({
    data: {
      tenantId,
      module: 'INVENTORY',
      action: 'CREATE',
      status: 'ACTIVE',
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
  workflows.push(createWorkflow);
  
  // Create workflow for inventory item updates
  const updateWorkflow = await prisma.workflow.create({
    data: {
      tenantId,
      module: 'INVENTORY',
      action: 'UPDATE',
      status: 'ACTIVE',
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
  workflows.push(updateWorkflow);
  
  return workflows;
};

export const seedFinanceExpenseWorkflow = async (tenantId) => {
  return prisma.workflow.create({
    data: {
      tenantId,
      module: 'FINANCE',
      action: 'EXPENSE_CLAIM',
      status: 'ACTIVE',
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

// Legacy function for backward compatibility
export const seedInventoryWorkflow = seedInventoryWorkflows;