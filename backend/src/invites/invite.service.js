import crypto from 'crypto';
import prisma from '../config/db.js';

export const createInvite = async ({ email, role }, tenantId) => {
  if (!email) {
    throw new Error('Email is required');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Check if there's already a pending invite
  const existingInvite = await prisma.userInvite.findFirst({
    where: {
      email,
      used: false,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (existingInvite) {
    throw new Error('An active invitation already exists for this email');
  }

  const token = crypto.randomBytes(32).toString('hex');

  const invite = await prisma.userInvite.create({
    data: {
      email,
      role: role || 'USER',
      token,
      tenantId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  return {
    email: invite.email,
    token: invite.token,
  };
};

export const acceptInvite = async ({ token, password }) => {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const invite = await prisma.userInvite.findUnique({
    where: { token },
  });

  if (!invite || invite.used || invite.expiresAt < new Date()) {
    throw new Error('Invalid or expired invite');
  }

  // Check if user already exists (in case they were created after invite)
  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email }
  });

  if (existingUser) {
    throw new Error('User account already exists');
  }

  return invite;
};
