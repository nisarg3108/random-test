import prisma from '../../config/db.js';

export const seedTestApprovalData = async (tenantId) => {
  try {
    // Create a test workflow
    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        module: 'INVENTORY',
        action: 'CREATE',
        status: 'ACTIVE'
      }
    });

    // Create workflow steps
    const step1 = await prisma.workflowStep.create({
      data: {
        workflowId: workflow.id,
        stepOrder: 1,
        permission: 'inventory.approve'
      }
    });

    // Create a test approval
    const approval = await prisma.approval.create({
      data: {
        workflowId: workflow.id,
        workflowStepId: step1.id,
        stepOrder: 1,
        permission: 'inventory.approve',
        tenantId,
        status: 'PENDING',
        data: {
          itemName: 'Test Item',
          quantity: 10,
          price: 99.99
        }
      }
    });

    // Create a test workflow request
    const request = await prisma.workflowRequest.create({
      data: {
        tenantId,
        workflowId: workflow.id,
        module: 'INVENTORY',
        action: 'CREATE',
        status: 'PENDING',
        createdBy: 'test-user-id',
        payload: {
          name: 'Test Item',
          quantity: 10,
          price: 99.99
        }
      }
    });

    return { workflow, step1, approval, request };
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
};