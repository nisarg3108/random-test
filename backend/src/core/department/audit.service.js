import prisma from '../../config/db.js';

export const logAudit = async ({ userId, action, entity, entityId }) => {
  await prisma.auditLog.create({
    data: { userId, action, entity, entityId },
  });
};
