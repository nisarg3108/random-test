import bcrypt from 'bcrypt';
import prisma from '../../config/db.js';
import emailService from '../../services/email.service.js';

export const createEmployee = async (data, tenantId) => {
  // Validate department exists
  const department = await prisma.department.findFirst({
    where: { id: data.departmentId, tenantId },
  });
  
  if (!department) {
    throw new Error('Department not found');
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
      departmentId: data.departmentId,
    },
  });

  // Create employee linked to user
  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      name: `${data.firstName} ${data.lastName}`,
      email: employeeEmail,
      designation: data.position,
      departmentId: data.departmentId,
      managerId: data.managerId || null,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
      status: 'ACTIVE',
      tenantId,
      userId: user.id,
    },
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
    where: { userId, tenantId },
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
      LeaveRequest: {
        where: { status: 'PENDING' },
        include: {
          leaveType: true
        }
      },
    },
  });
};
