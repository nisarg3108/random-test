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


export const createApprovalChain = async (workflowId, steps, actionData = null, workflowRequestId = null) => {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { steps: { orderBy: { stepOrder: 'asc' } } }
  });

  if (!workflow || !workflow.steps || workflow.steps.length === 0) {
    throw new Error('Workflow or workflow steps not found');
  }

  // Create only the first approval step
  const firstStep = workflow.steps[0];
  const approval = await prisma.approval.create({
    data: {
      workflowId,
      workflowRequestId,
      workflowStepId: firstStep.id, // Link to workflow step
      stepOrder: firstStep.stepOrder,
      permission: firstStep.permission,
      status: 'PENDING',
      data: actionData,
      tenantId: workflow.tenantId
    },
  });
  
  console.log('Created approval:', approval.id, 'for workflow:', workflowId, 'request:', workflowRequestId);
  return approval;
};
