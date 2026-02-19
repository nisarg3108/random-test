import bcrypt from 'bcrypt';
import prisma from '../../config/db.js';
import { signToken } from '../../shared/utils/jwt.js';
import { syncCompanyModulesFromSubscription } from '../../modules/subscription/subscription.utils.js';

const DEFAULT_PLAN_NAME = process.env.DEFAULT_PLAN || 'Starter Monthly';
const DEFAULT_CUSTOM_MODULE_PRICE = Number(process.env.CUSTOM_MODULE_TEST_PRICE || 10);
const PENDING_REGISTRATION_TTL_HOURS = Number(process.env.PENDING_REGISTRATION_TTL_HOURS || 24);

const resolvePeriodEnd = (billingCycle) => {
  const now = new Date();
  const end = new Date(now.getTime());

  if (billingCycle === 'YEARLY') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return end;
};

const normalizeModuleKeys = (modules) => {
  if (!Array.isArray(modules)) return [];

  return Array.from(
    new Set(
      modules
        .filter(Boolean)
        .map((moduleKey) => String(moduleKey).trim().toUpperCase())
        .filter((moduleKey) => moduleKey.length > 0)
    )
  );
};

const getOrCreateCustomPlan = async (billingCycle = 'MONTHLY') => {
  const planName = billingCycle === 'YEARLY' ? 'Custom Yearly' : 'Custom Monthly';

  const existing = await prisma.plan.findUnique({
    where: { name: planName }
  });

  if (existing) return existing;

  return prisma.plan.create({
    data: {
      name: planName,
      description: 'Custom plan with selected modules.',
      billingCycle,
      currency: 'USD',
      basePrice: 0,
      seatPrice: 0,
      isActive: false
    }
  });
};

const createSubscriptionForTenant = async ({
  tenantId,
  plan,
  items,
  provider = 'MANUAL',
  statusOverride
}) => {
  const periodEnd = resolvePeriodEnd(plan.billingCycle);
  const normalizedItems = Array.isArray(items)
    ? items
        .filter((item) => item && item.moduleKey)
        .map((item) => ({
          moduleKey: String(item.moduleKey).trim().toUpperCase(),
          unitPrice: Number(item.unitPrice || 0)
        }))
        .filter((item) => item.moduleKey.length > 0)
    : [];

  const subscription = await prisma.subscription.create({
    data: {
      tenantId,
      planId: plan.id,
      status: statusOverride || (provider && provider !== 'MANUAL' ? 'PAST_DUE' : 'ACTIVE'),
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      provider
    }
  });

  if (normalizedItems.length > 0) {
    await prisma.subscriptionItem.createMany({
      data: normalizedItems.map((item) => ({
        subscriptionId: subscription.id,
        moduleKey: item.moduleKey,
        quantity: 1,
        unitPrice: item.unitPrice
      }))
    });
  }

  return subscription;
};

const resolvePlanAndItems = async ({ planId, customModules, billingCycle }) => {
  const normalizedCustomModules = normalizeModuleKeys(customModules);
  let plan = null;

  if (normalizedCustomModules.length > 0) {
    plan = await getOrCreateCustomPlan(billingCycle);
  } else if (planId) {
    plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { modules: true }
    });
  } else {
    plan = await prisma.plan.findUnique({
      where: { name: DEFAULT_PLAN_NAME },
      include: { modules: true }
    });
  }

  if (!plan) {
    throw new Error('Selected plan not found');
  }

  const items = normalizedCustomModules.length > 0
    ? normalizedCustomModules.map((moduleKey) => ({
        moduleKey,
        unitPrice: DEFAULT_CUSTOM_MODULE_PRICE
      }))
    : (plan.modules || [])
        .filter((module) => module.included)
        .map((module) => ({
          moduleKey: module.moduleKey,
          unitPrice: module.price
        }));

  return { plan, items, normalizedCustomModules };
};

export const createPendingRegistration = async ({
  email,
  password,
  companyName,
  planId,
  customModules,
  billingCycle,
  provider
}) => {
  if (!email || !password || !companyName) {
    throw new Error('Missing required fields');
  }

  if (!provider || !['STRIPE', 'RAZORPAY'].includes(String(provider).toUpperCase())) {
    throw new Error('Unsupported billing provider');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const { plan, items, normalizedCustomModules } = await resolvePlanAndItems({
    planId,
    customModules,
    billingCycle
  });

  const totalItems = items.reduce((sum, item) => sum + Number(item.unitPrice || 0), 0);
  const amount = normalizedCustomModules.length > 0
    ? totalItems
    : Number(plan.basePrice || 0) + totalItems;

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const expiresAt = new Date(Date.now() + PENDING_REGISTRATION_TTL_HOURS * 60 * 60 * 1000);

  return prisma.pendingRegistration.create({
    data: {
      email,
      passwordHash: hashedPassword,
      companyName,
      planId: plan.id,
      customModules: normalizedCustomModules.length > 0 ? normalizedCustomModules : null,
      billingCycle: plan.billingCycle,
      provider: String(provider).toUpperCase(),
      amount,
      currency: plan.currency || 'USD',
      status: 'PENDING',
      expiresAt
    }
  });
};

export const finalizePendingRegistration = async (pendingRegistrationId, providerOverride) => {
  const pending = await prisma.pendingRegistration.findUnique({
    where: { id: pendingRegistrationId }
  });

  if (!pending) {
    throw new Error('Pending registration not found');
  }

  if (pending.status === 'COMPLETED') {
    return prisma.subscription.findFirst({
      where: { tenantId: pending.tenantId }
    });
  }

  if (pending.expiresAt && pending.expiresAt < new Date()) {
    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data: { status: 'EXPIRED' }
    });
    throw new Error('Pending registration expired');
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: pending.companyName
    }
  });

  const user = await prisma.user.create({
    data: {
      email: pending.email,
      password: pending.passwordHash,
      role: 'ADMIN',
      tenantId: tenant.id
    }
  });

  const { plan, items } = await resolvePlanAndItems({
    planId: pending.planId,
    customModules: pending.customModules,
    billingCycle: pending.billingCycle
  });

  const subscription = await createSubscriptionForTenant({
    tenantId: tenant.id,
    plan,
    items,
    provider: providerOverride || pending.provider,
    statusOverride: 'ACTIVE'
  });

  await syncCompanyModulesFromSubscription(tenant.id);

  await prisma.pendingRegistration.update({
    where: { id: pending.id },
    data: {
      status: 'COMPLETED',
      tenantId: tenant.id,
      completedAt: new Date()
    }
  });

  return subscription;
};

/**
 * Register user logic
 */
export const registerUser = async ({
  email,
  password,
  role,
  companyName,
  planId,
  customModules,
  billingCycle,
  provider
}) => {
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

  const { plan, items } = await resolvePlanAndItems({
    planId,
    customModules,
    billingCycle
  });

  await createSubscriptionForTenant({
    tenantId: tenant.id,
    plan,
    items,
    provider: provider || 'MANUAL'
  });

  await syncCompanyModulesFromSubscription(tenant.id);

  // 5️⃣ Generate JWT
  const token = signToken({
    userId: user.id,
    tenantId: tenant.id,
    email: user.email,
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
    const error = new Error('Email and password required');
    error.status = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: { select: { name: true } } },
  });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  if (!user.password) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  });

  return {
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.employee?.name || user.email,
      role: user.role,
      tenantId: user.tenantId,
      avatar: null,
    },
  };
};
