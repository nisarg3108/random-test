import prisma from '../../config/db.js';

export const getWorkflowForAction = async (tenantId, module, action) => {
  return await prisma.workflow.findFirst({
    where: {
      tenantId,
      module,
      action,
    },
    include: {
      steps: {
        orderBy: { order: 'asc' }
      }
    }
  });
};