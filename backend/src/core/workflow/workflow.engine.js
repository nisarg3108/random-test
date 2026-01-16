import prisma from '../../config/db.js';

export const getWorkflowForAction = async (
  tenantId,
  module,
  action
) => {
  return prisma.workflow.findFirst({
    where: {
      tenantId,
      module,
      action,
    },
    include: {
  steps: true,
},

  });
};


export const createApprovalChain = async (workflowId, steps, actionData = null) => {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: { orderBy: { stepOrder: 'asc' } } }
  });

  // Create only the first approval step
  const firstStep = workflow.steps[0];
  await prisma.approval.create({
    data: {
      workflowId,
      stepOrder: firstStep.stepOrder,
      permission: firstStep.permission,
      status: 'PENDING',
      data: actionData,
      tenantId: workflow.tenantId
    },
  });
};
