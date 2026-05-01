import bcrypt from 'bcrypt';
import prisma from '../../config/db.js';
import emailService from '../../services/email.service.js';

export const createEmployee = async (data, tenantId) => {
  // Validate or create default department
  let departmentId = data.departmentId;
  
  if (departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: departmentId, tenantId },
    });
    
    if (!department) {
      throw new Error('Department not found');
    }
  } else {
    // Use or create a default department
    let defaultDept = await prisma.department.findFirst({
      where: { tenantId },
    });
    
    if (!defaultDept) {
      defaultDept = await prisma.department.create({
        data: {
          tenantId,
          name: 'General',
          description: 'Default department'
        }
      });
    }
    
    departmentId = defaultDept.id;
  }

  // Generate employee email if not provided
  let employeeEmail = data.email;
  if (!employeeEmail) {
    const firstName = data.firstName.toLowerCase().replace(/[^a-z]/g, '');
    const lastName = data.lastName.toLowerCase().replace(/[^a-z]/g, '');
    const domain = process.env.COMPANY_EMAIL_DOMAIN || 'company.com';
    employeeEmail = `${firstName}.${lastName}@${domain}`;
    
    // Check if email already exists and add number if needed
    let counter = 1;
    let baseEmail = employeeEmail;
    while (await prisma.user.findUnique({ where: { email: employeeEmail } })) {
      employeeEmail = baseEmail.replace('@', `${counter}@`);
      counter++;
    }
  }

  // Check if user with email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: employeeEmail }
  });
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Generate employee code and default password
  const employeeCode = `EMP${Date.now()}`;
  const defaultPassword = data.password || `${data.firstName}@${new Date().getFullYear()}`;
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  // Create user first
  const user = await prisma.user.create({
    data: {
      email: employeeEmail,
      password: hashedPassword,
      role: 'EMPLOYEE',
      tenantId,
      ...(data.departmentId && { departmentId: data.departmentId }),
    },
  });

  // Create employee linked to user
  const employeeData = {
    employeeCode,
    name: `${data.firstName} ${data.lastName}`,
    email: employeeEmail,
    designation: data.position,
    joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
    status: 'ACTIVE',
    tenantId,
    userId: user.id,
    departmentId
  };

  if (data.managerId) {
    employeeData.managerId = data.managerId;
  }

  const employee = await prisma.employee.create({
    data: employeeData,
  });

  // Create welcome notification for new employee
  await prisma.notification.create({
    data: {
      tenantId,
      employeeId: employee.id,
      type: 'SYSTEM',
      title: 'Welcome to the Team!',
      message: `Welcome ${employee.name}! Your employee code is ${employeeCode}. Please check your tasks and get started.`
    }
  });

  // Send welcome email with credentials
  try {
    await emailService.sendWelcomeEmail({
      email: employeeEmail,
      name: employee.name,
      employeeCode
    }, defaultPassword);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  return { employee, user, defaultPassword, generatedEmail: !data.email };
};

export const listEmployees = async (tenantId) => {
  return prisma.employee.findMany({
    where: { tenantId },
    include: {
      department: true,
      manager: true,
      salaryStructure: true,
      user: {
        select: {
          email: true,
          status: true,
          role: true
        }
      }
    },
  });
};

export const getEmployeeByUserId = async (userId, tenantId) => {
  return prisma.employee.findFirst({
    where: {
      tenantId,
      userId
    },
    include: {
      department: true,
      manager: true,
      user: {
        select: {
          email: true,
          status: true,
          role: true
        }
      }
    },
  });
};

export const getEmployeeById = async (employeeId, tenantId) => {
  return prisma.employee.findFirst({
    where: {
      tenantId,
      id: employeeId
    },
    include: {
      department: true,
      manager: true,
      user: {
        select: {
          email: true,
          status: true,
          role: true
        }
      }
    },
  });
};

export const deleteEmployee = async (employeeId, tenantId) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
    select: {
      id: true,
      userId: true,
      name: true
    }
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  await prisma.$transaction(async (tx) => {
    // Delete related records
    await tx.notification.deleteMany({ where: { employeeId: employee.id } });
    await tx.workReport.deleteMany({ where: { employeeId: employee.id } });
    await tx.task.deleteMany({ where: { employeeId: employee.id } });
    await tx.task.deleteMany({ where: { assignedBy: employee.id } });
    await tx.expenseClaim.deleteMany({ where: { employeeId: employee.id } });
    await tx.leaveRequest.deleteMany({ where: { employeeId: employee.id } });
    await tx.salaryStructure.deleteMany({ where: { employeeId: employee.id } });
    await tx.timeTracking.deleteMany({ where: { employeeId: employee.id } });
    await tx.attendance.deleteMany({ where: { employeeId: employee.id } });
    await tx.payslip.deleteMany({ where: { employeeId: employee.id } });
    await tx.salaryDisbursement.deleteMany({ where: { employeeId: employee.id } });
    await tx.shiftAssignment.deleteMany({ where: { employeeId: employee.id } });
    await tx.overtimeRecord.deleteMany({ where: { employeeId: employee.id } });
    await tx.attendanceReport.deleteMany({ where: { employeeId: employee.id } });
    await tx.leaveIntegration.deleteMany({ where: { employeeId: employee.id } });
    await tx.assetAllocation.deleteMany({ where: { employeeId: employee.id } });
    await tx.projectMember.deleteMany({ where: { employeeId: employee.id } });
    await tx.projectTimeLog.deleteMany({ where: { employeeId: employee.id } });

    // Remove manager reference from other employees
    await tx.employee.updateMany({
      where: { managerId: employee.id },
      data: { managerId: null }
    });

    // Delete employee
    await tx.employee.delete({ where: { id: employee.id } });

    // Delete associated user account
    if (employee.userId) {
      await tx.userRole.deleteMany({ where: { userId: employee.userId } });
      await tx.user.delete({ where: { id: employee.userId } });
    }
  });

  return employee;
};

export const assignManager = async (employeeId, managerId, tenantId) => {
  // If managerId is provided, validate manager exists and has appropriate role
  if (managerId) {
    const manager = await prisma.employee.findFirst({
      where: { id: managerId, tenantId },
      include: { user: true }
    });
    
    if (!manager) {
      throw new Error('Manager not found');
    }

    // Check if the user has MANAGER or ADMIN role
    if (manager.user && !['MANAGER', 'ADMIN'].includes(manager.user.role)) {
      throw new Error('Selected employee does not have manager privileges. Only users with MANAGER or ADMIN role can be assigned as managers.');
    }
  }

  return prisma.employee.update({
    where: { id: employeeId },
    data: { managerId },
    include: {
      manager: {
        include: { user: true }
      }
    }
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
      LeaveRequest: {
        where: { status: 'PENDING' },
        include: {
          leaveType: true
        }
      },
    },
  });
};
