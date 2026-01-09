import bcrypt from 'bcrypt';
import prisma from '../../config/db.js';
import { signToken } from '../../shared/utils/jwt.js';

/**
 * Register user logic
 */
export const registerUser = async ({ email, password, role, companyName }) => {
  if (!email || !password || !companyName) {
    throw new Error('Missing required fields');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // 1️⃣ Create Tenant (Company)
  const tenant = await prisma.tenant.create({
    data: {
      name: companyName,
    },
  });

  // 2️⃣ Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3️⃣ Create Admin User under Tenant
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: role || 'ADMIN',
      tenantId: tenant.id,
    },
  });

  // 4️⃣ Generate JWT
  const token = signToken({
    userId: user.id,
    tenantId: tenant.id,
    role: user.role,
  });

  return {
    message: 'Tenant and admin user created successfully',
    token,
  };
};

/**
 * Login user logic
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password required');
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
  });

  return {
    message: 'Login successful',
    token,
  };
};
