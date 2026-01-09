import prisma from '../../config/db.js';

export const createDepartment = async ({ name }, tenantId) => {
  if (!name) throw new Error('Department name required');

  return prisma.department.create({
    data: { name, tenantId },
  });
};

export const listDepartments = async (tenantId) => {
  return prisma.department.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
};
