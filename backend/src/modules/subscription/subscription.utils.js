import prisma from '../../config/db.js';

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

export const getEnabledModulesForTenant = async (tenantId, { requireActive = true } = {}) => {
  if (!tenantId) return [];

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId },
    include: {
      items: true,
      plan: { include: { modules: true } }
    }
  });

  if (!subscription) return [];
  if (requireActive && subscription.status !== 'ACTIVE') return [];

  const itemModules = normalizeModuleKeys(subscription.items.map((item) => item.moduleKey));
  if (itemModules.length > 0) return itemModules;

  const planModules = subscription.plan?.modules || [];
  return normalizeModuleKeys(
    planModules.filter((module) => module.included).map((module) => module.moduleKey)
  );
};

export const syncCompanyModulesFromSubscription = async (tenantId, { requireActive = true } = {}) => {
  const enabledModules = await getEnabledModulesForTenant(tenantId, { requireActive });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  const baseConfig = {
    tenantId,
    companyName: tenant?.name || 'New Company',
    industry: 'OTHER',
    size: 'SMALL',
    enabledModules,
    workflowConfig: {},
    approvalLevels: {},
    customFields: {},
    businessRules: {}
  };

  return prisma.companyConfig.upsert({
    where: { tenantId },
    update: { enabledModules },
    create: baseConfig
  });
};
