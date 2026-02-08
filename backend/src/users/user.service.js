import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { realTimeServer } from '../core/realtime.js';

/**
 * Create a user under the same tenant (ADMIN only)
 */
export const createUser = async ({ email, password, role }, tenantId) => {
  if (!email || !password || !role) {
    throw new Error('Missing required fields');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      tenantId,
    }
  });

  // Broadcast real-time update
  realTimeServer.broadcastUserUpdate(tenantId, {
    type: 'USER_CREATED',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
};

/**
 * List users of the same tenant
 */
export const listUsers = async (tenantId) => {
  return prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      department: {
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Update user
 */
export const updateUser = async (userId, data, tenantId) => {
  const user = await prisma.user.update({
    where: { id: userId, tenantId },
    data
  });

  // Broadcast real-time update
  realTimeServer.broadcastUserUpdate(tenantId, {
    type: 'USER_UPDATED',
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    }
  });

  return user;
};

/**
 * Delete user
 */
export const deleteUser = async (userId, tenantId) => {
  // Get employee ID first
  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId }
  });

  if (employee) {
    // Delete all related records in correct order
    await prisma.notification.deleteMany({ where: { employeeId: employee.id } });
    await prisma.workReport.deleteMany({ where: { employeeId: employee.id } });
    await prisma.task.deleteMany({ where: { employeeId: employee.id } });
    await prisma.task.deleteMany({ where: { assignedBy: employee.id } });
    await prisma.expenseClaim.deleteMany({ where: { employeeId: employee.id } });
    await prisma.leaveRequest.deleteMany({ where: { employeeId: employee.id } });
    await prisma.salaryStructure.deleteMany({ where: { employeeId: employee.id } });
    await prisma.timeTracking.deleteMany({ where: { employeeId: employee.id } });
    
    // Update manager references
    await prisma.employee.updateMany({
      where: { managerId: employee.id },
      data: { managerId: null }
    });
    
    // Delete employee
    await prisma.employee.delete({ where: { id: employee.id } });
  }

  // Delete UserRole records
  await prisma.userRole.deleteMany({ where: { userId } });

  // Delete user
  const user = await prisma.user.delete({
    where: { id: userId, tenantId }
  });

  // Broadcast real-time update
  realTimeServer.broadcastUserUpdate(tenantId, {
    type: 'USER_DELETED',
    user: { id: userId }
  });

  return user;
};
