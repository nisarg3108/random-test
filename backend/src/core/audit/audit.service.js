import prisma from '../../config/db.js';

export const logAudit = async ({
  userId,
  tenantId,
  action,
  entity,
  entityId,
  meta = {},
}) => {
  await prisma.auditLog.create({
    data: {
      userId,
      tenantId,
      action,
      entity,
      entityId,
      meta,
    },
  });
};
