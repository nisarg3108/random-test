import prisma from '../../config/db.js';

export const createEmployee = async (data, tenantId) => {
  // Validate department exists
  const department = await prisma.department.findFirst({
    where: { id: data.departmentId, tenantId },
  });
  
  if (!department) {
    throw new Error('Department not found');
  }

  // Generate employee code
  const employeeCode = `EMP${Date.now()}`;
  
  return prisma.employee.create({
    data: {
      employeeCode,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      designation: data.position,
      departmentId: data.departmentId,
      managerId: data.managerId || null,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
      status: 'ACTIVE',
      tenantId,
    },
  });
};

export const listEmployees = async (tenantId) => {
  return prisma.employee.findMany({
    where: { tenantId },
    include: {
      department: true,
      manager: true,
    },
  });
};

export const assignManager = async (employeeId, managerId, tenantId) => {
  // Validate manager exists
  const manager = await prisma.employee.findFirst({
    where: { id: managerId, tenantId },
  });
  
  if (!manager) {
    throw new Error('Manager not found');
  }

  return prisma.employee.update({
    where: { id: employeeId, tenantId },
    data: { managerId },
  });
};

export const getTeam = async (managerId, tenantId) => {
  return prisma.employee.findMany({
    where: { managerId, tenantId },
  });
};
export const getManagerDashboard = async (managerId, tenantId) => {
  return prisma.employee.findMany({
    where: { managerId, tenantId },
    include: {
      leaveRequests: true,
    },
  });
};
