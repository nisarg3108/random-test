import prisma from '../../config/db.js';

export const createDepartment = async (data, tenantId) => {
  const { name, description, location, managerId, budget } = data;
  
  if (!name) throw new Error('Department name required');

  return prisma.department.create({
    data: { 
      name, 
      description,
      location,
      managerId,
      budget: budget ? parseFloat(budget) : null,
      tenantId 
    },
    include: {
      employees: true
    }
  });
};

export const listDepartments = async (tenantId) => {
  const departments = await prisma.department.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { employees: true }
      },
      employees: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true
        }
      }
    }
  });

  // Transform the response to include employeeCount
  return departments.map(dept => ({
    ...dept,
    employeeCount: dept._count.employees,
    _count: undefined // Remove the _count field from response
  }));
};

export const updateDepartment = async (id, data, tenantId) => {
  const { name, description, location, managerId, budget } = data;
  
  return prisma.department.update({
    where: { id, tenantId },
    data: {
      ...(name && { name }),
      description,
      location,
      managerId,
      budget: budget !== undefined ? (budget ? parseFloat(budget) : null) : undefined,
    },
    include: {
      _count: {
        select: { employees: true }
      }
    }
  });
};

export const deleteDepartment = async (id, tenantId) => {
  // Check if department has employees
  const dept = await prisma.department.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { employees: true }
      }
    }
  });

  if (dept && dept._count.employees > 0) {
    throw new Error('Cannot delete department with existing employees');
  }

  return prisma.department.delete({
    where: { id, tenantId }
  });
};
