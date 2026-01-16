import prisma from '../../config/db.js';

export const seedLeaveRequestWorkflow = async (tenantId) => {
  const existing = await prisma.workflow.findFirst({
    where: {
      tenantId,
      module: 'HR',
      action: 'LEAVE_REQUEST',
    },
  });

  if (existing) return;

  await prisma.workflow.create({
    data: {
      tenantId,
      module: 'HR',
      action: 'LEAVE_REQUEST',
      steps: {
        create: [
          {
            stepOrder: 1,
            permission: 'leave.approve',
          },
        ],
      },
    },
  });

  console.log('✅ HR Leave Request workflow seeded');
};
