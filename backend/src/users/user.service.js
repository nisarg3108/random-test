import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { realTimeServer } from '../core/realtime.js';

/**
 * Create a user under the same tenant (ADMIN only)
 */
export const createUser = async ({ email, password, firstName, lastName, roleId }, tenantId) => {
  if (!email || !password || !firstName || !lastName || !roleId) {
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
      firstName,
      lastName,
      roleId,
      tenantId,
    },
    include: {
      role: { select: { name: true } }
    }
  });

  // Broadcast real-time update
  realTimeServer.broadcastUserUpdate(tenantId, {
    type: 'USER_CREATED',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    }
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
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
      firstName: true,
      lastName: true,
      role: { select: { name: true } },
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
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
    data,
    include: {
      role: { select: { name: true } }
    }
  });

  // Broadcast real-time update
  realTimeServer.broadcastUserUpdate(tenantId, {
    type: 'USER_UPDATED',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      updatedAt: user.updatedAt
    }
  });

  return user;
};

/**
 * Delete user
 */
export const deleteUser = async (userId, tenantId) => {
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
