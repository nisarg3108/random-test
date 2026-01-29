import prisma from '../../config/db.js';

export const createTask = async (data, assignerId, tenantId) => {
  let assigner = await prisma.employee.findFirst({
    where: { userId: assignerId, tenantId },
    select: { id: true }
  });

  // If no employee record exists, create one for the user
  if (!assigner) {
    const user = await prisma.user.findUnique({
      where: { id: assignerId },
      select: { email: true, departmentId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create employee record for the user
    assigner = await prisma.employee.create({
      data: {
        tenantId,
        userId: assignerId,
        departmentId: user.departmentId || (await getDefaultDepartment(tenantId)),
        employeeCode: `EMP${Date.now()}`,
        name: user.email.split('@')[0],
        email: user.email,
        designation: 'Manager',
        joiningDate: new Date(),
        status: 'ACTIVE'
      },
      select: { id: true }
    });
  }

  const task = await prisma.task.create({
    data: {
      ...data,
      assignedBy: assigner.id,
      tenantId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null
    }
  });

  // Create notification for employee
  await prisma.notification.create({
    data: {
      tenantId,
      employeeId: data.employeeId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${data.title}`
    }
  });

  return task;
};

export const getTasksByManager = async (managerId, tenantId) => {
  const manager = await prisma.employee.findFirst({
    where: { userId: managerId, tenantId },
    select: { id: true }
  });

  if (!manager) {
    throw new Error('Manager not found');
  }

  return prisma.task.findMany({
    where: { assignedBy: manager.id, tenantId },
    include: {
      employee: {
        select: {
          name: true,
          designation: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createSalaryStructure = async (data, tenantId) => {
  const { employeeId, basicSalary, allowances, deductions } = data;
  
  // Calculate net salary
  const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
  const netSalary = basicSalary + totalAllowances - totalDeductions;

  return prisma.salaryStructure.upsert({
    where: { employeeId },
    update: {
      basicSalary,
      allowances,
      deductions,
      netSalary,
      effectiveFrom: new Date(data.effectiveFrom)
    },
    create: {
      tenantId,
      employeeId,
      basicSalary,
      allowances,
      deductions,
      netSalary,
      effectiveFrom: new Date(data.effectiveFrom)
    }
  });
};

export const getTeamTasks = async (managerId, tenantId) => {
  const manager = await prisma.employee.findFirst({
    where: { userId: managerId, tenantId },
    include: {
      reports: {
        select: { id: true }
      }
    }
  });

  if (!manager) {
    throw new Error('Manager not found');
  }

  const teamEmployeeIds = manager.reports.map(emp => emp.id);

  return prisma.task.findMany({
    where: {
      employeeId: { in: teamEmployeeIds },
      tenantId
    },
    include: {
      employee: {
        select: {
          name: true,
          designation: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const getDefaultDepartment = async (tenantId) => {
  let department = await prisma.department.findFirst({
    where: { tenantId },
    select: { id: true }
  });

  if (!department) {
    department = await prisma.department.create({
      data: {
        tenantId,
        name: 'General'
      },
      select: { id: true }
    });
  }

  return department.id;
};

export const createNotification = async (data, tenantId) => {
  return prisma.notification.create({
    data: {
      ...data,
      tenantId
    }
  });
};