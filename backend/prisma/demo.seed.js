import bcrypt from 'bcrypt';
import prisma from '../src/config/db.js';
import { seedRoles } from '../src/core/rbac/roles.seed.js';
import { assignPermissions } from '../src/core/rbac/rolePermission.seed.js';
import {
  seedAdditionalEmployees,
  seedAdditionalGoodsReceipts,
  seedWarehouseDispatchAndMovements,
  seedFinanceApprovals,
  seedEnhancedDocuments,
  seedAdditionalVendors
} from './enhanced-seed.js';

const DEMO_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'bhavsarnisarg0@gmail.com';
const DEMO_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'bhavsarnisarg0@gmail.com';
const DAY_MS = 24 * 60 * 60 * 1000;

const ALL_MODULE_KEYS = [
  'INVENTORY',
  'SALES',
  'PURCHASE',
  'FINANCE',
  'REPORTS',
  'HR',
  'PAYROLL',
  'CRM',
  'ASSETS',
  'DOCUMENTS',
  'PROJECTS',
  'COMMUNICATION',
  'MANUFACTURING',
  'APPROVALS',
  'WORKFLOWS'
];

const addDays = (days) => new Date(Date.now() + (days * DAY_MS));
const addHours = (hours) => new Date(Date.now() + (hours * 60 * 60 * 1000));
const atTime = (baseDate, hours, minutes = 0) => {
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const upsertFirst = async (delegate, where, create, update = create) => {
  const existing = await delegate.findFirst({ where });
  if (existing) {
    return delegate.update({
      where: { id: existing.id },
      data: update
    });
  }

  return delegate.create({ data: create });
};

const ensureUserRole = async (userId, roleId) => {
  return prisma.userRole.upsert({
    where: {
      userId_roleId: { userId, roleId }
    },
    update: {},
    create: { userId, roleId }
  });
};

const getTenantLabel = (tenant) => {
  if (!tenant?.name) return 'tenant';

  return tenant.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24) || 'tenant';
};

const ensureManagerRole = async (tenantId) => {
  return prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'MANAGER',
        tenantId
      }
    },
    update: {},
    create: {
      name: 'MANAGER',
      tenantId
    }
  });
};

const seedTenantAndSubscription = async () => {
  const tenant = await upsertFirst(
    prisma.tenant,
    { name: 'UEORMS Demo Tenant' },
    { name: 'UEORMS Demo Tenant' }
  );

  await upsertFirst(
    prisma.companyConfig,
    { tenantId: tenant.id },
    {
      tenantId: tenant.id,
      companyName: 'UEORMS Demo Industries',
      industry: 'Manufacturing',
      size: 'MEDIUM',
      country: 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      fiscalYear: '2026',
      enabledModules: ALL_MODULE_KEYS,
      approvalLevels: {
        inventory: 1,
        expense: 2,
        leave: 1,
        purchase: 2,
        ap: 2
      },
      businessRules: {
        allowNegativeStock: false,
        requireExpenseReceiptsAbove: 500,
        enableThreeWayMatching: true
      },
      workflowConfig: {
        inventory: { approvals: true },
        finance: { approvals: true },
        hr: { approvals: true }
      }
    }
  );

  const plan = await prisma.plan.findFirst({
    where: { name: 'Enterprise Monthly' }
  });

  if (!plan) {
    throw new Error('Enterprise Monthly plan not found. Run plan seeding first.');
  }

  const currentPeriodStart = new Date();
  const currentPeriodEnd = addDays(30);

  const subscription = await upsertFirst(
    prisma.subscription,
    { tenantId: tenant.id, status: 'ACTIVE' },
    {
      tenantId: tenant.id,
      planId: plan.id,
      status: 'ACTIVE',
      provider: 'MANUAL',
      providerSubscriptionId: 'demo-subscription-enterprise-monthly',
      providerCustomerId: 'demo-customer-enterprise',
      startAt: currentPeriodStart,
      currentPeriodStart,
      currentPeriodEnd
    },
    {
      planId: plan.id,
      provider: 'MANUAL',
      providerSubscriptionId: 'demo-subscription-enterprise-monthly',
      providerCustomerId: 'demo-customer-enterprise',
      currentPeriodStart,
      currentPeriodEnd
    }
  );

  await prisma.subscriptionItem.deleteMany({
    where: { subscriptionId: subscription.id }
  });

  await prisma.subscriptionItem.createMany({
    data: ALL_MODULE_KEYS.map((moduleKey) => ({
      subscriptionId: subscription.id,
      moduleKey,
      quantity: 1,
      unitPrice: 0
    })),
    skipDuplicates: true
  });

  await upsertFirst(
    prisma.subscriptionPayment,
    { subscriptionId: subscription.id, invoiceNumber: 'SUB-2026-0001' },
    {
      subscriptionId: subscription.id,
      tenantId: tenant.id,
      amount: 299,
      currency: 'USD',
      status: 'SUCCEEDED',
      providerPaymentId: 'manual-payment-0001',
      invoiceNumber: 'SUB-2026-0001',
      description: 'Enterprise Monthly subscription payment',
      scheduledFor: currentPeriodStart,
      attemptedAt: currentPeriodStart,
      succeededAt: currentPeriodStart,
      metadata: {
        source: 'demo-seed'
      }
    }
  );

  await prisma.billingEvent.upsert({
    where: { providerEventId: 'manual-demo-event-0001' },
    update: {
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      status: 'PROCESSED',
      processedAt: currentPeriodStart,
      payload: {
        invoiceNumber: 'SUB-2026-0001',
        modules: ALL_MODULE_KEYS
      }
    },
    create: {
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      eventType: 'invoice.payment_succeeded',
      provider: 'MANUAL',
      providerEventId: 'manual-demo-event-0001',
      status: 'PROCESSED',
      payload: {
        invoiceNumber: 'SUB-2026-0001',
        modules: ALL_MODULE_KEYS
      },
      processedAt: currentPeriodStart
    }
  });

  return { tenant, subscription, plan };
};

const seedOrganization = async (tenantId, passwordHash) => {
  const departments = {
    operations: await upsertFirst(
      prisma.department,
      { tenantId, name: 'Operations' },
      {
        tenantId,
        name: 'Operations',
        description: 'Operations and administration team',
        location: 'Ahmedabad HQ',
        budget: 400000,
        status: 'ACTIVE'
      }
    ),
    finance: await upsertFirst(
      prisma.department,
      { tenantId, name: 'Finance' },
      {
        tenantId,
        name: 'Finance',
        description: 'Finance and accounting team',
        location: 'Ahmedabad HQ',
        budget: 350000,
        status: 'ACTIVE'
      }
    ),
    sales: await upsertFirst(
      prisma.department,
      { tenantId, name: 'Sales' },
      {
        tenantId,
        name: 'Sales',
        description: 'Sales and customer success team',
        location: 'Mumbai Branch',
        budget: 500000,
        status: 'ACTIVE'
      }
    ),
    engineering: await upsertFirst(
      prisma.department,
      { tenantId, name: 'Engineering' },
      {
        tenantId,
        name: 'Engineering',
        description: 'Engineering and delivery team',
        location: 'Ahmedabad HQ',
        budget: 650000,
        status: 'ACTIVE'
      }
    )
  };

  const users = {
    admin: await prisma.user.upsert({
      where: { email: DEMO_ADMIN_EMAIL },
      update: {
        password: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.operations.id,
        managerId: null
      },
      create: {
        email: DEMO_ADMIN_EMAIL,
        password: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.operations.id
      }
    }),
    manager: await prisma.user.upsert({
      where: { email: 'manager.demo@ueorms.local' },
      update: {
        password: passwordHash,
        role: 'MANAGER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.engineering.id,
        managerId: null
      },
      create: {
        email: 'manager.demo@ueorms.local',
        password: passwordHash,
        role: 'MANAGER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.engineering.id
      }
    }),
    finance: await prisma.user.upsert({
      where: { email: 'finance.demo@ueorms.local' },
      update: {
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.finance.id,
        managerId: null
      },
      create: {
        email: 'finance.demo@ueorms.local',
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.finance.id
      }
    }),
    sales: await prisma.user.upsert({
      where: { email: 'sales.demo@ueorms.local' },
      update: {
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.sales.id,
        managerId: null
      },
      create: {
        email: 'sales.demo@ueorms.local',
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.sales.id
      }
    }),
    employee: await prisma.user.upsert({
      where: { email: 'employee.demo@ueorms.local' },
      update: {
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.engineering.id,
        managerId: null
      },
      create: {
        email: 'employee.demo@ueorms.local',
        password: passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        tenantId,
        departmentId: departments.engineering.id
      }
    })
  };

  await seedRoles(tenantId);
  const managerRole = await ensureManagerRole(tenantId);
  await assignPermissions(tenantId);

  const adminRole = await prisma.role.findFirst({ where: { tenantId, name: 'ADMIN' } });
  const userRole = await prisma.role.findFirst({ where: { tenantId, name: 'USER' } });

  if (adminRole) {
    await ensureUserRole(users.admin.id, adminRole.id);
  }

  if (managerRole) {
    await ensureUserRole(users.manager.id, managerRole.id);
  }

  if (userRole) {
    await ensureUserRole(users.finance.id, userRole.id);
    await ensureUserRole(users.sales.id, userRole.id);
    await ensureUserRole(users.employee.id, userRole.id);
  }

  const employees = {
    admin: await upsertFirst(
      prisma.employee,
      { userId: users.admin.id },
      {
        tenantId,
        userId: users.admin.id,
        departmentId: departments.operations.id,
        employeeCode: 'EMP-0001',
        name: 'Aarav Admin',
        email: users.admin.email,
        phone: '+91-90000-00001',
        designation: 'System Administrator',
        joiningDate: addDays(-600),
        status: 'ACTIVE'
      }
    ),
    manager: await upsertFirst(
      prisma.employee,
      { userId: users.manager.id },
      {
        tenantId,
        userId: users.manager.id,
        departmentId: departments.engineering.id,
        employeeCode: 'EMP-0002',
        name: 'Meera Manager',
        email: users.manager.email,
        phone: '+91-90000-00002',
        designation: 'Engineering Manager',
        joiningDate: addDays(-420),
        status: 'ACTIVE'
      }
    ),
    finance: await upsertFirst(
      prisma.employee,
      { userId: users.finance.id },
      {
        tenantId,
        userId: users.finance.id,
        departmentId: departments.finance.id,
        employeeCode: 'EMP-0003',
        name: 'Priya Finance',
        email: users.finance.email,
        phone: '+91-90000-00003',
        designation: 'Finance Executive',
        joiningDate: addDays(-300),
        status: 'ACTIVE'
      }
    ),
    sales: await upsertFirst(
      prisma.employee,
      { userId: users.sales.id },
      {
        tenantId,
        userId: users.sales.id,
        departmentId: departments.sales.id,
        employeeCode: 'EMP-0004',
        name: 'Rohan Sales',
        email: users.sales.email,
        phone: '+91-90000-00004',
        designation: 'Sales Executive',
        joiningDate: addDays(-240),
        status: 'ACTIVE'
      }
    ),
    employee: await upsertFirst(
      prisma.employee,
      { userId: users.employee.id },
      {
        tenantId,
        userId: users.employee.id,
        departmentId: departments.engineering.id,
        managerId: null,
        employeeCode: 'EMP-0005',
        name: 'Karan Employee',
        email: users.employee.email,
        phone: '+91-90000-00005',
        designation: 'Software Engineer',
        joiningDate: addDays(-180),
        status: 'ACTIVE'
      }
    )
  };

  await prisma.employee.update({
    where: { id: employees.finance.id },
    data: { managerId: employees.admin.id }
  });

  await prisma.employee.update({
    where: { id: employees.sales.id },
    data: { managerId: employees.manager.id }
  });

  await prisma.employee.update({
    where: { id: employees.employee.id },
    data: { managerId: employees.manager.id }
  });

  await prisma.user.update({
    where: { id: users.finance.id },
    data: { managerId: users.admin.id }
  });

  await prisma.user.update({
    where: { id: users.sales.id },
    data: { managerId: users.manager.id }
  });

  await prisma.user.update({
    where: { id: users.employee.id },
    data: { managerId: users.manager.id }
  });

  await prisma.department.update({
    where: { id: departments.operations.id },
    data: { managerId: users.admin.id }
  });

  await prisma.department.update({
    where: { id: departments.finance.id },
    data: { managerId: users.finance.id }
  });

  await prisma.department.update({
    where: { id: departments.sales.id },
    data: { managerId: users.sales.id }
  });

  await prisma.department.update({
    where: { id: departments.engineering.id },
    data: { managerId: users.manager.id }
  });

  await upsertFirst(
    prisma.userInvite,
    { email: 'new.hire@ueorms.local', tenantId },
    {
      email: 'new.hire@ueorms.local',
      role: 'USER',
      token: 'demo-user-invite-token',
      used: false,
      expiresAt: addDays(14),
      tenantId
    }
  );

  return { departments, users, employees };
};

const seedBranchInventoryAndManufacturing = async (tenantId, departments, users) => {
  const branch = await upsertFirst(
    prisma.branch,
    { tenantId, code: 'HQ-01' },
    {
      tenantId,
      code: 'HQ-01',
      name: 'Ahmedabad Headquarters',
      type: 'BRANCH',
      address: 'SG Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      postalCode: '380015',
      phone: '+91-79-4000-0000',
      email: 'hq@ueorms.local',
      managerId: users.admin.id,
      isActive: true,
      isMainBranch: true,
      operatingHours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' }
      }
    }
  );

  const warehouse = await upsertFirst(
    prisma.warehouse,
    { tenantId, code: 'MAIN-WH' },
    {
      tenantId,
      branchId: branch.id,
      code: 'MAIN-WH',
      name: 'Main Warehouse',
      type: 'GENERAL',
      address: 'Warehouse Block A',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      postalCode: '380015',
      capacity: 12000,
      unit: 'SQFT',
      managerId: users.admin.id,
      phone: '+91-79-4000-0010',
      isActive: true
    }
  );

  const items = {
    laptop: await upsertFirst(
      prisma.item,
      { tenantId, sku: 'ITM-LAP-001' },
      {
        tenantId,
        name: 'Laptop Pro 14',
        sku: 'ITM-LAP-001',
        price: 78000,
        quantity: 24,
        description: 'Primary engineering laptop',
        category: 'IT'
      }
    ),
    chair: await upsertFirst(
      prisma.item,
      { tenantId, sku: 'ITM-CHR-001' },
      {
        tenantId,
        name: 'Ergo Office Chair',
        sku: 'ITM-CHR-001',
        price: 9500,
        quantity: 40,
        description: 'Ergonomic office chair',
        category: 'Furniture'
      }
    ),
    steelSheet: await upsertFirst(
      prisma.item,
      { tenantId, sku: 'RAW-STL-001' },
      {
        tenantId,
        name: 'Steel Sheet Grade A',
        sku: 'RAW-STL-001',
        price: 3200,
        quantity: 500,
        description: 'Manufacturing raw material',
        category: 'Raw Material'
      }
    ),
    widget: await upsertFirst(
      prisma.item,
      { tenantId, sku: 'FG-WDG-001' },
      {
        tenantId,
        name: 'Widget X Control Panel',
        sku: 'FG-WDG-001',
        price: 18500,
        quantity: 80,
        description: 'Finished manufactured product',
        category: 'Finished Goods'
      }
    )
  };

  for (const [itemKey, item] of Object.entries(items)) {
    const defaults = {
      laptop: { qty: 24, reserved: 3, bin: 'A-01-01', zone: 'IT', cost: 71000 },
      chair: { qty: 40, reserved: 2, bin: 'B-03-02', zone: 'FURN', cost: 8500 },
      steelSheet: { qty: 500, reserved: 80, bin: 'R-11-04', zone: 'RAW', cost: 2900 },
      widget: { qty: 80, reserved: 12, bin: 'F-02-01', zone: 'FG', cost: 14000 }
    }[itemKey];

    await upsertFirst(
      prisma.warehouseStock,
      { warehouseId: warehouse.id, itemId: item.id },
      {
        tenantId,
        warehouseId: warehouse.id,
        itemId: item.id,
        quantity: defaults.qty,
        reservedQty: defaults.reserved,
        availableQty: defaults.qty - defaults.reserved,
        binLocation: defaults.bin,
        zone: defaults.zone,
        reorderPoint: 10,
        reorderQty: 25,
        minStock: 8,
        maxStock: defaults.qty + 50,
        lastPurchasePrice: defaults.cost,
        avgCost: defaults.cost
      }
    );
  }

  await upsertFirst(
    prisma.stockMovement,
    { tenantId, movementNumber: 'SM-2026-0001' },
    {
      tenantId,
      movementNumber: 'SM-2026-0001',
      type: 'IN',
      reason: 'PURCHASE',
      itemId: items.steelSheet.id,
      warehouseId: warehouse.id,
      quantity: 150,
      lotNumber: 'LOT-STEEL-2026-01',
      batchNumber: 'BATCH-STEEL-01',
      expiryDate: addDays(365),
      referenceType: 'PURCHASE_ORDER',
      referenceId: 'PO-2026-0001',
      unitCost: 2900,
      totalCost: 435000,
      status: 'COMPLETED',
      approvedBy: users.admin.id,
      approvedAt: addDays(-7),
      notes: 'Raw material received into warehouse',
      createdBy: users.admin.id
    }
  );

  await upsertFirst(
    prisma.stockMovement,
    { tenantId, movementNumber: 'SM-2026-0002' },
    {
      tenantId,
      movementNumber: 'SM-2026-0002',
      type: 'OUT',
      reason: 'SALE',
      itemId: items.widget.id,
      warehouseId: warehouse.id,
      quantity: 10,
      referenceType: 'SALES_ORDER',
      referenceId: 'SO-2026-0001',
      unitCost: 14000,
      totalCost: 140000,
      status: 'COMPLETED',
      approvedBy: users.admin.id,
      approvedAt: addDays(-2),
      notes: 'Finished goods issued for customer delivery',
      createdBy: users.admin.id
    }
  );

  await upsertFirst(
    prisma.lotBatch,
    { tenantId, lotNumber: 'LOT-STEEL-2026-01' },
    {
      tenantId,
      itemId: items.steelSheet.id,
      lotNumber: 'LOT-STEEL-2026-01',
      batchNumber: 'BATCH-STEEL-01',
      manufacturingDate: addDays(-14),
      expiryDate: addDays(365),
      quantity: 150,
      remainingQty: 120,
      supplier: 'Precision Metals Pvt Ltd',
      purchaseOrderId: 'PO-2026-0001',
      status: 'ACTIVE',
      notes: 'Primary steel batch for Q1 production'
    }
  );

  const bom = await upsertFirst(
    prisma.billOfMaterials,
    { tenantId, bomNumber: 'BOM-2026-0001' },
    {
      tenantId,
      bomNumber: 'BOM-2026-0001',
      productId: items.widget.id,
      version: '1.0',
      name: 'Widget X Standard BOM',
      description: 'Standard manufacturing recipe for Widget X control panel.',
      quantity: 1,
      unit: 'unit',
      materialCost: 11800,
      laborCost: 1600,
      overheadCost: 900,
      totalCost: 14300,
      status: 'ACTIVE',
      isActive: true,
      isDefault: true,
      effectiveFrom: addDays(-30),
      createdBy: users.manager.id
    }
  );

  await upsertFirst(
    prisma.bOMItem,
    { bomId: bom.id, itemId: items.steelSheet.id },
    {
      bomId: bom.id,
      itemId: items.steelSheet.id,
      sequence: 1,
      quantity: 2,
      unit: 'sheet',
      warehouseId: warehouse.id,
      unitCost: 2900,
      totalCost: 5800,
      scrapPercentage: 2,
      notes: 'Primary steel enclosure material.'
    }
  );

  await upsertFirst(
    prisma.bOMItem,
    { bomId: bom.id, itemId: items.laptop.id },
    {
      bomId: bom.id,
      itemId: items.laptop.id,
      sequence: 2,
      quantity: 0.02,
      unit: 'unit',
      warehouseId: warehouse.id,
      unitCost: 71000,
      totalCost: 1420,
      scrapPercentage: 0,
      notes: 'Represents bundled commissioning kit cost for demo data.'
    }
  );

  const workOrder = await upsertFirst(
    prisma.workOrder,
    { tenantId, workOrderNumber: 'WO-2026-0001' },
    {
      tenantId,
      workOrderNumber: 'WO-2026-0001',
      bomId: bom.id,
      productId: items.widget.id,
      plannedQty: 10,
      producedQty: 8,
      scrappedQty: 1,
      scheduledStart: addDays(-5),
      scheduledEnd: addDays(2),
      actualStart: addDays(-4),
      warehouseId: warehouse.id,
      workCenter: 'Assembly Line 1',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      estimatedCost: 143000,
      actualCost: 118500,
      assignedTo: users.manager.id,
      notes: 'Seeded manufacturing work order for Widget X batch.',
      createdBy: users.manager.id
    }
  );

  await upsertFirst(
    prisma.workOrderOperation,
    { workOrderId: workOrder.id, sequence: 1 },
    {
      workOrderId: workOrder.id,
      sequence: 1,
      operationName: 'Cut and form steel panels',
      description: 'Prepare base enclosure components.',
      workCenter: 'Fabrication Cell',
      estimatedHours: 8,
      actualHours: 7,
      assignedTo: users.manager.id,
      laborCost: 5600,
      status: 'COMPLETED',
      startedAt: addDays(-4),
      completedAt: addDays(-3),
      notes: 'Completed without rework.'
    }
  );

  await upsertFirst(
    prisma.workOrderOperation,
    { workOrderId: workOrder.id, sequence: 2 },
    {
      workOrderId: workOrder.id,
      sequence: 2,
      operationName: 'Assemble control panel',
      description: 'Wire, test, and package finished unit.',
      workCenter: 'Assembly Line 1',
      estimatedHours: 12,
      actualHours: 9,
      assignedTo: users.manager.id,
      laborCost: 7200,
      status: 'IN_PROGRESS',
      startedAt: addDays(-2),
      notes: 'Final QA in progress.'
    }
  );

  await upsertFirst(
    prisma.workOrderMaterial,
    { workOrderId: workOrder.id, itemId: items.steelSheet.id },
    {
      workOrderId: workOrder.id,
      itemId: items.steelSheet.id,
      plannedQty: 20,
      issuedQty: 18,
      consumedQty: 16,
      returnedQty: 2,
      warehouseId: warehouse.id,
      unitCost: 2900,
      totalCost: 46400,
      status: 'CONSUMED',
      issuedBy: users.admin.id,
      issuedAt: addDays(-4),
      notes: 'Material issued against BOM requirement.'
    }
  );

  await upsertFirst(
    prisma.productionBatch,
    { tenantId, batchNumber: 'PB-2026-0001' },
    {
      tenantId,
      workOrderId: workOrder.id,
      batchNumber: 'PB-2026-0001',
      productId: items.widget.id,
      quantity: 8,
      unit: 'unit',
      manufacturingDate: addDays(-1),
      expiryDate: addDays(365),
      qualityStatus: 'PASSED',
      qcBy: users.manager.id,
      qcAt: addDays(0),
      qcNotes: 'Batch passed seeded quality inspection.',
      warehouseId: warehouse.id,
      status: 'COMPLETED'
    }
  );

  return { branch, warehouse, items };
};

const seedHRAndPayroll = async (tenantId, employees, departments, users) => {
  const leaveTypes = {
    annual: await upsertFirst(
      prisma.leaveType,
      { tenantId, code: 'AL' },
      {
        tenantId,
        name: 'Annual Leave',
        code: 'AL',
        maxDays: 24,
        paid: true,
        requiresApproval: true
      }
    ),
    sick: await upsertFirst(
      prisma.leaveType,
      { tenantId, code: 'SL' },
      {
        tenantId,
        name: 'Sick Leave',
        code: 'SL',
        maxDays: 12,
        paid: true,
        requiresApproval: true
      }
    )
  };

  const leaveRequest = await upsertFirst(
    prisma.leaveRequest,
    { tenantId, employeeId: employees.employee.id, reason: 'Family function leave for seeded demo data' },
    {
      tenantId,
      employeeId: employees.employee.id,
      leaveTypeId: leaveTypes.annual.id,
      startDate: addDays(4),
      endDate: addDays(6),
      reason: 'Family function leave for seeded demo data',
      status: 'APPROVED'
    }
  );

  const expenseCategories = {
    travel: await upsertFirst(
      prisma.expenseCategory,
      { tenantId, code: 'TRAVEL' },
      {
        tenantId,
        name: 'Travel',
        code: 'TRAVEL',
        active: true
      }
    ),
    office: await upsertFirst(
      prisma.expenseCategory,
      { tenantId, code: 'OFFICE' },
      {
        tenantId,
        name: 'Office Supplies',
        code: 'OFFICE',
        active: true
      }
    )
  };

  const expenseClaim = await upsertFirst(
    prisma.expenseClaim,
    { tenantId, employeeId: employees.sales.id, title: 'Client visit travel reimbursement' },
    {
      tenantId,
      employeeId: employees.sales.id,
      categoryId: expenseCategories.travel.id,
      title: 'Client visit travel reimbursement',
      amount: 4800,
      description: 'Taxi and meals for Mumbai customer visit',
      receiptUrl: '/uploads/receipts/client-visit.pdf',
      expenseDate: addDays(-3),
      status: 'APPROVED'
    }
  );

  const task = await upsertFirst(
    prisma.task,
    { tenantId, title: 'Complete Q1 rollout checklist' },
    {
      tenantId,
      employeeId: employees.employee.id,
      assignedBy: employees.manager.id,
      title: 'Complete Q1 rollout checklist',
      description: 'Finalize rollout validation items and attach evidence.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: addDays(3)
    }
  );

  await upsertFirst(
    prisma.workReport,
    { tenantId, employeeId: employees.employee.id, title: 'Q1 rollout progress update' },
    {
      tenantId,
      employeeId: employees.employee.id,
      taskId: task.id,
      title: 'Q1 rollout progress update',
      description: 'Completed environment verification and prepared deployment notes.',
      workDate: addDays(-1),
      hoursSpent: 6.5,
      attachments: ['/uploads/reports/q1-rollout-progress.pdf']
    }
  );

  const shift = await upsertFirst(
    prisma.shift,
    { tenantId, code: 'GS' },
    {
      tenantId,
      name: 'General Shift',
      code: 'GS',
      startTime: '09:00',
      endTime: '18:00',
      breakDuration: 60,
      workingDays: '1,2,3,4,5',
      isActive: true,
      description: 'Standard weekday shift'
    }
  );

  await upsertFirst(
    prisma.shiftAssignment,
    { tenantId, employeeId: employees.employee.id, shiftId: shift.id },
    {
      tenantId,
      employeeId: employees.employee.id,
      shiftId: shift.id,
      assignedFrom: addDays(-30),
      status: 'ACTIVE'
    },
    {
      assignedFrom: addDays(-30),
      status: 'ACTIVE'
    }
  );

  const attendanceDate = atTime(new Date(), 0, 0);

  await upsertFirst(
    prisma.attendance,
    { tenantId, employeeId: employees.employee.id, date: attendanceDate },
    {
      tenantId,
      employeeId: employees.employee.id,
      date: attendanceDate,
      checkIn: atTime(new Date(), 9, 5),
      checkOut: atTime(new Date(), 18, 12),
      status: 'PRESENT',
      workHours: 8.1,
      overtimeHours: 0.6,
      notes: 'Worked on release checklist items.'
    }
  );

  const demoCheckIn = atTime(new Date(), 9, 5);
  await prisma.timeTracking.upsert({
    where: {
      tenantId_employeeId_date_checkInTime: {
        tenantId,
        employeeId: employees.employee.id,
        date: attendanceDate,
        checkInTime: demoCheckIn
      }
    },
    update: {
      checkOutTime: atTime(new Date(), 18, 12),
      checkInLocation: 'Ahmedabad HQ',
      checkOutLocation: 'Ahmedabad HQ',
      workHours: 8.1,
      breakHours: 1,
      status: 'CHECKED_OUT',
      isLate: true,
      notes: 'Seeded time tracking record'
    },
    create: {
      tenantId,
      employeeId: employees.employee.id,
      date: attendanceDate,
      checkInTime: demoCheckIn,
      checkOutTime: atTime(new Date(), 18, 12),
      checkInLocation: 'Ahmedabad HQ',
      checkOutLocation: 'Ahmedabad HQ',
      workHours: 8.1,
      breakHours: 1,
      status: 'CHECKED_OUT',
      isLate: true,
      notes: 'Seeded time tracking record'
    }
  });

  const overtimePolicy = await upsertFirst(
    prisma.overtimePolicy,
    { tenantId, code: 'OT-STANDARD' },
    {
      tenantId,
      shiftId: shift.id,
      name: 'Standard OT',
      code: 'OT-STANDARD',
      dailyThreshold: 8,
      weeklyThreshold: 45,
      monthlyThreshold: 180,
      overtimeRate: 1.5,
      weekendRate: 2,
      holidayRate: 2.5,
      isActive: true,
      description: 'Default overtime policy'
    }
  );

  await upsertFirst(
    prisma.overtimeRecord,
    { tenantId, employeeId: employees.employee.id, reason: 'Release deployment support' },
    {
      tenantId,
      employeeId: employees.employee.id,
      overtimePolicyId: overtimePolicy.id,
      date: addDays(-1),
      overtimeHours: 1.5,
      overtimeRate: 1.5,
      overtimeAmount: 1800,
      reason: 'Release deployment support',
      approvalStatus: 'APPROVED',
      approvedBy: users.manager.id,
      approvedAt: addHours(-12)
    }
  );

  await upsertFirst(
    prisma.attendanceReport,
    { tenantId, employeeId: employees.employee.id, month: 3, year: 2026 },
    {
      tenantId,
      employeeId: employees.employee.id,
      reportDate: addDays(-1),
      month: 3,
      year: 2026,
      totalWorkingDays: 23,
      presentDays: 21,
      absentDays: 1,
      leaveDays: 1,
      halfDays: 0,
      workFromHomeDays: 2,
      totalWorkHours: 172,
      totalOvertimeHours: 4.5,
      attendancePercentage: 91.3,
      status: 'GENERATED',
      notes: 'Healthy attendance trend in seeded report.'
    }
  );

  await upsertFirst(
    prisma.leaveIntegration,
    { tenantId, leaveRequestId: leaveRequest.id, leaveDate: addDays(4) },
    {
      tenantId,
      leaveRequestId: leaveRequest.id,
      employeeId: employees.employee.id,
      leaveDate: addDays(4),
      status: 'APPROVED',
      attendanceStatus: 'ON_LEAVE'
    }
  );

  const additionalLeaveRequests = [
    {
      employee: employees.sales,
      leaveTypeId: leaveTypes.sick.id,
      startDate: addDays(2),
      endDate: addDays(2),
      reason: 'Medical checkup leave for seeded demo data',
      status: 'APPROVED'
    },
    {
      employee: employees.finance,
      leaveTypeId: leaveTypes.annual.id,
      startDate: addDays(8),
      endDate: addDays(9),
      reason: 'Personal work leave for seeded demo data',
      status: 'PENDING'
    }
  ];

  for (const leaveSpec of additionalLeaveRequests) {
    await upsertFirst(
      prisma.leaveRequest,
      {
        tenantId,
        employeeId: leaveSpec.employee.id,
        reason: leaveSpec.reason
      },
      {
        tenantId,
        employeeId: leaveSpec.employee.id,
        leaveTypeId: leaveSpec.leaveTypeId,
        startDate: leaveSpec.startDate,
        endDate: leaveSpec.endDate,
        reason: leaveSpec.reason,
        status: leaveSpec.status
      },
      {
        leaveTypeId: leaveSpec.leaveTypeId,
        startDate: leaveSpec.startDate,
        endDate: leaveSpec.endDate,
        status: leaveSpec.status
      }
    );
  }

  const attendanceSnapshots = [
    {
      employee: employees.manager,
      dateOffset: -1,
      checkIn: [8, 55],
      checkOut: [18, 5],
      workHours: 8.17,
      overtimeHours: 0.5,
      isLate: false,
      notes: 'Reviewed project milestones and approvals.'
    },
    {
      employee: employees.finance,
      dateOffset: -1,
      checkIn: [9, 12],
      checkOut: [18, 2],
      workHours: 7.83,
      overtimeHours: 0.2,
      isLate: true,
      notes: 'Processed invoices and reconciliations.'
    },
    {
      employee: employees.sales,
      dateOffset: -2,
      checkIn: [9, 2],
      checkOut: [18, 18],
      workHours: 8.27,
      overtimeHours: 0.6,
      isLate: false,
      notes: 'Completed customer follow-ups and quote revision.'
    }
  ];

  for (const snapshot of attendanceSnapshots) {
    const baseDate = atTime(addDays(snapshot.dateOffset), 0, 0);
    const checkInTime = atTime(addDays(snapshot.dateOffset), snapshot.checkIn[0], snapshot.checkIn[1]);
    const checkOutTime = atTime(addDays(snapshot.dateOffset), snapshot.checkOut[0], snapshot.checkOut[1]);

    await prisma.attendance.upsert({
      where: {
        tenantId_employeeId_date: {
          tenantId,
          employeeId: snapshot.employee.id,
          date: baseDate
        }
      },
      update: {
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: 'PRESENT',
        workHours: snapshot.workHours,
        overtimeHours: snapshot.overtimeHours,
        notes: snapshot.notes
      },
      create: {
        tenantId,
        employeeId: snapshot.employee.id,
        date: baseDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: 'PRESENT',
        workHours: snapshot.workHours,
        overtimeHours: snapshot.overtimeHours,
        notes: snapshot.notes
      }
    });

    await prisma.timeTracking.upsert({
      where: {
        tenantId_employeeId_date_checkInTime: {
          tenantId,
          employeeId: snapshot.employee.id,
          date: baseDate,
          checkInTime
        }
      },
      update: {
        checkOutTime,
        checkInLocation: 'Ahmedabad HQ',
        checkOutLocation: 'Ahmedabad HQ',
        workHours: snapshot.workHours,
        breakHours: 1,
        status: 'CHECKED_OUT',
        isLate: snapshot.isLate,
        notes: `Seeded time tracking: ${snapshot.notes}`
      },
      create: {
        tenantId,
        employeeId: snapshot.employee.id,
        date: baseDate,
        checkInTime,
        checkOutTime,
        checkInLocation: 'Ahmedabad HQ',
        checkOutLocation: 'Ahmedabad HQ',
        workHours: snapshot.workHours,
        breakHours: 1,
        status: 'CHECKED_OUT',
        isLate: snapshot.isLate,
        notes: `Seeded time tracking: ${snapshot.notes}`
      }
    });
  }

  const salaryStructures = [
    { employee: employees.manager, basicSalary: 95000, netSalary: 118500 },
    { employee: employees.finance, basicSalary: 72000, netSalary: 87800 },
    { employee: employees.sales, basicSalary: 68000, netSalary: 83900 },
    { employee: employees.employee, basicSalary: 60000, netSalary: 74900 }
  ];

  for (const entry of salaryStructures) {
    await upsertFirst(
      prisma.salaryStructure,
      { employeeId: entry.employee.id },
      {
        tenantId,
        employeeId: entry.employee.id,
        basicSalary: entry.basicSalary,
        allowances: {
          hra: entry.basicSalary * 0.25,
          transport: 3000,
          medical: 2500
        },
        deductions: {
          pf: entry.basicSalary * 0.12,
          tax: entry.basicSalary * 0.08,
          insurance: 1000
        },
        netSalary: entry.netSalary,
        effectiveFrom: addDays(-90)
      }
    );
  }

  const payrollCycle = await upsertFirst(
    prisma.payrollCycle,
    { tenantId, name: 'March 2026 Payroll' },
    {
      tenantId,
      name: 'March 2026 Payroll',
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2026-03-31T23:59:59.000Z'),
      paymentDate: new Date('2026-04-05T00:00:00.000Z'),
      status: 'COMPLETED',
      totalGross: 375000,
      totalDeductions: 53000,
      totalNet: 322000,
      processedBy: users.finance.id,
      processedAt: addDays(-1),
      notes: 'Monthly payroll processed successfully.'
    }
  );

  for (const [key, employee] of Object.entries({ manager: employees.manager, finance: employees.finance, sales: employees.sales, employee: employees.employee })) {
    const basicSalary = key === 'manager' ? 95000 : key === 'finance' ? 72000 : key === 'sales' ? 68000 : 60000;
    const payslipNumber = `PS-2026-${employee.employeeCode}`;
    const netSalary = key === 'manager' ? 118500 : key === 'finance' ? 87800 : key === 'sales' ? 83900 : 74900;

    await upsertFirst(
      prisma.payslip,
      { payslipNumber },
      {
        tenantId,
        employeeId: employee.id,
        payrollCycleId: payrollCycle.id,
        payslipNumber,
        basicSalary,
        allowances: { hra: basicSalary * 0.25, transport: 3000, medical: 2500 },
        bonuses: key === 'sales' ? 5000 : 0,
        overtime: key === 'employee' ? 1800 : 0,
        grossSalary: basicSalary + (basicSalary * 0.25) + 5500 + (key === 'sales' ? 5000 : 0) + (key === 'employee' ? 1800 : 0),
        taxDeductions: basicSalary * 0.08,
        providentFund: basicSalary * 0.12,
        insurance: 1000,
        otherDeductions: { loan: 0, advance: 0 },
        totalDeductions: (basicSalary * 0.08) + (basicSalary * 0.12) + 1000,
        netSalary,
        workingDays: 23,
        presentDays: 21,
        absentDays: 1,
        leaveDays: 1,
        overtimeHours: key === 'employee' ? 1.5 : 0,
        status: 'PAID',
        approvedBy: users.finance.id,
        approvedAt: addDays(-1),
        notes: 'Seeded monthly payslip.'
      }
    );

    await upsertFirst(
      prisma.salaryDisbursement,
      { tenantId, payrollCycleId: payrollCycle.id, employeeId: employee.id },
      {
        tenantId,
        payrollCycleId: payrollCycle.id,
        employeeId: employee.id,
        amount: netSalary,
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: `XXXXXX${employee.employeeCode.slice(-3)}`,
        transactionRef: `PAY-${employee.employeeCode}-0326`,
        status: 'COMPLETED',
        paymentDate: addDays(-1),
        completedAt: addDays(-1),
        notes: 'Seeded payroll disbursement.'
      }
    );
  }

  await upsertFirst(
    prisma.taxConfiguration,
    { tenantId, taxType: 'INCOME_TAX', effectiveFrom: new Date('2026-04-01T00:00:00.000Z') },
    {
      tenantId,
      name: 'Income Tax 2026',
      taxType: 'INCOME_TAX',
      slabs: [
        { min: 0, max: 300000, rate: 0 },
        { min: 300001, max: 700000, rate: 5 },
        { min: 700001, max: 1200000, rate: 10 },
        { min: 1200001, max: null, rate: 20 }
      ],
      deductionRules: {
        standardDeduction: 50000,
        professionalTax: 2400
      },
      isActive: true,
      effectiveFrom: new Date('2026-04-01T00:00:00.000Z')
    }
  );

  for (const component of [
    { code: 'HRA', name: 'House Rent Allowance', type: 'ALLOWANCE', calculationType: 'PERCENTAGE_OF_BASIC', value: 25, isTaxable: true },
    { code: 'TRANSPORT', name: 'Transport Allowance', type: 'ALLOWANCE', calculationType: 'FIXED', value: 3000, isTaxable: true },
    { code: 'PF', name: 'Provident Fund', type: 'DEDUCTION', calculationType: 'PERCENTAGE_OF_BASIC', value: 12, isTaxable: false }
  ]) {
    await upsertFirst(
      prisma.salaryComponent,
      { tenantId, code: component.code },
      {
        tenantId,
        ...component,
        isActive: true,
        description: `${component.name} seeded for payroll demo`
      }
    );
  }

  return { leaveTypes, expenseCategories, task, shift, payrollCycle, leaveRequest, expenseClaim };
};

const seedCRMAndSales = async (tenantId, users, employees, items) => {
  const customer = await upsertFirst(
    prisma.customer,
    { tenantId, name: 'Acme Manufacturing Ltd' },
    {
      tenantId,
      name: 'Acme Manufacturing Ltd',
      industry: 'Industrial Automation',
      website: 'https://acme.example.com',
      status: 'ACTIVE',
      notes: 'Strategic customer for seeded CRM and sales flow.',
      type: 'BUSINESS',
      companySize: 'ENTERPRISE',
      annualRevenue: 15000000,
      currencyCode: 'USD',
      primaryEmail: 'procurement@acme.example.com',
      primaryPhone: '+1-555-0100',
      billingAddress: {
        street: '100 Industrial Ave',
        city: 'Austin',
        state: 'Texas',
        zip: '73301',
        country: 'USA'
      },
      shippingAddress: {
        street: '100 Industrial Ave',
        city: 'Austin',
        state: 'Texas',
        zip: '73301',
        country: 'USA'
      },
      ownerId: users.sales.id,
      accountManager: users.sales.id,
      category: 'CUSTOMER',
      source: 'REFERRAL',
      firstContactDate: addDays(-120),
      lastContactDate: addDays(-2),
      preferredChannel: 'EMAIL',
      timezone: 'America/Chicago',
      tags: ['priority', 'north-america']
    }
  );

  const contact = await upsertFirst(
    prisma.contact,
    { tenantId, customerId: customer.id, email: 'jane.buyer@acme.example.com' },
    {
      tenantId,
      customerId: customer.id,
      name: 'Jane Buyer',
      email: 'jane.buyer@acme.example.com',
      phone: '+1-555-0101',
      title: 'Procurement Head',
      status: 'ACTIVE',
      firstName: 'Jane',
      lastName: 'Buyer',
      jobTitle: 'Procurement Head',
      department: 'Procurement',
      role: 'DECISION_MAKER',
      mobilePhone: '+1-555-0101',
      workPhone: '+1-555-0102',
      linkedinUrl: 'https://linkedin.com/in/jane-buyer',
      isPrimary: true,
      ownerId: users.sales.id,
      preferredChannel: 'EMAIL',
      lastContactDate: addDays(-2),
      emailOptIn: true,
      smsOptIn: true,
      tags: ['procurement', 'champion']
    }
  );

  const lead = await upsertFirst(
    prisma.lead,
    { tenantId, email: 'sam.lead@futurefactory.example.com' },
    {
      tenantId,
      name: 'Sam Lead',
      email: 'sam.lead@futurefactory.example.com',
      phone: '+1-555-0199',
      company: 'Future Factory',
      source: 'Website',
      status: 'QUALIFIED',
      notes: 'Interested in control panel automation suite.',
      firstName: 'Sam',
      lastName: 'Lead',
      jobTitle: 'Plant Director',
      leadScore: 82,
      rating: 'HOT',
      priority: 'HIGH',
      campaign: 'Q1 Automation Launch',
      medium: 'ORGANIC',
      budget: 250000,
      timeline: '1_3_MONTHS',
      authority: 'YES',
      need: 'EXPLICIT',
      ownerId: users.sales.id,
      assignedAt: addDays(-15),
      firstContactDate: addDays(-20),
      lastContactDate: addDays(-3),
      lastActivityDate: addDays(-2),
      tags: ['q1-campaign']
    }
  );

  const pipeline = await upsertFirst(
    prisma.pipeline,
    { tenantId, name: 'Sales Pipeline' },
    {
      tenantId,
      name: 'Sales Pipeline',
      description: 'Default sales opportunity pipeline',
      isDefault: true,
      isActive: true
    }
  );

  const stageSpecs = [
    { name: 'Prospecting', order: 1, probability: 10, color: '#6B7280', isClosedWon: false, isClosedLost: false, daysInStage: 30 },
    { name: 'Qualification', order: 2, probability: 30, color: '#2563EB', isClosedWon: false, isClosedLost: false, daysInStage: 21 },
    { name: 'Proposal', order: 3, probability: 60, color: '#8B5CF6', isClosedWon: false, isClosedLost: false, daysInStage: 14 },
    { name: 'Negotiation', order: 4, probability: 80, color: '#F59E0B', isClosedWon: false, isClosedLost: false, daysInStage: 10 },
    { name: 'Closed Won', order: 5, probability: 100, color: '#10B981', isClosedWon: true, isClosedLost: false, daysInStage: null },
    { name: 'Closed Lost', order: 6, probability: 0, color: '#EF4444', isClosedWon: false, isClosedLost: true, daysInStage: null }
  ];

  for (const spec of stageSpecs) {
    await upsertFirst(
      prisma.pipelineStage,
      { pipelineId: pipeline.id, name: spec.name },
      {
        tenantId,
        pipelineId: pipeline.id,
        ...spec
      }
    );
  }

  const deal = await upsertFirst(
    prisma.deal,
    { tenantId, name: 'Acme Control Panel Rollout' },
    {
      tenantId,
      customerId: customer.id,
      name: 'Acme Control Panel Rollout',
      stage: 'NEGOTIATION',
      value: 185000,
      expectedCloseDate: addDays(12),
      status: 'OPEN',
      notes: 'Commercial terms under final review.',
      dealNumber: 'DEAL-2026-0001',
      pipelineId: pipeline.id,
      stageOrder: 4,
      probability: 80,
      amount: 185000,
      currencyCode: 'USD',
      discount: 5000,
      tax: 9000,
      total: 189000,
      products: [
        { productId: items.widget.id, name: items.widget.name, quantity: 10, price: 18500, total: 185000 }
      ],
      ownerId: users.sales.id,
      teamMembers: [users.sales.id, users.manager.id],
      createdDate: addDays(-25),
      firstContactDate: addDays(-35),
      lastActivityDate: addDays(-1),
      competitors: ['PanelWorks', 'ControlHub'],
      source: 'REFERRAL',
      tags: ['high-value', 'negotiation']
    }
  );

  await prisma.lead.update({
    where: { id: lead.id },
    data: { dealId: deal.id }
  });

  const activity = await upsertFirst(
    prisma.activity,
    { tenantId, subject: 'Finalize pricing discussion with Acme' },
    {
      tenantId,
      type: 'MEETING',
      subject: 'Finalize pricing discussion with Acme',
      description: 'Review final pricing and deployment timeline.',
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: addDays(1),
      dueTime: '15:00',
      reminderAt: addHours(6),
      assignedTo: users.sales.id,
      createdBy: users.sales.id,
      customerId: customer.id,
      contactId: contact.id,
      dealId: deal.id,
      notes: 'Bring updated quote and implementation schedule.'
    }
  );

  const crmCommunication = await upsertFirst(
    prisma.communication,
    { tenantId, subject: 'Acme negotiation call' },
    {
      tenantId,
      type: 'CALL',
      subject: 'Acme negotiation call',
      notes: 'Discussed pricing, delivery, and support SLA.',
      occurredAt: addDays(-1),
      createdBy: users.sales.id,
      customerId: customer.id,
      contactId: contact.id,
      dealId: deal.id,
      direction: 'OUTBOUND',
      duration: 35,
      outcome: 'FOLLOW_UP_REQUIRED',
      hasAttachments: true,
      attachmentCount: 1,
      tags: ['negotiation']
    }
  );

  await upsertFirst(
    prisma.customerNote,
    { tenantId, customerId: customer.id, content: 'Customer prefers quarterly business reviews.' },
    {
      tenantId,
      customerId: customer.id,
      title: 'Relationship preference',
      content: 'Customer prefers quarterly business reviews.',
      isPinned: true,
      createdBy: users.sales.id
    }
  );

  await upsertFirst(
    prisma.attachment,
    { tenantId, fileName: 'acme-commercial-proposal.pdf' },
    {
      tenantId,
      fileName: 'acme-commercial-proposal.pdf',
      fileSize: 248000,
      mimeType: 'application/pdf',
      fileUrl: '/uploads/crm/acme-commercial-proposal.pdf',
      dealId: deal.id,
      communicationId: crmCommunication.id,
      uploadedBy: users.sales.id
    }
  );

  for (const tag of [
    { name: 'priority', category: 'CUSTOMER', color: '#EF4444' },
    { name: 'q1-campaign', category: 'LEAD', color: '#3B82F6' },
    { name: 'negotiation', category: 'DEAL', color: '#F59E0B' }
  ]) {
    await upsertFirst(
      prisma.tag,
      { tenantId, name: tag.name, category: tag.category },
      {
        tenantId,
        name: tag.name,
        color: tag.color,
        category: tag.category,
        usageCount: 1
      }
    );
  }

  const quotationItems = [
    { itemId: items.widget.id, name: items.widget.name, quantity: 10, unitPrice: 18500, total: 185000 }
  ];

  const quotation = await upsertFirst(
    prisma.salesQuotation,
    { tenantId, title: 'Acme Control Panel Proposal' },
    {
      tenantId,
      customerId: customer.id,
      dealId: deal.id,
      customerName: customer.name,
      customerEmail: customer.primaryEmail,
      title: 'Acme Control Panel Proposal',
      description: 'Commercial quote for control panel rollout.',
      items: quotationItems,
      subtotal: 185000,
      tax: 9000,
      discount: 5000,
      total: 189000,
      status: 'SENT',
      validUntil: addDays(10)
    }
  );

  const salesOrder = await upsertFirst(
    prisma.salesOrder,
    { tenantId, orderNumber: 'SO-2026-0001' },
    {
      tenantId,
      customerId: customer.id,
      dealId: deal.id,
      orderNumber: 'SO-2026-0001',
      customerName: customer.name,
      customerEmail: customer.primaryEmail,
      quotationId: quotation.id,
      orderDate: addDays(-1),
      expectedDelivery: addDays(14),
      items: quotationItems,
      subtotal: 185000,
      tax: 9000,
      discount: 5000,
      total: 189000,
      status: 'CONFIRMED',
      notes: 'Awaiting production completion for dispatch.'
    }
  );

  const salesInvoice = await upsertFirst(
    prisma.salesInvoice,
    { tenantId, invoiceNumber: 'INV-2026-0001' },
    {
      tenantId,
      customerId: customer.id,
      dealId: deal.id,
      invoiceNumber: 'INV-2026-0001',
      customerName: customer.name,
      customerEmail: customer.primaryEmail,
      orderId: salesOrder.id,
      issueDate: addDays(-1),
      dueDate: addDays(14),
      items: quotationItems,
      subtotal: 185000,
      tax: 9000,
      discount: 5000,
      total: 189000,
      amountPaid: 100000,
      status: 'PARTIALLY_PAID'
    }
  );

  await upsertFirst(
    prisma.invoicePayment,
    { tenantId, invoiceId: salesInvoice.id, referenceNumber: 'PAY-INV-2026-0001' },
    {
      tenantId,
      invoiceId: salesInvoice.id,
      amount: 100000,
      paymentDate: addDays(0),
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'PAY-INV-2026-0001',
      notes: 'Advance payment received from customer.'
    }
  );

  await upsertFirst(
    prisma.salesOrderTracking,
    { tenantId, salesOrderId: salesOrder.id, trackingNumber: 'TRK-ACME-0001' },
    {
      tenantId,
      salesOrderId: salesOrder.id,
      status: 'PROCESSING',
      carrier: 'BlueDart',
      trackingNumber: 'TRK-ACME-0001',
      location: 'Ahmedabad Plant',
      notes: 'Order is being packed for dispatch.'
    }
  );

  return { customer, contact, lead, deal, activity, quotation, salesOrder, salesInvoice };
};

const seedPurchaseAPAndFinance = async (tenantId, users, departments, warehouse, items, employees) => {
  const vendor = await upsertFirst(
    prisma.vendor,
    { vendorCode: 'VEND-0001' },
    {
      tenantId,
      vendorCode: 'VEND-0001',
      name: 'Precision Metals Pvt Ltd',
      contactPerson: 'Nikhil Shah',
      email: 'sales@precisionmetals.example.com',
      phone: '+91-22-4000-2222',
      address: 'Plot 44, Industrial Estate',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      website: 'https://precisionmetals.example.com',
      taxId: 'GSTIN22ABCDE1234F1Z5',
      paymentTerms: 'NET30',
      creditLimit: 1000000,
      currency: 'INR',
      status: 'ACTIVE',
      category: 'RAW_MATERIALS',
      bankName: 'ICICI Bank',
      accountNumber: 'XXXX001122',
      swiftCode: 'ICICINBB',
      rating: 4.4,
      notes: 'Preferred raw material supplier.'
    }
  );

  const requisitionItems = [
    { itemName: items.steelSheet.name, description: 'Q2 raw material replenishment', quantity: 150, estimatedPrice: 3200, unit: 'sheet' }
  ];

  const requisition = await upsertFirst(
    prisma.purchaseRequisition,
    { requisitionNumber: 'PR-2026-0001' },
    {
      tenantId,
      requisitionNumber: 'PR-2026-0001',
      requestedBy: users.manager.id,
      departmentId: departments.engineering.id,
      vendorId: vendor.id,
      title: 'Steel sheet replenishment',
      description: 'Material needed for upcoming manufacturing batch.',
      priority: 'HIGH',
      requestedDate: addDays(-10),
      requiredDate: addDays(5),
      status: 'APPROVED',
      approvalStatus: 'APPROVED',
      approvedBy: users.admin.id,
      approvedAt: addDays(-9),
      items: requisitionItems,
      totalAmount: 480000,
      budgetCode: 'ENG-RAW-2026',
      notes: 'Approved for Q2 production plan.'
    }
  );

  const purchaseOrderItems = [
    { itemName: items.steelSheet.name, description: 'Grade A steel sheet', quantity: 150, unitPrice: 2900, unit: 'sheet', tax: 52200, discount: 0, total: 487200 }
  ];

  const purchaseOrder = await upsertFirst(
    prisma.purchaseOrder,
    { poNumber: 'PO-2026-0001' },
    {
      tenantId,
      poNumber: 'PO-2026-0001',
      requisitionId: requisition.id,
      vendorId: vendor.id,
      title: 'Steel sheet purchase order',
      description: 'Approved PO for raw material procurement.',
      orderDate: addDays(-8),
      expectedDeliveryDate: addDays(-2),
      actualDeliveryDate: addDays(-2),
      status: 'RECEIVED',
      items: purchaseOrderItems,
      subtotal: 435000,
      taxAmount: 52200,
      discountAmount: 0,
      shippingCost: 5000,
      totalAmount: 492200,
      paymentTerms: 'NET30',
      paymentStatus: 'PARTIAL',
      paidAmount: 200000,
      shippingAddress: 'Ahmedabad Headquarters',
      shippingMethod: 'Road Freight',
      trackingNumber: 'PO-FRT-0001',
      approvalStatus: 'APPROVED',
      approvedBy: users.admin.id,
      approvedAt: addDays(-8),
      notes: 'Delivered at main warehouse.',
      internalNotes: 'Quality inspection passed.',
      createdBy: users.finance.id
    }
  );

  await upsertFirst(
    prisma.goodsReceipt,
    { receiptNumber: 'GRN-2026-0001' },
    {
      tenantId,
      receiptNumber: 'GRN-2026-0001',
      purchaseOrderId: purchaseOrder.id,
      receivedDate: addDays(-2),
      receivedBy: users.admin.id,
      items: [
        { itemName: items.steelSheet.name, orderedQty: 150, receivedQty: 150, rejectedQty: 0, condition: 'GOOD', notes: 'Accepted into stock' }
      ],
      status: 'ACCEPTED',
      qualityStatus: 'PASSED',
      warehouseLocation: warehouse.name,
      notes: 'All units received in good condition.'
    }
  );

  await upsertFirst(
    prisma.supplierEvaluation,
    { tenantId, vendorId: vendor.id, evaluationPeriod: 'Q1-2026' },
    {
      tenantId,
      vendorId: vendor.id,
      evaluatedBy: users.finance.id,
      evaluationDate: addDays(-1),
      evaluationPeriod: 'Q1-2026',
      qualityRating: 4.5,
      deliveryRating: 4.2,
      priceRating: 4.0,
      serviceRating: 4.1,
      communicationRating: 4.6,
      overallRating: 4.3,
      onTimeDeliveryRate: 95,
      defectRate: 1.2,
      responseTime: '8 hours',
      strengths: 'Responsive and predictable delivery.',
      weaknesses: 'Limited weekend support.',
      recommendations: 'Retain as preferred supplier.',
      status: 'COMPLETED',
      notes: 'Positive vendor performance for seed data.'
    }
  );

  const apBill = await upsertFirst(
    prisma.aPBill,
    { billNumber: 'BILL-2026-0001' },
    {
      tenantId,
      billNumber: 'BILL-2026-0001',
      vendorId: vendor.id,
      purchaseOrderId: purchaseOrder.id,
      billDate: addDays(-2),
      dueDate: addDays(28),
      invoiceNumber: 'INV-PM-2291',
      invoiceDate: addDays(-3),
      subtotal: 435000,
      taxAmount: 52200,
      discountAmount: 0,
      shippingCost: 5000,
      totalAmount: 492200,
      paidAmount: 200000,
      balanceAmount: 292200,
      items: [
        { description: items.steelSheet.name, quantity: 150, unitPrice: 2900, amount: 435000, glAccount: '5000' }
      ],
      status: 'PARTIALLY_PAID',
      approvalStatus: 'APPROVED',
      matchedToPO: true,
      matchedToReceipt: true,
      threeWayMatched: true,
      paymentTerms: 'NET30',
      glPosted: true,
      glPostDate: addDays(-1),
      glJournalId: 'JE-2026-0001',
      approvedBy: users.finance.id,
      approvedAt: addDays(-1),
      notes: 'Seeded AP invoice with partial payment.',
      attachments: ['/uploads/ap/vendor-invoice.pdf'],
      createdBy: users.finance.id
    }
  );

  await upsertFirst(
    prisma.payment,
    { paymentNumber: 'PAY-2026-0001' },
    {
      tenantId,
      paymentNumber: 'PAY-2026-0001',
      vendorId: vendor.id,
      paymentDate: addDays(-1),
      amount: 200000,
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'UTR-20260311-0001',
      bankAccount: 'ICICI-OPERATIONS-001',
      status: 'CLEARED',
      clearedDate: addDays(-1),
      allocations: [
        { billId: apBill.id, billNumber: apBill.billNumber, allocatedAmount: 200000 }
      ],
      glPosted: true,
      glPostDate: addDays(-1),
      glJournalId: 'JE-2026-0002',
      notes: 'Partial payment against vendor bill.',
      attachments: ['/uploads/ap/payment-advice.pdf'],
      createdBy: users.finance.id
    }
  );

  const accounts = {};

  for (const account of [
    { key: 'cash', code: '1000', name: 'Cash and Bank', type: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT' },
    { key: 'inventory', code: '1200', name: 'Inventory', type: 'ASSET', category: 'CURRENT_ASSET', normalBalance: 'DEBIT' },
    { key: 'accountsPayable', code: '2000', name: 'Accounts Payable', type: 'LIABILITY', category: 'CURRENT_LIABILITY', normalBalance: 'CREDIT' },
    { key: 'salesRevenue', code: '4000', name: 'Sales Revenue', type: 'REVENUE', category: 'OPERATING_REVENUE', normalBalance: 'CREDIT' },
    { key: 'operatingExpense', code: '5000', name: 'Operating Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE', normalBalance: 'DEBIT' }
  ]) {
    accounts[account.key] = await upsertFirst(
      prisma.chartOfAccounts,
      { tenantId, accountCode: account.code },
      {
        tenantId,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        category: account.category,
        description: `${account.name} seeded for accounting demo`,
        isActive: true,
        isSystem: false,
        normalBalance: account.normalBalance
      }
    );
  }

  await upsertFirst(
    prisma.fiscalYear,
    { tenantId, name: 'FY 2026' },
    {
      tenantId,
      name: 'FY 2026',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.000Z'),
      isClosed: false
    }
  );

  const journalEntry = await upsertFirst(
    prisma.journalEntry,
    { tenantId, entryNumber: 'JE-2026-0001' },
    {
      tenantId,
      entryNumber: 'JE-2026-0001',
      entryDate: addDays(-1),
      postingDate: addDays(-1),
      type: 'STANDARD',
      description: 'Recognize vendor bill for steel sheet purchase',
      referenceType: 'BILL',
      referenceId: apBill.id,
      status: 'POSTED',
      totalDebit: 492200,
      totalCredit: 492200,
      createdBy: users.finance.id,
      approvedBy: users.admin.id,
      approvedAt: addDays(-1),
      postedBy: users.finance.id,
      postedAt: addDays(-1)
    }
  );

  const journalLines = [
    { lineNumber: 1, accountId: accounts.operatingExpense.id, debit: 492200, credit: 0 },
    { lineNumber: 2, accountId: accounts.accountsPayable.id, debit: 0, credit: 492200 }
  ];

  for (const line of journalLines) {
    await upsertFirst(
      prisma.journalEntryLine,
      { journalEntryId: journalEntry.id, lineNumber: line.lineNumber },
      {
        journalEntryId: journalEntry.id,
        accountId: line.accountId,
        lineNumber: line.lineNumber,
        description: 'Seeded journal line',
        debit: line.debit,
        credit: line.credit,
        departmentId: departments.finance.id
      }
    );
  }

  for (const ledger of [
    {
      accountId: accounts.operatingExpense.id,
      referenceId: journalEntry.id,
      description: 'Vendor bill recognition',
      debit: 492200,
      credit: 0,
      balance: 492200
    },
    {
      accountId: accounts.accountsPayable.id,
      referenceId: journalEntry.id,
      description: 'Accounts payable recorded',
      debit: 0,
      credit: 492200,
      balance: 492200
    }
  ]) {
    await upsertFirst(
      prisma.ledgerEntry,
      { tenantId, accountId: ledger.accountId, referenceId: ledger.referenceId },
      {
        tenantId,
        accountId: ledger.accountId,
        date: addDays(-1),
        description: ledger.description,
        debit: ledger.debit,
        credit: ledger.credit,
        balance: ledger.balance,
        referenceType: 'JOURNAL_ENTRY',
        referenceId: ledger.referenceId,
        journalEntryId: journalEntry.id
      }
    );
  }

  return { vendor, requisition, purchaseOrder, apBill, accounts, journalEntry };
};

const seedProjectsAndAssets = async (tenantId, employees, departments, users) => {
  const project = await upsertFirst(
    prisma.project,
    { projectCode: 'PRJ-2026-0001' },
    {
      tenantId,
      projectCode: 'PRJ-2026-0001',
      projectName: 'Factory Digitization Rollout',
      description: 'Cross-functional deployment of ERP, analytics, and control systems.',
      clientName: 'Acme Manufacturing Ltd',
      projectManager: employees.manager.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'CLIENT',
      startDate: addDays(-30),
      endDate: addDays(45),
      actualStartDate: addDays(-28),
      estimatedBudget: 850000,
      actualCost: 320000,
      progressPercent: 46,
      totalPlannedHours: 720,
      totalActualHours: 314,
      totalResourceCost: 248000,
      budgetVariance: -530000,
      scheduleVariance: -2,
      utilizationPercent: 78,
      healthScore: 'GREEN',
      riskLevel: 'MEDIUM',
      departmentId: departments.engineering.id,
      customFields: { region: 'West', vertical: 'Manufacturing' },
      notes: 'Demo implementation project with linked time and budget data.',
      attachments: ['/uploads/projects/project-charter.pdf'],
      createdBy: users.manager.id
    }
  );

  const projectMembers = [
    { employee: employees.manager, userId: users.manager.id, role: 'PROJECT_MANAGER', allocationPercent: 60 },
    { employee: employees.employee, userId: users.employee.id, role: 'DEVELOPER', allocationPercent: 100 },
    { employee: employees.finance, userId: users.finance.id, role: 'FINANCE_CONTROLLER', allocationPercent: 20 }
  ];

  for (const member of projectMembers) {
    await upsertFirst(
      prisma.projectMember,
      { projectId: project.id, employeeId: member.employee.id },
      {
        tenantId,
        projectId: project.id,
        employeeId: member.employee.id,
        userId: member.userId,
        role: member.role,
        allocationPercent: member.allocationPercent,
        startDate: addDays(-28),
        status: 'ACTIVE',
        hourlyRate: member.role === 'PROJECT_MANAGER' ? 1800 : 1200,
        permissions: { canApproveTime: member.role === 'PROJECT_MANAGER' },
        notes: 'Seeded project member'
      }
    );
  }

  const milestone1 = await upsertFirst(
    prisma.projectMilestone,
    { projectId: project.id, milestoneName: 'Core ERP Configuration' },
    {
      tenantId,
      projectId: project.id,
      milestoneName: 'Core ERP Configuration',
      description: 'Tenant bootstrap, module enablement, and workflow baseline.',
      status: 'COMPLETED',
      startDate: addDays(-28),
      dueDate: addDays(-7),
      completedDate: addDays(-6),
      progressPercent: 100,
      assignedTo: employees.manager.id,
      deliverables: [{ name: 'Configured tenant', status: 'DONE' }, { name: 'Seeded workflows', status: 'DONE' }],
      isCriticalPath: true,
      isAutoScheduled: false,
      notes: 'Completed successfully.',
      createdBy: users.manager.id
    }
  );

  const milestone2 = await upsertFirst(
    prisma.projectMilestone,
    { projectId: project.id, milestoneName: 'Manufacturing Dashboard Go-Live' },
    {
      tenantId,
      projectId: project.id,
      milestoneName: 'Manufacturing Dashboard Go-Live',
      description: 'Launch production dashboard and plant KPIs.',
      status: 'IN_PROGRESS',
      startDate: addDays(-5),
      dueDate: addDays(12),
      progressPercent: 55,
      assignedTo: employees.employee.id,
      deliverables: [{ name: 'Dashboard widgets', status: 'IN_PROGRESS' }],
      isCriticalPath: true,
      isAutoScheduled: true,
      notes: 'Depends on manufacturing data validation.',
      createdBy: users.manager.id
    }
  );

  await upsertFirst(
    prisma.projectMilestoneDependency,
    { predecessorId: milestone1.id, successorId: milestone2.id },
    {
      tenantId,
      predecessorId: milestone1.id,
      successorId: milestone2.id,
      dependencyType: 'FS',
      lagDays: 1
    }
  );

  await upsertFirst(
    prisma.projectResource,
    { projectId: project.id, resourceName: 'Implementation Squad' },
    {
      tenantId,
      projectId: project.id,
      resourceType: 'HUMAN',
      resourceName: 'Implementation Squad',
      employeeId: employees.employee.id,
      allocationPercent: 100,
      startDate: addDays(-28),
      endDate: addDays(20),
      costPerUnit: 1200,
      units: 160,
      totalCost: 192000,
      plannedHours: 160,
      actualHours: 124,
      availableHours: 36,
      quantity: 1,
      quantityUsed: 1,
      quantityUnit: 'person',
      status: 'ACTIVE'
    }
  );

  await upsertFirst(
    prisma.projectBudget,
    { projectId: project.id, category: 'LABOR' },
    {
      tenantId,
      projectId: project.id,
      category: 'LABOR',
      description: 'Engineering and delivery labor budget',
      plannedAmount: 450000,
      actualAmount: 192000,
      variance: -258000,
      budgetPeriod: 'Q1-2026',
      transactionDate: addDays(-2),
      notes: 'Healthy variance at mid-project checkpoint.',
      createdBy: users.finance.id
    }
  );

  const timesheet = await upsertFirst(
    prisma.projectTimesheet,
    { tenantId, employeeId: employees.employee.id, weekStartDate: new Date('2026-03-09T00:00:00.000Z') },
    {
      tenantId,
      employeeId: employees.employee.id,
      weekStartDate: new Date('2026-03-09T00:00:00.000Z'),
      weekEndDate: new Date('2026-03-15T23:59:59.000Z'),
      status: 'SUBMITTED',
      totalHours: 41.5,
      billableHours: 38,
      submittedAt: addDays(-1),
      submittedBy: users.employee.id,
      notes: 'Seeded weekly timesheet.'
    }
  );

  await upsertFirst(
    prisma.projectTimeLog,
    { projectId: project.id, employeeId: employees.employee.id, taskDescription: 'Built project analytics widgets' },
    {
      tenantId,
      projectId: project.id,
      employeeId: employees.employee.id,
      timesheetId: timesheet.id,
      logDate: addDays(-1),
      hoursWorked: 7.5,
      taskDescription: 'Built project analytics widgets',
      milestoneId: milestone2.id,
      billable: true,
      hourlyRate: 1200,
      totalCost: 9000,
      status: 'LOGGED',
      notes: 'Dashboard work and QA fixes.'
    }
  );

  const projectTasks = [
    {
      title: `Project ${project.projectCode}: Build KPI dashboards`,
      description: `Implement milestone analytics views for ${project.projectName}.`,
      employeeId: employees.employee.id,
      assignedBy: employees.manager.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: addDays(5),
      reportTitle: `Task update: KPI dashboards for ${project.projectCode}`,
      reportDescription: 'Completed chart components, pending final QA and accessibility review.',
      hoursSpent: 7.5
    },
    {
      title: `Project ${project.projectCode}: Validate budget utilization`,
      description: `Review budget variance and utilization tracking for ${project.projectName}.`,
      employeeId: employees.finance.id,
      assignedBy: employees.manager.id,
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: addDays(7),
      reportTitle: `Task update: Budget utilization check for ${project.projectCode}`,
      reportDescription: 'Draft variance checkpoints prepared for weekly steering review.',
      hoursSpent: 3.25
    }
  ];

  for (const taskSpec of projectTasks) {
    const seededTask = await upsertFirst(
      prisma.task,
      { tenantId, title: taskSpec.title },
      {
        tenantId,
        employeeId: taskSpec.employeeId,
        assignedBy: taskSpec.assignedBy,
        title: taskSpec.title,
        description: taskSpec.description,
        priority: taskSpec.priority,
        status: taskSpec.status,
        dueDate: taskSpec.dueDate
      },
      {
        employeeId: taskSpec.employeeId,
        assignedBy: taskSpec.assignedBy,
        description: taskSpec.description,
        priority: taskSpec.priority,
        status: taskSpec.status,
        dueDate: taskSpec.dueDate
      }
    );

    await upsertFirst(
      prisma.workReport,
      { tenantId, title: taskSpec.reportTitle },
      {
        tenantId,
        employeeId: taskSpec.employeeId,
        taskId: seededTask.id,
        title: taskSpec.reportTitle,
        description: taskSpec.reportDescription,
        workDate: addDays(-1),
        hoursSpent: taskSpec.hoursSpent,
        attachments: [`/uploads/reports/${project.projectCode.toLowerCase()}-${taskSpec.employeeId.slice(0, 6)}.pdf`]
      },
      {
        taskId: seededTask.id,
        description: taskSpec.reportDescription,
        workDate: addDays(-1),
        hoursSpent: taskSpec.hoursSpent
      }
    );
  }

  const assetCategory = await upsertFirst(
    prisma.assetCategory,
    { tenantId, code: 'LAPTOP' },
    {
      tenantId,
      name: 'Laptop',
      code: 'LAPTOP',
      description: 'Portable computing assets',
      defaultDepreciationMethod: 'STRAIGHT_LINE',
      defaultDepreciationRate: 33,
      defaultUsefulLife: 36,
      isActive: true
    }
  );

  const asset = await upsertFirst(
    prisma.asset,
    { tenantId, assetCode: 'AST-2026-0001' },
    {
      tenantId,
      categoryId: assetCategory.id,
      assetCode: 'AST-2026-0001',
      name: 'Dell Precision Demo Laptop',
      description: 'Assigned to engineering team member.',
      purchaseDate: addDays(-90),
      purchasePrice: 92000,
      vendor: 'TechSource India',
      invoiceNumber: 'TECH-9912',
      serialNumber: 'DL-PREC-2026-001',
      model: 'Precision 5570',
      manufacturer: 'Dell',
      location: 'Ahmedabad HQ',
      status: 'ALLOCATED',
      condition: 'GOOD',
      depreciationMethod: 'STRAIGHT_LINE',
      depreciationRate: 33,
      usefulLife: 36,
      salvageValue: 10000,
      currentValue: 85000,
      accumulatedDepreciation: 7000,
      warrantyExpiry: addDays(275),
      insuranceExpiry: addDays(275),
      insuranceProvider: 'HDFC Ergo',
      insurancePolicyNo: 'POL-2026-001',
      notes: 'Seeded asset allocation example.',
      tags: ['engineering', 'portable']
    }
  );

  await upsertFirst(
    prisma.assetAllocation,
    { tenantId, assetId: asset.id, employeeId: employees.employee.id },
    {
      tenantId,
      assetId: asset.id,
      employeeId: employees.employee.id,
      allocatedDate: addDays(-30),
      expectedReturnDate: addDays(330),
      status: 'ACTIVE',
      purpose: 'Daily development work',
      allocatedBy: users.admin.id,
      location: 'Ahmedabad HQ',
      notes: 'Primary laptop issued to engineer.'
    }
  );

  await upsertFirst(
    prisma.assetMaintenance,
    { tenantId, assetId: asset.id, description: 'Quarterly preventive inspection' },
    {
      tenantId,
      assetId: asset.id,
      maintenanceType: 'PREVENTIVE',
      scheduledDate: addDays(20),
      status: 'SCHEDULED',
      statusBeforeMaintenance: 'ALLOCATED',
      description: 'Quarterly preventive inspection',
      performedBy: 'Internal IT Team',
      cost: 0,
      conditionBefore: 'GOOD',
      nextMaintenanceDate: addDays(110),
      notes: 'Routine health check scheduled.'
    }
  );

  await upsertFirst(
    prisma.assetDepreciation,
    { tenantId, assetId: asset.id, year: 2026, month: 3 },
    {
      tenantId,
      assetId: asset.id,
      period: new Date('2026-03-31T00:00:00.000Z'),
      year: 2026,
      month: 3,
      openingValue: 88000,
      depreciationAmount: 3000,
      closingValue: 85000,
      accumulatedDepreciation: 7000,
      method: 'STRAIGHT_LINE',
      rate: 33,
      notes: 'Monthly seeded depreciation run.'
    }
  );

  return { project, assetCategory, asset, timesheet };
};

const seedDocumentsReportsCommunication = async (tenantId, users, customer, deal, project) => {
  const folder = await upsertFirst(
    prisma.documentFolder,
    { tenantId, name: 'Operations', path: '/operations' },
    {
      tenantId,
      name: 'Operations',
      description: 'Operational manuals and plans',
      path: '/operations',
      color: '#2563EB',
      icon: 'FolderCog',
      createdBy: users.admin.id
    }
  );

  const template = await upsertFirst(
    prisma.documentTemplate,
    { tenantId, name: 'Implementation Plan Template' },
    {
      tenantId,
      name: 'Implementation Plan Template',
      description: 'Reusable template for delivery plans',
      category: 'REPORT',
      fileName: 'implementation-plan-template.docx',
      storagePath: '/templates/implementation-plan-template.docx',
      fileSize: 182000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fields: [
        { name: 'customerName', type: 'text', required: true },
        { name: 'projectName', type: 'text', required: true }
      ],
      usageCount: 3,
      isActive: true,
      createdBy: users.admin.id
    }
  );

  const document = await upsertFirst(
    prisma.document,
    { tenantId, fileName: 'factory-digitization-rollout.pdf' },
    {
      tenantId,
      folderId: folder.id,
      name: 'Factory Digitization Rollout',
      description: 'Delivery plan and milestones for the customer project.',
      fileName: 'factory-digitization-rollout.pdf',
      fileSize: 268000,
      mimeType: 'application/pdf',
      storagePath: '/documents/factory-digitization-rollout.pdf',
      storageProvider: 'LOCAL',
      checksum: 'demo-checksum-rollout-001',
      tags: ['project', 'delivery', 'customer'],
      metadata: {
        customerName: customer.name,
        dealNumber: deal.dealNumber,
        projectCode: project.projectCode
      },
      version: 1,
      isLatest: true,
      status: 'ACTIVE',
      isPublic: false,
      downloadCount: 4,
      viewCount: 12,
      isTemplate: false,
      templateId: template.id,
      createdBy: users.manager.id,
      updatedBy: users.manager.id
    }
  );

  await upsertFirst(
    prisma.documentVersion,
    { documentId: document.id, versionNumber: 1 },
    {
      documentId: document.id,
      versionNumber: 1,
      fileName: 'factory-digitization-rollout-v1.pdf',
      fileSize: 268000,
      storagePath: '/documents/versions/factory-digitization-rollout-v1.pdf',
      checksum: 'demo-checksum-rollout-v1',
      changeLog: 'Initial approved version',
      createdBy: users.manager.id
    }
  );

  const documentShare = await upsertFirst(
    prisma.documentShare,
    { documentId: document.id, shareToken: 'doc-share-demo-001' },
    {
      documentId: document.id,
      shareType: 'LINK',
      shareToken: 'doc-share-demo-001',
      expiresAt: addDays(30),
      maxDownloads: 25,
      downloadCount: 4,
      canView: true,
      canDownload: true,
      canEdit: false,
      canShare: true,
      isActive: true,
      createdBy: users.manager.id
    }
  );

  await upsertFirst(
    prisma.documentPermission,
    { documentId: document.id, userId: users.employee.id },
    {
      documentId: document.id,
      userId: users.employee.id,
      canView: true,
      canEdit: true,
      canDelete: false,
      canShare: false,
      canManage: false
    }
  );

  await upsertFirst(
    prisma.documentFolderPermission,
    { folderId: folder.id, userId: users.employee.id },
    {
      folderId: folder.id,
      userId: users.employee.id,
      canView: true,
      canEdit: true,
      canDelete: false,
      canCreate: true,
      canManage: false
    }
  );

  await upsertFirst(
    prisma.documentActivity,
    { tenantId, documentId: document.id, action: 'VIEWED' },
    {
      tenantId,
      documentId: document.id,
      shareId: documentShare.id,
      userId: users.employee.id,
      action: 'VIEWED',
      details: { source: 'seed-demo' },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script'
    }
  );

  await upsertFirst(
    prisma.documentComment,
    { documentId: document.id, userId: users.employee.id, content: 'Reviewed and ready for stakeholder signoff.' },
    {
      documentId: document.id,
      userId: users.employee.id,
      content: 'Reviewed and ready for stakeholder signoff.'
    }
  );

  const reportTemplate = await upsertFirst(
    prisma.reportTemplate,
    { tenantId, name: 'Inventory Health Snapshot' },
    {
      tenantId,
      name: 'Inventory Health Snapshot',
      type: 'INVENTORY',
      category: 'STOCK_REPORT',
      description: 'Summary of stock, reorder risk, and warehouse occupancy.',
      isSystem: false,
      isActive: true,
      config: {
        columns: ['item', 'availableQty', 'reservedQty', 'reorderPoint'],
        filters: { warehouse: 'MAIN-WH' }
      },
      createdBy: users.admin.id
    }
  );

  await upsertFirst(
    prisma.report,
    { tenantId, name: 'Inventory Snapshot - March 2026' },
    {
      tenantId,
      templateId: reportTemplate.id,
      name: 'Inventory Snapshot - March 2026',
      type: 'INVENTORY',
      parameters: {
        asOfDate: '2026-03-13',
        warehouse: 'MAIN-WH'
      },
      data: {
        summary: {
          activeItems: 4,
          lowStockItems: 0,
          warehouseUtilization: 68
        }
      },
      generatedBy: users.admin.id,
      generatedAt: addDays(0)
    }
  );

  await upsertFirst(
    prisma.reportSchedule,
    { tenantId, name: 'Weekly Inventory Snapshot' },
    {
      tenantId,
      templateId: reportTemplate.id,
      name: 'Weekly Inventory Snapshot',
      frequency: 'WEEKLY',
      recipients: ['ops@ueorms.local', 'finance@ueorms.local'],
      isActive: true,
      lastRunAt: addDays(-7),
      nextRunAt: addDays(0),
      createdBy: users.admin.id
    }
  );

  const salesReportTemplate = await upsertFirst(
    prisma.reportTemplate,
    { tenantId, name: 'Sales Analytics Overview' },
    {
      tenantId,
      name: 'Sales Analytics Overview',
      type: 'CUSTOM',
      category: 'SALES_ANALYTICS',
      description: 'Tracks pipeline health, conversion, and revenue realization.',
      isSystem: false,
      isActive: true,
      config: {
        columns: ['pipeline', 'openDeals', 'wonDeals', 'conversionRate', 'invoicedRevenue'],
        filters: { period: 'LAST_30_DAYS' }
      },
      createdBy: users.sales.id
    }
  );

  const financeReportTemplate = await upsertFirst(
    prisma.reportTemplate,
    { tenantId, name: 'Finance Approvals Dashboard' },
    {
      tenantId,
      name: 'Finance Approvals Dashboard',
      type: 'FINANCIAL',
      category: 'APPROVAL_ANALYTICS',
      description: 'Pending/approved finance approvals with aging and throughput.',
      isSystem: false,
      isActive: true,
      config: {
        columns: ['module', 'status', 'ageingDays', 'requestedAmount', 'approvedAmount'],
        filters: { module: 'FINANCE' }
      },
      createdBy: users.finance.id
    }
  );

  const hrReportTemplate = await upsertFirst(
    prisma.reportTemplate,
    { tenantId, name: 'Attendance and Leave Analytics' },
    {
      tenantId,
      name: 'Attendance and Leave Analytics',
      type: 'HR',
      category: 'EMPLOYEE_ANALYTICS',
      description: 'Attendance, overtime, and leave trends for HR monitoring.',
      isSystem: false,
      isActive: true,
      config: {
        columns: ['employee', 'presentDays', 'leaveDays', 'overtimeHours', 'attendancePercentage'],
        filters: { month: 'CURRENT_MONTH' }
      },
      createdBy: users.manager.id
    }
  );

  const assetReportTemplate = await upsertFirst(
    prisma.reportTemplate,
    { tenantId, name: 'Asset Management Dashboard' },
    {
      tenantId,
      name: 'Asset Management Dashboard',
      type: 'CUSTOM',
      category: 'ASSET_ANALYTICS',
      description: 'Asset utilization, allocation, depreciation, and maintenance KPIs.',
      isSystem: false,
      isActive: true,
      config: {
        columns: ['assetCode', 'status', 'allocatedTo', 'currentValue', 'nextMaintenanceDate'],
        filters: { includeDepreciation: true }
      },
      createdBy: users.admin.id
    }
  );

  const recentReports = [
    {
      name: 'Sales Analytics - Last 30 Days',
      type: 'CUSTOM',
      templateId: salesReportTemplate.id,
      generatedBy: users.sales.id,
      generatedAt: addDays(-1),
      parameters: {
        period: 'LAST_30_DAYS',
        pipeline: 'Sales Pipeline'
      },
      data: {
        summary: {
          openDeals: 5,
          wonDeals: 2,
          conversionRate: 40,
          invoicedRevenue: 289000,
          averageDealSize: 57800
        }
      }
    },
    {
      name: 'Attendance and Leave Trend - Current Month',
      type: 'HR',
      templateId: hrReportTemplate.id,
      generatedBy: users.manager.id,
      generatedAt: addDays(-2),
      parameters: {
        month: 'CURRENT',
        includeOvertime: true
      },
      data: {
        summary: {
          activeEmployees: 20,
          avgAttendancePercent: 92.4,
          approvedLeaves: 4,
          pendingLeaves: 2,
          overtimeHours: 9.7
        }
      }
    },
    {
      name: 'Finance Approvals Aging - Weekly',
      type: 'FINANCIAL',
      templateId: financeReportTemplate.id,
      generatedBy: users.finance.id,
      generatedAt: addDays(-3),
      parameters: {
        window: '7_DAYS',
        module: 'FINANCE'
      },
      data: {
        summary: {
          totalRequests: 8,
          approved: 5,
          pending: 3,
          avgApprovalHours: 11.8,
          totalApprovedAmount: 707200
        }
      }
    },
    {
      name: 'Asset Utilization and Depreciation - Monthly',
      type: 'CUSTOM',
      templateId: assetReportTemplate.id,
      generatedBy: users.admin.id,
      generatedAt: addDays(-4),
      parameters: {
        month: 'CURRENT',
        groupBy: 'CATEGORY'
      },
      data: {
        summary: {
          totalAssets: 1,
          allocatedAssets: 1,
          maintenanceDueIn30Days: 1,
          monthlyDepreciation: 3000,
          currentAssetValue: 85000
        }
      }
    }
  ];

  for (const reportSpec of recentReports) {
    await upsertFirst(
      prisma.report,
      { tenantId, name: reportSpec.name },
      {
        tenantId,
        templateId: reportSpec.templateId,
        name: reportSpec.name,
        type: reportSpec.type,
        parameters: reportSpec.parameters,
        data: reportSpec.data,
        generatedBy: reportSpec.generatedBy,
        generatedAt: reportSpec.generatedAt
      },
      {
        templateId: reportSpec.templateId,
        type: reportSpec.type,
        parameters: reportSpec.parameters,
        data: reportSpec.data,
        generatedBy: reportSpec.generatedBy,
        generatedAt: reportSpec.generatedAt
      }
    );
  }

  await upsertFirst(
    prisma.reportSchedule,
    { tenantId, name: 'Daily Sales Analytics' },
    {
      tenantId,
      templateId: salesReportTemplate.id,
      name: 'Daily Sales Analytics',
      frequency: 'DAILY',
      recipients: ['sales@ueorms.local', 'admin@ueorms.local'],
      isActive: true,
      lastRunAt: addDays(-1),
      nextRunAt: addDays(0),
      createdBy: users.sales.id
    }
  );

  await upsertFirst(
    prisma.reportSchedule,
    { tenantId, name: 'Monthly Asset Dashboard' },
    {
      tenantId,
      templateId: assetReportTemplate.id,
      name: 'Monthly Asset Dashboard',
      frequency: 'MONTHLY',
      recipients: ['it@ueorms.local', 'finance@ueorms.local'],
      isActive: true,
      lastRunAt: addDays(-10),
      nextRunAt: addDays(20),
      createdBy: users.admin.id
    }
  );

  const conversation = await upsertFirst(
    prisma.conversation,
    { tenantId, name: 'Project Rollout Room' },
    {
      tenantId,
      type: 'GROUP',
      name: 'Project Rollout Room',
      description: 'Cross-functional rollout communication channel',
      createdBy: users.manager.id,
      isArchived: false,
      lastMessageAt: addHours(-1)
    }
  );

  for (const participant of [users.manager.id, users.employee.id, users.finance.id]) {
    await upsertFirst(
      prisma.conversationParticipant,
      { conversationId: conversation.id, userId: participant },
      {
        conversationId: conversation.id,
        userId: participant,
        role: participant === users.manager.id ? 'ADMIN' : 'MEMBER',
        isMuted: false,
        lastReadAt: addHours(-1)
      }
    );
  }

  const message = await upsertFirst(
    prisma.message,
    { conversationId: conversation.id, senderId: users.manager.id, content: 'Deployment checklist is ready for final review.' },
    {
      conversationId: conversation.id,
      senderId: users.manager.id,
      content: 'Deployment checklist is ready for final review.',
      type: 'TEXT',
      mentionedUserIds: [users.employee.id, users.finance.id]
    }
  );

  await upsertFirst(
    prisma.messageReaction,
    { messageId: message.id, userId: users.employee.id, emoji: ':thumbsup:' },
    {
      messageId: message.id,
      userId: users.employee.id,
      emoji: ':thumbsup:'
    }
  );

  await upsertFirst(
    prisma.messageReadReceipt,
    { messageId: message.id, userId: users.employee.id },
    {
      messageId: message.id,
      userId: users.employee.id,
      readAt: addMinutesSafe(5)
    }
  );

  const announcement = await upsertFirst(
    prisma.announcement,
    { tenantId, title: 'Quarter-end readiness drill' },
    {
      tenantId,
      title: 'Quarter-end readiness drill',
      content: 'Quarter-end reporting and close activities will run this Friday at 4 PM.',
      priority: 'HIGH',
      targetType: 'ALL',
      attachments: ['/uploads/announcements/quarter-end-drill.pdf'],
      publishedBy: users.admin.id,
      publishedAt: addDays(-1),
      expiresAt: addDays(10),
      isPinned: true,
      isActive: true
    }
  );

  await upsertFirst(
    prisma.announcementRead,
    { announcementId: announcement.id, userId: users.employee.id },
    {
      announcementId: announcement.id,
      userId: users.employee.id,
      readAt: addDays(0)
    }
  );

  await upsertFirst(
    prisma.emailTemplate,
    { tenantId, code: 'PROJECT_STATUS_UPDATE' },
    {
      tenantId,
      name: 'Project Status Update',
      code: 'PROJECT_STATUS_UPDATE',
      subject: 'Weekly project status update',
      body: '<p>Hello {{name}}, here is your weekly project update.</p>',
      variables: ['name', 'projectName', 'status'],
      isSystem: false,
      isActive: true,
      createdBy: users.admin.id
    }
  );

  await upsertFirst(
    prisma.emailLog,
    { tenantId, to: 'stakeholder@acme.example.com', subject: 'Weekly project status update' },
    {
      tenantId,
      to: 'stakeholder@acme.example.com',
      subject: 'Weekly project status update',
      body: '<p>Project is on track for the next milestone.</p>',
      status: 'SENT',
      sentAt: addDays(-1),
      metadata: { projectCode: project.projectCode }
    }
  );

  await upsertFirst(
    prisma.emailQueue,
    { tenantId, to: 'ops@ueorms.local', subject: 'Daily warehouse summary' },
    {
      tenantId,
      to: 'ops@ueorms.local',
      subject: 'Daily warehouse summary',
      body: '<p>Warehouse summary queued by demo seed.</p>',
      status: 'PENDING',
      priority: 3,
      attempts: 0,
      maxAttempts: 3,
      scheduledAt: addHours(1),
      metadata: { module: 'INVENTORY' }
    }
  );

  const chatChannel = await upsertFirst(
    prisma.chatChannel,
    { tenantId, name: 'engineering-updates' },
    {
      tenantId,
      name: 'engineering-updates',
      description: 'Engineering daily sync channel',
      type: 'PUBLIC',
      departmentId: project.departmentId,
      projectId: project.id,
      createdBy: users.manager.id,
      isArchived: false
    }
  );

  for (const member of [users.manager.id, users.employee.id]) {
    await upsertFirst(
      prisma.chatChannelMember,
      { channelId: chatChannel.id, userId: member },
      {
        channelId: chatChannel.id,
        userId: member,
        role: member === users.manager.id ? 'ADMIN' : 'MEMBER',
        isMuted: false
      }
    );
  }

  return { folder, template, document, reportTemplate, conversation, announcement };
};

const addMinutesSafe = (minutes) => new Date(Date.now() + (minutes * 60 * 1000));

const seedWorkflowsNotificationsAndCustomizations = async (tenantId, users, employees, leaveRequest, expenseClaim, project) => {
  const workflowSpecs = [
    { module: 'INVENTORY', action: 'CREATE', permission: 'inventory.approve' },
    { module: 'INVENTORY', action: 'UPDATE', permission: 'inventory.approve' },
    { module: 'FINANCE', action: 'EXPENSE_CLAIM', permission: 'expense.approve' },
    { module: 'HR', action: 'LEAVE_REQUEST', permission: 'leave.approve' }
  ];

  const workflowMap = {};
  for (const spec of workflowSpecs) {
    const workflow = await upsertFirst(
      prisma.workflow,
      { tenantId, module: spec.module, action: spec.action },
      {
        tenantId,
        module: spec.module,
        action: spec.action,
        status: 'ACTIVE'
      }
    );

    await upsertFirst(
      prisma.workflowStep,
      { workflowId: workflow.id, stepOrder: 1 },
      {
        workflowId: workflow.id,
        stepOrder: 1,
        permission: spec.permission
      }
    );

    workflowMap[`${spec.module}:${spec.action}`] = workflow;
  }

  const leaveWorkflow = workflowMap['HR:LEAVE_REQUEST'];
  const leaveWorkflowStep = await prisma.workflowStep.findFirst({ where: { workflowId: leaveWorkflow.id, stepOrder: 1 } });

  const workflowRequest = await upsertFirst(
    prisma.workflowRequest,
    { tenantId, module: 'HR', action: 'LEAVE_REQUEST', createdBy: users.employee.id },
    {
      tenantId,
      workflowId: leaveWorkflow.id,
      module: 'HR',
      action: 'LEAVE_REQUEST',
      payload: {
        leaveRequestId: leaveRequest.id,
        employeeId: employees.employee.id
      },
      status: 'COMPLETED',
      createdBy: users.employee.id,
      requestedBy: users.employee.id
    }
  );

  await upsertFirst(
    prisma.approval,
    { workflowId: leaveWorkflow.id, workflowRequestId: workflowRequest.id, stepOrder: 1 },
    {
      workflowId: leaveWorkflow.id,
      workflowRequestId: workflowRequest.id,
      workflowStepId: leaveWorkflowStep?.id,
      stepOrder: 1,
      permission: 'leave.approve',
      data: { leaveRequestId: leaveRequest.id },
      tenantId,
      approvedBy: users.manager.id,
      approvedAt: addDays(-1),
      status: 'APPROVED',
      comment: 'Approved for planned leave.'
    }
  );

  await upsertFirst(
    prisma.workflowTemplate,
    { name: 'Manufacturing Purchase Approval' },
    {
      name: 'Manufacturing Purchase Approval',
      description: 'Template for raw material approval flow',
      industry: 'MANUFACTURING',
      module: 'INVENTORY',
      steps: [
        { stepOrder: 1, role: 'MANAGER' },
        { stepOrder: 2, role: 'ADMIN' }
      ],
      isDefault: true
    }
  );

  await upsertFirst(
    prisma.approvalMatrix,
    { tenantId, module: 'EXPENSE' },
    {
      tenantId,
      module: 'EXPENSE',
      conditions: {
        thresholds: [
          { min: 0, max: 5000, approvers: 1 },
          { min: 5001, max: 50000, approvers: 2 }
        ]
      },
      approvers: {
        level1: 'MANAGER',
        level2: 'ADMIN'
      }
    }
  );

  await upsertFirst(
    prisma.customField,
    { tenantId, module: 'PROJECT', fieldName: 'Customer Risk Rating' },
    {
      tenantId,
      module: 'PROJECT',
      fieldName: 'Customer Risk Rating',
      fieldType: 'DROPDOWN',
      options: ['LOW', 'MEDIUM', 'HIGH'],
      required: false
    }
  );

  for (const notification of [
    {
      employeeId: employees.employee.id,
      type: 'TASK_ASSIGNED',
      title: 'Task assigned',
      message: 'Complete Q1 rollout checklist by due date.',
      isRead: false
    },
    {
      employeeId: employees.finance.id,
      type: 'SALARY_UPDATE',
      title: 'Payroll processed',
      message: 'March 2026 payroll has been processed successfully.',
      isRead: true
    }
  ]) {
    await upsertFirst(
      prisma.notification,
      { tenantId, employeeId: notification.employeeId, title: notification.title },
      {
        tenantId,
        employeeId: notification.employeeId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead
      }
    );
  }

  await upsertFirst(
    prisma.auditLog,
    { tenantId, action: 'SEED_DEMO_DATA', entity: 'SYSTEM', entityId: tenantId },
    {
      userId: users.admin.id,
      tenantId,
      action: 'SEED_DEMO_DATA',
      entity: 'SYSTEM',
      entityId: tenantId,
      meta: {
        seededModules: ALL_MODULE_KEYS,
        projectCode: project.projectCode,
        expenseClaimTitle: expenseClaim.title
      }
    }
  );
};

const seedBaselineForExistingTenants = async (passwordHash) => {
  const tenants = await prisma.tenant.findMany();

  for (const tenant of tenants) {
    const tenantId = tenant.id;
    const tenantLabel = getTenantLabel(tenant);

    const defaultDepartment = await upsertFirst(
      prisma.department,
      { tenantId, name: 'General' },
      {
        tenantId,
        name: 'General',
        description: 'Default department created by seed baseline.',
        location: 'Head Office',
        status: 'ACTIVE'
      }
    );

    let users = await prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' }
    });

    if (users.length === 0) {
      const seedEmail = `seed-admin+${tenantLabel}@ueorms.local`;
      const seedUser = await prisma.user.upsert({
        where: { email: seedEmail },
        update: {
          password: passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          tenantId,
          departmentId: defaultDepartment.id
        },
        create: {
          email: seedEmail,
          password: passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          tenantId,
          departmentId: defaultDepartment.id
        }
      });

      users = [seedUser];
    }

    const seededEmployees = [];

    for (let index = 0; index < users.length; index += 1) {
      const user = users[index];
      const employee = await upsertFirst(
        prisma.employee,
        { userId: user.id },
        {
          tenantId,
          userId: user.id,
          departmentId: user.departmentId || defaultDepartment.id,
          employeeCode: `SEED-${String(index + 1).padStart(4, '0')}`,
          name: `Seed Employee ${index + 1}`,
          email: user.email,
          phone: null,
          designation: user.role === 'ADMIN' ? 'Administrator' : 'Staff',
          joiningDate: addDays(-30),
          status: 'ACTIVE'
        },
        {
          departmentId: user.departmentId || defaultDepartment.id,
          email: user.email,
          status: 'ACTIVE'
        }
      );

      seededEmployees.push(employee);
    }

    const branch = await upsertFirst(
      prisma.branch,
      { tenantId, code: 'SEED-BR-01' },
      {
        tenantId,
        code: 'SEED-BR-01',
        name: 'Main Branch',
        type: 'BRANCH',
        city: 'Seed City',
        country: 'India',
        isActive: true,
        isMainBranch: true
      }
    );

    const warehouse = await upsertFirst(
      prisma.warehouse,
      { tenantId, code: 'SEED-WH-01' },
      {
        tenantId,
        branchId: branch.id,
        code: 'SEED-WH-01',
        name: 'Main Warehouse',
        type: 'GENERAL',
        city: 'Seed City',
        country: 'India',
        isActive: true
      }
    );

    const inventorySeedItems = [
      { sku: 'SEED-ITEM-001', name: 'Seed Laptop', price: 60000, quantity: 10, category: 'IT' },
      { sku: 'SEED-ITEM-002', name: 'Seed Office Chair', price: 7000, quantity: 25, category: 'Furniture' },
      { sku: 'SEED-ITEM-003', name: 'Seed Raw Material', price: 1800, quantity: 120, category: 'Raw Material' }
    ];

    for (const seedItem of inventorySeedItems) {
      const item = await upsertFirst(
        prisma.item,
        { tenantId, sku: seedItem.sku },
        {
          tenantId,
          name: seedItem.name,
          sku: seedItem.sku,
          price: seedItem.price,
          quantity: seedItem.quantity,
          category: seedItem.category,
          description: 'Baseline inventory item created by seed.'
        },
        {
          name: seedItem.name,
          price: seedItem.price,
          quantity: seedItem.quantity,
          category: seedItem.category
        }
      );

      await upsertFirst(
        prisma.warehouseStock,
        { warehouseId: warehouse.id, itemId: item.id },
        {
          tenantId,
          warehouseId: warehouse.id,
          itemId: item.id,
          quantity: seedItem.quantity,
          reservedQty: 0,
          availableQty: seedItem.quantity,
          reorderPoint: 5,
          reorderQty: 15,
          minStock: 3,
          maxStock: seedItem.quantity + 40,
          avgCost: seedItem.price,
          lastPurchasePrice: seedItem.price
        },
        {
          quantity: seedItem.quantity,
          availableQty: seedItem.quantity,
          avgCost: seedItem.price,
          lastPurchasePrice: seedItem.price
        }
      );
    }

    for (const employee of seededEmployees) {
      const basicSalary = 50000;
      await upsertFirst(
        prisma.salaryStructure,
        { employeeId: employee.id },
        {
          tenantId,
          employeeId: employee.id,
          basicSalary,
          allowances: {
            hra: 10000,
            transport: 2000,
            medical: 1500
          },
          deductions: {
            pf: 6000,
            tax: 3500,
            insurance: 800
          },
          netSalary: 53200,
          effectiveFrom: addDays(-60)
        },
        {
          basicSalary,
          netSalary: 53200
        }
      );
    }

    const payrollCycle = await upsertFirst(
      prisma.payrollCycle,
      { tenantId, name: 'Seed Payroll Cycle' },
      {
        tenantId,
        name: 'Seed Payroll Cycle',
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-03-31T23:59:59.000Z'),
        paymentDate: new Date('2026-04-05T00:00:00.000Z'),
        status: 'COMPLETED',
        totalGross: seededEmployees.length * 63500,
        totalDeductions: seededEmployees.length * 10300,
        totalNet: seededEmployees.length * 53200,
        processedBy: users[0]?.id || null,
        processedAt: addDays(-1),
        notes: 'Baseline payroll cycle created by seed.'
      },
      {
        status: 'COMPLETED',
        totalGross: seededEmployees.length * 63500,
        totalDeductions: seededEmployees.length * 10300,
        totalNet: seededEmployees.length * 53200,
        processedBy: users[0]?.id || null,
        processedAt: addDays(-1)
      }
    );

    for (const employee of seededEmployees) {
      const tenantSuffix = tenantId.slice(0, 8).toUpperCase();
      const payslipNumber = `PS-${tenantLabel}-${tenantSuffix}-${employee.employeeCode}`.toUpperCase();

      await upsertFirst(
        prisma.payslip,
        { payslipNumber },
        {
          tenantId,
          employeeId: employee.id,
          payrollCycleId: payrollCycle.id,
          payslipNumber,
          basicSalary: 50000,
          allowances: {
            hra: 10000,
            transport: 2000,
            medical: 1500
          },
          bonuses: 0,
          overtime: 0,
          grossSalary: 63500,
          taxDeductions: 3500,
          providentFund: 6000,
          insurance: 800,
          otherDeductions: { other: 0 },
          totalDeductions: 10300,
          netSalary: 53200,
          workingDays: 23,
          presentDays: 23,
          absentDays: 0,
          leaveDays: 0,
          overtimeHours: 0,
          status: 'PAID',
          approvedBy: users[0]?.id || null,
          approvedAt: addDays(-1),
          notes: 'Baseline payslip created by seed.'
        },
        {
          payrollCycleId: payrollCycle.id,
          status: 'PAID',
          netSalary: 53200,
          approvedBy: users[0]?.id || null,
          approvedAt: addDays(-1)
        }
      );

      await upsertFirst(
        prisma.salaryDisbursement,
        { tenantId, payrollCycleId: payrollCycle.id, employeeId: employee.id },
        {
          tenantId,
          payrollCycleId: payrollCycle.id,
          employeeId: employee.id,
          amount: 53200,
          paymentMethod: 'BANK_TRANSFER',
          bankAccount: `SEED-${employee.employeeCode}`,
          transactionRef: `SEED-TXN-${employee.employeeCode}`,
          status: 'COMPLETED',
          paymentDate: addDays(-1),
          completedAt: addDays(-1),
          notes: 'Baseline disbursement created by seed.'
        },
        {
          amount: 53200,
          status: 'COMPLETED',
          paymentDate: addDays(-1),
          completedAt: addDays(-1)
        }
      );
    }

    const shift = await upsertFirst(
      prisma.shift,
      { tenantId, code: 'SEED-GS' },
      {
        tenantId,
        name: 'Seed General Shift',
        code: 'SEED-GS',
        startTime: '09:00',
        endTime: '18:00',
        breakDuration: 60,
        workingDays: '1,2,3,4,5',
        isActive: true,
        description: 'Baseline shift created by seed.'
      }
    );

    const overtimePolicy = await upsertFirst(
      prisma.overtimePolicy,
      { tenantId, code: 'SEED-OT' },
      {
        tenantId,
        shiftId: shift.id,
        name: 'Seed Overtime Policy',
        code: 'SEED-OT',
        dailyThreshold: 8,
        weeklyThreshold: 45,
        monthlyThreshold: 180,
        overtimeRate: 1.5,
        weekendRate: 2,
        holidayRate: 2.5,
        isActive: true,
        description: 'Baseline overtime policy created by seed.'
      }
    );

    for (const employee of seededEmployees) {
      await upsertFirst(
        prisma.shiftAssignment,
        { tenantId, employeeId: employee.id, shiftId: shift.id, status: 'ACTIVE' },
        {
          tenantId,
          employeeId: employee.id,
          shiftId: shift.id,
          assignedFrom: addDays(-30),
          status: 'ACTIVE'
        },
        {
          status: 'ACTIVE',
          assignedFrom: addDays(-30)
        }
      );

      const attendanceDate = atTime(new Date(), 0, 0);
      const checkInTime = atTime(new Date(), 9, 10);
      const checkOutTime = atTime(new Date(), 18, 5);

      await prisma.attendance.upsert({
        where: {
          tenantId_employeeId_date: {
            tenantId,
            employeeId: employee.id,
            date: attendanceDate
          }
        },
        update: {
          checkIn: checkInTime,
          checkOut: checkOutTime,
          status: 'PRESENT',
          workHours: 7.92,
          overtimeHours: 0.4
        },
        create: {
          tenantId,
          employeeId: employee.id,
          date: attendanceDate,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          status: 'PRESENT',
          workHours: 7.92,
          overtimeHours: 0.4
        }
      });

      await upsertFirst(
        prisma.timeTracking,
        { tenantId, employeeId: employee.id, date: attendanceDate },
        {
          tenantId,
          employeeId: employee.id,
          date: attendanceDate,
          checkInTime,
          checkOutTime,
          checkInLocation: 'Seed Office',
          checkOutLocation: 'Seed Office',
          workHours: 7.92,
          breakHours: 1,
          status: 'CHECKED_OUT',
          isLate: false,
          notes: 'Baseline time tracking created by seed.'
        },
        {
          checkOutTime,
          workHours: 7.92,
          status: 'CHECKED_OUT',
          notes: 'Baseline time tracking created by seed.'
        }
      );

      await upsertFirst(
        prisma.overtimeRecord,
        {
          tenantId,
          employeeId: employee.id,
          reason: 'Baseline approved overtime'
        },
        {
          tenantId,
          employeeId: employee.id,
          overtimePolicyId: overtimePolicy.id,
          date: addDays(-1),
          overtimeHours: 0.4,
          overtimeRate: 1.5,
          overtimeAmount: 300,
          reason: 'Baseline approved overtime',
          approvalStatus: 'APPROVED',
          approvedBy: users[0]?.id || null,
          approvedAt: addDays(0)
        },
        {
          approvalStatus: 'APPROVED',
          approvedBy: users[0]?.id || null,
          approvedAt: addDays(0)
        }
      );

      const now = new Date();
      await upsertFirst(
        prisma.attendanceReport,
        { tenantId, employeeId: employee.id, month: now.getMonth() + 1, year: now.getFullYear() },
        {
          tenantId,
          employeeId: employee.id,
          reportDate: now,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          totalWorkingDays: 23,
          presentDays: 22,
          absentDays: 1,
          leaveDays: 0,
          halfDays: 0,
          workFromHomeDays: 0,
          totalWorkHours: 175,
          totalOvertimeHours: 2.5,
          attendancePercentage: 95.65,
          status: 'GENERATED',
          notes: 'Baseline attendance report created by seed.'
        },
        {
          totalWorkingDays: 23,
          presentDays: 22,
          absentDays: 1,
          totalWorkHours: 175,
          totalOvertimeHours: 2.5,
          attendancePercentage: 95.65,
          status: 'GENERATED'
        }
      );
    }

    const primaryUser = users[0];
    const primaryEmployee = seededEmployees[0];
    const tenantCode = (tenantLabel.replace(/-/g, '').slice(0, 8) || tenantId.slice(0, 8)).toUpperCase();
    const tenantUniqueCode = tenantId.slice(0, 8).toUpperCase();

      await seedRoles(tenantId);
      await assignPermissions(tenantId);

      const adminRole = await prisma.role.findFirst({ where: { tenantId, name: 'ADMIN' } });
      const userRole = await prisma.role.findFirst({ where: { tenantId, name: 'USER' } });
      const managerRole = await ensureManagerRole(tenantId);

      for (const user of users) {
        const assignedRole = user.role === 'ADMIN'
          ? adminRole || managerRole || userRole
          : user.role === 'MANAGER'
            ? managerRole || userRole
            : userRole || managerRole || adminRole;

        if (assignedRole) {
          await ensureUserRole(user.id, assignedRole.id);
        }
      }

    if (primaryUser && primaryEmployee) {
        const getEmployeeForUser = (userId) => seededEmployees[users.findIndex((user) => user.id === userId)] || primaryEmployee;
        const adminUser = users.find((user) => user.role === 'ADMIN') || primaryUser;
        const managerUser = users.find((user) => user.role === 'MANAGER') || adminUser;
        const taskUser = users.find((user) => user.id !== managerUser.id) || primaryUser;
        const adminEmployee = getEmployeeForUser(adminUser.id);
        const managerEmployee = getEmployeeForUser(managerUser.id);
        const taskEmployee = getEmployeeForUser(taskUser.id);

      const leaveType = await upsertFirst(
        prisma.leaveType,
        { tenantId, code: 'SEED-AL' },
        {
          tenantId,
          name: 'Seed Annual Leave',
          code: 'SEED-AL',
          maxDays: 18,
          paid: true,
          requiresApproval: true
        },
        {
          name: 'Seed Annual Leave',
          maxDays: 18,
          paid: true,
          requiresApproval: true
        }
      );

      await upsertFirst(
        prisma.leaveRequest,
        {
          tenantId,
          employeeId: primaryEmployee.id,
          reason: 'Baseline seeded leave request'
        },
        {
          tenantId,
          employeeId: primaryEmployee.id,
          leaveTypeId: leaveType.id,
          startDate: addDays(2),
          endDate: addDays(3),
          reason: 'Baseline seeded leave request',
          status: 'PENDING'
        },
        {
          leaveTypeId: leaveType.id,
          status: 'PENDING'
        }
      );

      const expenseCategory = await upsertFirst(
        prisma.expenseCategory,
        { tenantId, code: 'SEED-TRAVEL' },
        {
          tenantId,
          name: 'Seed Travel',
          code: 'SEED-TRAVEL',
          active: true
        },
        {
          name: 'Seed Travel',
          active: true
        }
      );

      const pendingExpense = await upsertFirst(
        prisma.expenseClaim,
        {
          tenantId,
          employeeId: primaryEmployee.id,
          title: 'Seed pending expense approval'
        },
        {
          tenantId,
          employeeId: primaryEmployee.id,
          categoryId: expenseCategory.id,
          title: 'Seed pending expense approval',
          amount: 2400,
          description: 'Pending expense used for finance approvals dashboard.',
          expenseDate: addDays(-1),
          status: 'PENDING'
        },
        {
          categoryId: expenseCategory.id,
          amount: 2400,
          status: 'PENDING'
        }
      );

      await upsertFirst(
        prisma.expenseClaim,
        {
          tenantId,
          employeeId: primaryEmployee.id,
          title: 'Seed approved expense'
        },
        {
          tenantId,
          employeeId: primaryEmployee.id,
          categoryId: expenseCategory.id,
          title: 'Seed approved expense',
          amount: 5200,
          description: 'Approved expense used for finance dashboard totals.',
          expenseDate: addDays(-2),
          status: 'APPROVED'
        },
        {
          categoryId: expenseCategory.id,
          amount: 5200,
          status: 'APPROVED'
        }
      );

      await upsertFirst(
        prisma.workflowRequest,
        { tenantId, module: 'FINANCE', action: 'EXPENSE_APPROVAL' },
        {
          tenantId,
          module: 'FINANCE',
          action: 'EXPENSE_APPROVAL',
          payload: {
            expenseClaimId: pendingExpense.id,
            title: pendingExpense.title,
            amount: pendingExpense.amount
          },
          status: 'PENDING',
          createdBy: primaryUser.id,
          requestedBy: primaryUser.id
        },
        {
          payload: {
            expenseClaimId: pendingExpense.id,
            title: pendingExpense.title,
            amount: pendingExpense.amount
          },
          status: 'PENDING',
          createdBy: primaryUser.id,
          requestedBy: primaryUser.id
        }
      );

      const baselineVendor = await upsertFirst(
        prisma.vendor,
        { tenantId, name: `Seed Vendor ${tenantCode}` },
        {
          tenantId,
          vendorCode: `SV-${tenantId.slice(0, 8).toUpperCase()}`,
          name: `Seed Vendor ${tenantCode}`,
          contactPerson: 'Seed Procurement Team',
          email: `vendor+${tenantLabel}@ueorms.local`,
          phone: '+91-79-5000-1000',
          city: 'Seed City',
          state: 'Gujarat',
          country: 'India',
          paymentTerms: 'NET30',
          status: 'ACTIVE',
          category: 'GENERAL'
        },
        {
          email: `vendor+${tenantLabel}@ueorms.local`,
          status: 'ACTIVE'
        }
      );

      const dispatchItem = await upsertFirst(
        prisma.item,
        { tenantId, sku: 'SEED-ITEM-004' },
        {
          tenantId,
          name: 'Seed Dispatch Product',
          sku: 'SEED-ITEM-004',
          price: 9500,
          quantity: 30,
          category: 'Finished Goods',
          description: 'Baseline dispatch item created by seed.'
        },
        {
          name: 'Seed Dispatch Product',
          price: 9500,
          quantity: 30,
          category: 'Finished Goods'
        }
      );

      await upsertFirst(
        prisma.warehouseStock,
        { warehouseId: warehouse.id, itemId: dispatchItem.id },
        {
          tenantId,
          warehouseId: warehouse.id,
          itemId: dispatchItem.id,
          quantity: 30,
          reservedQty: 0,
          availableQty: 30,
          reorderPoint: 5,
          reorderQty: 10,
          minStock: 3,
          maxStock: 60,
          avgCost: 8200,
          lastPurchasePrice: 8200
        },
        {
          quantity: 30,
          availableQty: 30,
          avgCost: 8200,
          lastPurchasePrice: 8200
        }
      );

      const requisition = await upsertFirst(
        prisma.purchaseRequisition,
        { requisitionNumber: `PR-SEED-${tenantUniqueCode}` },
        {
          tenantId,
          requisitionNumber: `PR-SEED-${tenantUniqueCode}`,
          requestedBy: primaryUser.id,
          departmentId: defaultDepartment.id,
          vendorId: baselineVendor.id,
          title: 'Seed purchase requisition',
          description: 'Baseline requisition for purchase module.',
          priority: 'MEDIUM',
          requiredDate: addDays(7),
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approvedBy: primaryUser.id,
          approvedAt: addDays(-1),
          items: [
            {
              itemName: dispatchItem.name,
              description: 'Baseline procurement item',
              quantity: 12,
              estimatedPrice: 8200,
              unit: 'unit'
            }
          ],
          totalAmount: 98400,
          notes: 'Seeded requisition'
        },
        {
          vendorId: baselineVendor.id,
          approvedBy: primaryUser.id,
          approvedAt: addDays(-1),
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          totalAmount: 98400
        }
      );

      const purchaseOrder = await upsertFirst(
        prisma.purchaseOrder,
        { poNumber: `PO-SEED-${tenantUniqueCode}` },
        {
          tenantId,
          poNumber: `PO-SEED-${tenantUniqueCode}`,
          requisitionId: requisition.id,
          vendorId: baselineVendor.id,
          title: 'Seed purchase order',
          description: 'Baseline PO for purchase order dashboard.',
          orderDate: addDays(-2),
          expectedDeliveryDate: addDays(4),
          status: 'RECEIVED',
          items: [
            {
              itemName: dispatchItem.name,
              description: 'Baseline procurement item',
              quantity: 12,
              unitPrice: 8200,
              unit: 'unit',
              tax: 8856,
              discount: 0,
              total: 107256
            }
          ],
          subtotal: 98400,
          taxAmount: 8856,
          discountAmount: 0,
          shippingCost: 1000,
          totalAmount: 108256,
          paymentTerms: 'NET30',
          paymentStatus: 'UNPAID',
          shippingAddress: 'Seed Main Warehouse',
          shippingMethod: 'Road',
          approvalStatus: 'APPROVED',
          approvedBy: primaryUser.id,
          approvedAt: addDays(-2),
          createdBy: primaryUser.id
        },
        {
          requisitionId: requisition.id,
          vendorId: baselineVendor.id,
          status: 'RECEIVED',
          approvalStatus: 'APPROVED',
          approvedBy: primaryUser.id,
          approvedAt: addDays(-2),
          createdBy: primaryUser.id,
          totalAmount: 108256
        }
      );

      await upsertFirst(
        prisma.purchaseOrder,
        { poNumber: `PO-SEED-PENDING-${tenantUniqueCode}` },
        {
          tenantId,
          poNumber: `PO-SEED-PENDING-${tenantUniqueCode}`,
          vendorId: baselineVendor.id,
          title: 'Seed PO pending approval',
          orderDate: addDays(-1),
          expectedDeliveryDate: addDays(6),
          status: 'DRAFT',
          items: [
            {
              itemName: dispatchItem.name,
              description: 'Pending approval purchase order',
              quantity: 6,
              unitPrice: 8200,
              unit: 'unit',
              tax: 4428,
              discount: 0,
              total: 53628
            }
          ],
          subtotal: 49200,
          taxAmount: 4428,
          shippingCost: 500,
          totalAmount: 54128,
          paymentTerms: 'NET30',
          paymentStatus: 'UNPAID',
          approvalStatus: 'PENDING',
          createdBy: primaryUser.id
        },
        {
          status: 'DRAFT',
          approvalStatus: 'PENDING',
          createdBy: primaryUser.id,
          totalAmount: 54128
        }
      );

      await upsertFirst(
        prisma.goodsReceipt,
        { receiptNumber: `GRN-SEED-${tenantUniqueCode}` },
        {
          tenantId,
          receiptNumber: `GRN-SEED-${tenantUniqueCode}`,
          purchaseOrderId: purchaseOrder.id,
          receivedDate: addDays(-1),
          receivedBy: primaryUser.id,
          items: [
            {
              itemName: dispatchItem.name,
              orderedQty: 12,
              receivedQty: 12,
              rejectedQty: 0,
              condition: 'GOOD',
              notes: 'Baseline received stock.'
            }
          ],
          status: 'ACCEPTED',
          qualityStatus: 'PASSED',
          warehouseLocation: warehouse.name,
          notes: 'Baseline goods receipt'
        },
        {
          purchaseOrderId: purchaseOrder.id,
          status: 'ACCEPTED',
          qualityStatus: 'PASSED',
          warehouseLocation: warehouse.name
        }
      );

      await upsertFirst(
        prisma.stockMovement,
        { tenantId, movementNumber: `SM-SEED-DSP-${tenantCode}` },
        {
          tenantId,
          movementNumber: `SM-SEED-DSP-${tenantCode}`,
          type: 'OUT',
          reason: 'SALE',
          itemId: dispatchItem.id,
          warehouseId: warehouse.id,
          quantity: 2,
          referenceType: 'SALES_ORDER',
          referenceId: `SO-SEED-${tenantCode}`,
          unitCost: 8200,
          totalCost: 16400,
          status: 'COMPLETED',
          approvedBy: primaryUser.id,
          approvedAt: addDays(-1),
          notes: 'Baseline warehouse dispatch movement.',
          createdBy: primaryUser.id
        },
        {
          itemId: dispatchItem.id,
          warehouseId: warehouse.id,
          quantity: 2,
          status: 'COMPLETED',
          approvedBy: primaryUser.id,
          approvedAt: addDays(-1),
          createdBy: primaryUser.id
        }
      );

      const customer = await upsertFirst(
        prisma.customer,
        { tenantId, name: `Seed Customer ${tenantCode}` },
        {
          tenantId,
          name: `Seed Customer ${tenantCode}`,
          status: 'ACTIVE',
          type: 'BUSINESS',
          primaryEmail: `customer+${tenantLabel}@ueorms.local`,
          primaryPhone: '+1-555-0200',
          ownerId: primaryUser.id,
          category: 'CUSTOMER',
          source: 'REFERRAL',
          notes: 'Baseline customer for sales pipeline and analytics.'
        },
        {
          primaryEmail: `customer+${tenantLabel}@ueorms.local`,
          ownerId: primaryUser.id,
          status: 'ACTIVE'
        }
      );

      const pipeline = await upsertFirst(
        prisma.pipeline,
        { tenantId, name: 'Sales Pipeline' },
        {
          tenantId,
          name: 'Sales Pipeline',
          description: 'Baseline sales pipeline created by seed.',
          isDefault: true,
          isActive: true
        },
        {
          description: 'Baseline sales pipeline created by seed.',
          isDefault: true,
          isActive: true
        }
      );

      for (const stage of [
        { name: 'Prospecting', order: 91, probability: 15, color: '#64748B' },
        { name: 'Proposal', order: 92, probability: 55, color: '#2563EB' },
        { name: 'Closed Won', order: 93, probability: 100, color: '#10B981', isClosedWon: true }
      ]) {
        await upsertFirst(
          prisma.pipelineStage,
          { pipelineId: pipeline.id, name: stage.name },
          {
            tenantId,
            pipelineId: pipeline.id,
            name: stage.name,
            order: stage.order,
            probability: stage.probability,
            color: stage.color,
            isClosedWon: Boolean(stage.isClosedWon),
            isClosedLost: false,
            daysInStage: stage.name === 'Closed Won' ? null : 14
          },
          {
            order: stage.order,
            probability: stage.probability,
            color: stage.color,
            isClosedWon: Boolean(stage.isClosedWon),
            isClosedLost: false
          }
        );
      }

      const deal = await upsertFirst(
        prisma.deal,
        { tenantId, name: `Seed Deal ${tenantCode}` },
        {
          tenantId,
          customerId: customer.id,
          name: `Seed Deal ${tenantCode}`,
          stage: 'PROPOSAL',
          value: 28500,
          expectedCloseDate: addDays(10),
          status: 'OPEN',
          dealNumber: `DEAL-SEED-${tenantUniqueCode}`,
          pipelineId: pipeline.id,
          stageOrder: 2,
          probability: 55,
          amount: 28500,
          currencyCode: 'USD',
          discount: 500,
          tax: 1200,
          total: 29200,
          products: [
            {
              productId: dispatchItem.id,
              name: dispatchItem.name,
              quantity: 3,
              price: 9500,
              total: 28500
            }
          ],
          ownerId: primaryUser.id,
          teamMembers: [primaryUser.id],
          source: 'REFERRAL'
        },
        {
          customerId: customer.id,
          pipelineId: pipeline.id,
          stage: 'PROPOSAL',
          status: 'OPEN',
          ownerId: primaryUser.id,
          amount: 28500,
          total: 29200
        }
      );

      const quotationItems = [
        {
          description: dispatchItem.name,
          quantity: 3,
          unitPrice: 9500,
          total: 28500
        }
      ];

      const quotation = await upsertFirst(
        prisma.salesQuotation,
        { tenantId, title: `Seed Quote ${tenantCode}` },
        {
          tenantId,
          customerId: customer.id,
          dealId: deal.id,
          customerName: customer.name,
          customerEmail: customer.primaryEmail,
          title: `Seed Quote ${tenantCode}`,
          description: 'Baseline quote for analytics and conversion data.',
          items: quotationItems,
          subtotal: 28500,
          tax: 1200,
          discount: 500,
          total: 29200,
          status: 'ACCEPTED',
          validUntil: addDays(15)
        },
        {
          customerId: customer.id,
          dealId: deal.id,
          status: 'ACCEPTED',
          total: 29200
        }
      );

      const salesOrder = await upsertFirst(
        prisma.salesOrder,
        { tenantId, orderNumber: `SO-SEED-${tenantCode}` },
        {
          tenantId,
          customerId: customer.id,
          dealId: deal.id,
          orderNumber: `SO-SEED-${tenantCode}`,
          customerName: customer.name,
          customerEmail: customer.primaryEmail,
          quotationId: quotation.id,
          orderDate: addDays(-1),
          expectedDelivery: addDays(8),
          items: quotationItems,
          subtotal: 28500,
          tax: 1200,
          discount: 500,
          total: 29200,
          status: 'CONFIRMED',
          notes: 'Baseline sales order for module coverage.'
        },
        {
          customerId: customer.id,
          dealId: deal.id,
          quotationId: quotation.id,
          status: 'CONFIRMED',
          total: 29200
        }
      );

      const salesInvoice = await upsertFirst(
        prisma.salesInvoice,
        { tenantId, invoiceNumber: `INV-SEED-${tenantCode}` },
        {
          tenantId,
          customerId: customer.id,
          dealId: deal.id,
          invoiceNumber: `INV-SEED-${tenantCode}`,
          customerName: customer.name,
          customerEmail: customer.primaryEmail,
          orderId: salesOrder.id,
          issueDate: addDays(-1),
          dueDate: addDays(14),
          items: quotationItems,
          subtotal: 28500,
          tax: 1200,
          discount: 500,
          total: 29200,
          amountPaid: 15000,
          status: 'PARTIALLY_PAID'
        },
        {
          customerId: customer.id,
          dealId: deal.id,
          orderId: salesOrder.id,
          status: 'PARTIALLY_PAID',
          amountPaid: 15000,
          total: 29200
        }
      );

      await upsertFirst(
        prisma.invoicePayment,
        { tenantId, invoiceId: salesInvoice.id, referenceNumber: `PAY-SEED-${tenantCode}` },
        {
          tenantId,
          invoiceId: salesInvoice.id,
          amount: 15000,
          paymentDate: addDays(0),
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: `PAY-SEED-${tenantCode}`,
          notes: 'Baseline payment for sales analytics.'
        },
        {
          amount: 15000,
          paymentDate: addDays(0),
          paymentMethod: 'BANK_TRANSFER'
        }
      );

      await upsertFirst(
        prisma.salesOrderTracking,
        { tenantId, salesOrderId: salesOrder.id, trackingNumber: `TRK-SEED-${tenantCode}` },
        {
          tenantId,
          salesOrderId: salesOrder.id,
          status: 'PROCESSING',
          carrier: 'Seed Logistics',
          trackingNumber: `TRK-SEED-${tenantCode}`,
          location: warehouse.name,
          notes: 'Baseline tracking status for dispatch visibility.'
        },
        {
          status: 'PROCESSING',
          carrier: 'Seed Logistics',
          location: warehouse.name
        }
      );

      const datedLeaveRequests = [
        {
          reason: 'Seed approved annual leave',
          status: 'APPROVED',
          startDate: addDays(-12),
          endDate: addDays(-11)
        },
        {
          reason: 'Seed rejected leave request',
          status: 'REJECTED',
          startDate: addDays(9),
          endDate: addDays(10)
        }
      ];

      for (const leaveSpec of datedLeaveRequests) {
        await upsertFirst(
          prisma.leaveRequest,
          {
            tenantId,
            employeeId: primaryEmployee.id,
            reason: leaveSpec.reason
          },
          {
            tenantId,
            employeeId: primaryEmployee.id,
            leaveTypeId: leaveType.id,
            startDate: leaveSpec.startDate,
            endDate: leaveSpec.endDate,
            reason: leaveSpec.reason,
            status: leaveSpec.status
          },
          {
            leaveTypeId: leaveType.id,
            startDate: leaveSpec.startDate,
            endDate: leaveSpec.endDate,
            status: leaveSpec.status
          }
        );
      }

      const extraExpenseSpecs = [
        {
          title: 'Seed office supplies expense',
          amount: 1800,
          status: 'APPROVED',
          expenseDate: addDays(-8),
          needsApproval: false
        },
        {
          title: 'Seed client hospitality expense',
          amount: 3100,
          status: 'PENDING',
          expenseDate: addDays(-4),
          needsApproval: true
        },
        {
          title: 'Seed rejected taxi expense',
          amount: 950,
          status: 'REJECTED',
          expenseDate: addDays(-6),
          needsApproval: false
        }
      ];

      for (const [index, expenseSpec] of extraExpenseSpecs.entries()) {
        const claim = await upsertFirst(
          prisma.expenseClaim,
          {
            tenantId,
            employeeId: primaryEmployee.id,
            title: expenseSpec.title
          },
          {
            tenantId,
            employeeId: primaryEmployee.id,
            categoryId: expenseCategory.id,
            title: expenseSpec.title,
            amount: expenseSpec.amount,
            description: 'Additional finance seed data for dashboard and approvals.',
            expenseDate: expenseSpec.expenseDate,
            status: expenseSpec.status
          },
          {
            categoryId: expenseCategory.id,
            amount: expenseSpec.amount,
            expenseDate: expenseSpec.expenseDate,
            status: expenseSpec.status
          }
        );

        if (expenseSpec.needsApproval) {
          await upsertFirst(
            prisma.workflowRequest,
            { tenantId, module: 'FINANCE', action: `EXPENSE_APPROVAL_${index + 2}` },
            {
              tenantId,
              module: 'FINANCE',
              action: `EXPENSE_APPROVAL_${index + 2}`,
              payload: {
                expenseClaimId: claim.id,
                title: claim.title,
                amount: claim.amount
              },
              status: 'PENDING',
              createdBy: primaryUser.id,
              requestedBy: primaryUser.id
            },
            {
              payload: {
                expenseClaimId: claim.id,
                title: claim.title,
                amount: claim.amount
              },
              status: 'PENDING'
            }
          );
        }
      }

      const purchaseScenarios = [
        {
          suffix: '02',
          title: 'Seed replenishment PO',
          qty: 8,
          unitPrice: 8050,
          subtotal: 64400,
          taxAmount: 5796,
          shippingCost: 700,
          totalAmount: 70896,
          status: 'CONFIRMED',
          approvalStatus: 'APPROVED',
          paymentStatus: 'PARTIAL',
          orderDate: addDays(-14),
          expectedDeliveryDate: addDays(-6),
          received: false
        },
        {
          suffix: '03',
          title: 'Seed received spare parts PO',
          qty: 5,
          unitPrice: 8300,
          subtotal: 41500,
          taxAmount: 3735,
          shippingCost: 500,
          totalAmount: 45735,
          status: 'RECEIVED',
          approvalStatus: 'APPROVED',
          paymentStatus: 'UNPAID',
          orderDate: addDays(-20),
          expectedDeliveryDate: addDays(-12),
          received: true
        }
      ];

      for (const purchaseSpec of purchaseScenarios) {
        const reqNumber = `PR-SEED-${tenantUniqueCode}-${purchaseSpec.suffix}`;
        const poNumber = `PO-SEED-${tenantUniqueCode}-${purchaseSpec.suffix}`;
        const receiptNumber = `GRN-SEED-${tenantUniqueCode}-${purchaseSpec.suffix}`;

        const scenarioRequisition = await upsertFirst(
          prisma.purchaseRequisition,
          { requisitionNumber: reqNumber },
          {
            tenantId,
            requisitionNumber: reqNumber,
            requestedBy: primaryUser.id,
            departmentId: defaultDepartment.id,
            vendorId: baselineVendor.id,
            title: `${purchaseSpec.title} requisition`,
            description: 'Additional purchase seed data.',
            priority: 'MEDIUM',
            requestedDate: purchaseSpec.orderDate,
            requiredDate: addDays(12),
            status: 'APPROVED',
            approvalStatus: 'APPROVED',
            approvedBy: primaryUser.id,
            approvedAt: addDays(-3),
            items: [
              {
                itemName: dispatchItem.name,
                description: purchaseSpec.title,
                quantity: purchaseSpec.qty,
                estimatedPrice: purchaseSpec.unitPrice,
                unit: 'unit'
              }
            ],
            totalAmount: purchaseSpec.subtotal
          },
          {
            vendorId: baselineVendor.id,
            status: 'APPROVED',
            approvalStatus: 'APPROVED',
            totalAmount: purchaseSpec.subtotal
          }
        );

        const scenarioOrder = await upsertFirst(
          prisma.purchaseOrder,
          { poNumber },
          {
            tenantId,
            poNumber,
            requisitionId: scenarioRequisition.id,
            vendorId: baselineVendor.id,
            title: purchaseSpec.title,
            description: 'Additional purchase order seed data.',
            orderDate: purchaseSpec.orderDate,
            expectedDeliveryDate: purchaseSpec.expectedDeliveryDate,
            actualDeliveryDate: purchaseSpec.received ? addDays(-11) : null,
            status: purchaseSpec.status,
            items: [
              {
                itemName: dispatchItem.name,
                description: purchaseSpec.title,
                quantity: purchaseSpec.qty,
                unitPrice: purchaseSpec.unitPrice,
                unit: 'unit',
                tax: purchaseSpec.taxAmount,
                discount: 0,
                total: purchaseSpec.totalAmount
              }
            ],
            subtotal: purchaseSpec.subtotal,
            taxAmount: purchaseSpec.taxAmount,
            discountAmount: 0,
            shippingCost: purchaseSpec.shippingCost,
            totalAmount: purchaseSpec.totalAmount,
            paymentTerms: 'NET30',
            paymentStatus: purchaseSpec.paymentStatus,
            shippingAddress: 'Seed Main Warehouse',
            shippingMethod: 'Road',
            approvalStatus: purchaseSpec.approvalStatus,
            approvedBy: primaryUser.id,
            approvedAt: addDays(-3),
            createdBy: primaryUser.id
          },
          {
            requisitionId: scenarioRequisition.id,
            status: purchaseSpec.status,
            paymentStatus: purchaseSpec.paymentStatus,
            totalAmount: purchaseSpec.totalAmount,
            approvalStatus: purchaseSpec.approvalStatus
          }
        );

        if (purchaseSpec.received) {
          await upsertFirst(
            prisma.goodsReceipt,
            { receiptNumber },
            {
              tenantId,
              receiptNumber,
              purchaseOrderId: scenarioOrder.id,
              receivedDate: addDays(-11),
              receivedBy: primaryUser.id,
              items: [
                {
                  itemName: dispatchItem.name,
                  orderedQty: purchaseSpec.qty,
                  receivedQty: purchaseSpec.qty,
                  rejectedQty: 0,
                  condition: 'GOOD',
                  notes: 'Additional goods receipt seed.'
                }
              ],
              status: 'ACCEPTED',
              qualityStatus: 'PASSED',
              warehouseLocation: warehouse.name
            },
            {
              purchaseOrderId: scenarioOrder.id,
              status: 'ACCEPTED',
              qualityStatus: 'PASSED'
            }
          );
        }
      }

      const salesScenarios = [
        {
          suffix: '02',
          customerName: `Seed Customer ${tenantCode} North`,
          dealName: `Seed Expansion Deal ${tenantCode}`,
          createdAt: addDays(-18),
          orderDate: addDays(-16),
          issueDate: addDays(-15),
          expectedDelivery: addDays(-6),
          itemQty: 4,
          unitPrice: 9100,
          discount: 400,
          tax: 1500,
          paidAmount: 37500,
          invoiceStatus: 'PAID',
          orderStatus: 'DELIVERED',
          trackingStatus: 'DELIVERED'
        },
        {
          suffix: '03',
          customerName: `Seed Customer ${tenantCode} West`,
          dealName: `Seed Renewal Deal ${tenantCode}`,
          createdAt: addDays(-9),
          orderDate: addDays(-8),
          issueDate: addDays(-7),
          expectedDelivery: addDays(3),
          itemQty: 2,
          unitPrice: 9700,
          discount: 200,
          tax: 900,
          paidAmount: 0,
          invoiceStatus: 'OVERDUE',
          orderStatus: 'SHIPPED',
          trackingStatus: 'IN_TRANSIT'
        }
      ];

      for (const salesSpec of salesScenarios) {
        const scenarioCustomer = await upsertFirst(
          prisma.customer,
          { tenantId, name: salesSpec.customerName },
          {
            tenantId,
            name: salesSpec.customerName,
            status: 'ACTIVE',
            type: 'BUSINESS',
            primaryEmail: `${salesSpec.suffix.toLowerCase()}+${tenantLabel}@ueorms.local`,
            primaryPhone: '+1-555-0300',
            ownerId: primaryUser.id,
            category: 'CUSTOMER',
            source: 'REFERRAL'
          },
          {
            ownerId: primaryUser.id,
            status: 'ACTIVE'
          }
        );

        const scenarioDeal = await upsertFirst(
          prisma.deal,
          { tenantId, name: salesSpec.dealName },
          {
            tenantId,
            customerId: scenarioCustomer.id,
            name: salesSpec.dealName,
            stage: salesSpec.orderStatus === 'DELIVERED' ? 'WON' : 'NEGOTIATION',
            value: salesSpec.itemQty * salesSpec.unitPrice,
            expectedCloseDate: addDays(5),
            status: salesSpec.orderStatus === 'DELIVERED' ? 'WON' : 'OPEN',
            dealNumber: `DEAL-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            pipelineId: pipeline.id,
            stageOrder: salesSpec.orderStatus === 'DELIVERED' ? 3 : 2,
            probability: salesSpec.orderStatus === 'DELIVERED' ? 100 : 70,
            amount: salesSpec.itemQty * salesSpec.unitPrice,
            currencyCode: 'USD',
            discount: salesSpec.discount,
            tax: salesSpec.tax,
            total: (salesSpec.itemQty * salesSpec.unitPrice) - salesSpec.discount + salesSpec.tax,
            products: [
              {
                productId: dispatchItem.id,
                name: dispatchItem.name,
                quantity: salesSpec.itemQty,
                price: salesSpec.unitPrice,
                total: salesSpec.itemQty * salesSpec.unitPrice
              }
            ],
            ownerId: primaryUser.id,
            teamMembers: [primaryUser.id],
            source: 'REFERRAL',
            createdAt: salesSpec.createdAt
          },
          {
            customerId: scenarioCustomer.id,
            status: salesSpec.orderStatus === 'DELIVERED' ? 'WON' : 'OPEN',
            stage: salesSpec.orderStatus === 'DELIVERED' ? 'WON' : 'NEGOTIATION',
            total: (salesSpec.itemQty * salesSpec.unitPrice) - salesSpec.discount + salesSpec.tax
          }
        );

        const scenarioItems = [
          {
            description: dispatchItem.name,
            quantity: salesSpec.itemQty,
            unitPrice: salesSpec.unitPrice,
            total: salesSpec.itemQty * salesSpec.unitPrice
          }
        ];

        const scenarioQuote = await upsertFirst(
          prisma.salesQuotation,
          { tenantId, title: `Seed Quote ${tenantCode} ${salesSpec.suffix}` },
          {
            tenantId,
            customerId: scenarioCustomer.id,
            dealId: scenarioDeal.id,
            customerName: scenarioCustomer.name,
            customerEmail: scenarioCustomer.primaryEmail,
            title: `Seed Quote ${tenantCode} ${salesSpec.suffix}`,
            description: 'Additional sales quotation seed data.',
            items: scenarioItems,
            subtotal: salesSpec.itemQty * salesSpec.unitPrice,
            tax: salesSpec.tax,
            discount: salesSpec.discount,
            total: (salesSpec.itemQty * salesSpec.unitPrice) - salesSpec.discount + salesSpec.tax,
            status: 'ACCEPTED',
            validUntil: addDays(20),
            createdAt: salesSpec.createdAt
          },
          {
            customerId: scenarioCustomer.id,
            dealId: scenarioDeal.id,
            status: 'ACCEPTED'
          }
        );

        const scenarioOrder = await upsertFirst(
          prisma.salesOrder,
          { tenantId, orderNumber: `SO-SEED-${tenantUniqueCode}-${salesSpec.suffix}` },
          {
            tenantId,
            customerId: scenarioCustomer.id,
            dealId: scenarioDeal.id,
            orderNumber: `SO-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            customerName: scenarioCustomer.name,
            customerEmail: scenarioCustomer.primaryEmail,
            quotationId: scenarioQuote.id,
            orderDate: salesSpec.orderDate,
            expectedDelivery: salesSpec.expectedDelivery,
            items: scenarioItems,
            subtotal: salesSpec.itemQty * salesSpec.unitPrice,
            tax: salesSpec.tax,
            discount: salesSpec.discount,
            total: (salesSpec.itemQty * salesSpec.unitPrice) - salesSpec.discount + salesSpec.tax,
            status: salesSpec.orderStatus,
            notes: 'Additional sales order seed data.',
            createdAt: salesSpec.orderDate
          },
          {
            customerId: scenarioCustomer.id,
            dealId: scenarioDeal.id,
            quotationId: scenarioQuote.id,
            status: salesSpec.orderStatus
          }
        );

        const scenarioInvoice = await upsertFirst(
          prisma.salesInvoice,
          { tenantId, invoiceNumber: `INV-SEED-${tenantUniqueCode}-${salesSpec.suffix}` },
          {
            tenantId,
            customerId: scenarioCustomer.id,
            dealId: scenarioDeal.id,
            invoiceNumber: `INV-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            customerName: scenarioCustomer.name,
            customerEmail: scenarioCustomer.primaryEmail,
            orderId: scenarioOrder.id,
            issueDate: salesSpec.issueDate,
            dueDate: addDays(12),
            items: scenarioItems,
            subtotal: salesSpec.itemQty * salesSpec.unitPrice,
            tax: salesSpec.tax,
            discount: salesSpec.discount,
            total: (salesSpec.itemQty * salesSpec.unitPrice) - salesSpec.discount + salesSpec.tax,
            amountPaid: salesSpec.paidAmount,
            status: salesSpec.invoiceStatus,
            createdAt: salesSpec.issueDate
          },
          {
            orderId: scenarioOrder.id,
            amountPaid: salesSpec.paidAmount,
            status: salesSpec.invoiceStatus
          }
        );

        if (salesSpec.paidAmount > 0) {
          await upsertFirst(
            prisma.invoicePayment,
            {
              tenantId,
              invoiceId: scenarioInvoice.id,
              referenceNumber: `PAY-SEED-${tenantUniqueCode}-${salesSpec.suffix}`
            },
            {
              tenantId,
              invoiceId: scenarioInvoice.id,
              amount: salesSpec.paidAmount,
              paymentDate: addDays(-5),
              paymentMethod: 'BANK_TRANSFER',
              referenceNumber: `PAY-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
              notes: 'Additional payment seed data.',
              createdAt: addDays(-5)
            },
            {
              amount: salesSpec.paidAmount,
              paymentMethod: 'BANK_TRANSFER'
            }
          );
        }

        await upsertFirst(
          prisma.salesOrderTracking,
          {
            tenantId,
            salesOrderId: scenarioOrder.id,
            trackingNumber: `TRK-SEED-${tenantUniqueCode}-${salesSpec.suffix}`
          },
          {
            tenantId,
            salesOrderId: scenarioOrder.id,
            status: salesSpec.trackingStatus,
            carrier: 'Seed Logistics',
            trackingNumber: `TRK-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            location: salesSpec.trackingStatus === 'DELIVERED' ? 'Customer Site' : 'Regional Hub',
            notes: 'Additional shipment tracking seed data.'
          },
          {
            status: salesSpec.trackingStatus,
            location: salesSpec.trackingStatus === 'DELIVERED' ? 'Customer Site' : 'Regional Hub'
          }
        );

        await upsertFirst(
          prisma.stockMovement,
          { tenantId, movementNumber: `SM-SEED-DSP-${tenantUniqueCode}-${salesSpec.suffix}` },
          {
            tenantId,
            movementNumber: `SM-SEED-DSP-${tenantUniqueCode}-${salesSpec.suffix}`,
            type: 'OUT',
            reason: 'SALE',
            itemId: dispatchItem.id,
            warehouseId: warehouse.id,
            quantity: salesSpec.itemQty,
            referenceType: 'SALES_ORDER',
            referenceId: scenarioOrder.id,
            unitCost: 8200,
            totalCost: 8200 * salesSpec.itemQty,
            status: 'COMPLETED',
            approvedBy: primaryUser.id,
            approvedAt: salesSpec.orderDate,
            notes: 'Additional warehouse dispatch generated by seed.',
            createdBy: primaryUser.id,
            createdAt: salesSpec.orderDate
          },
          {
            quantity: salesSpec.itemQty,
            totalCost: 8200 * salesSpec.itemQty,
            approvedAt: salesSpec.orderDate
          }
        );
      }

      const historyDate = (monthsAgo, day, hour = 10) => {
        const date = new Date();
        date.setMonth(date.getMonth() - monthsAgo, day);
        date.setHours(hour, 0, 0, 0);
        return date;
      };

      const offsetDate = (baseDate, daysOffset, hour = null) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + daysOffset);
        if (hour !== null) {
          date.setHours(hour, 0, 0, 0);
        }
        return date;
      };

      for (const approvalSpec of [
        {
          suffix: 'REJECTED',
          title: 'Seed rejected capex approval',
          amount: 4300,
          claimStatus: 'REJECTED',
          workflowStatus: 'REJECTED',
          expenseDate: historyDate(2, 14)
        },
        {
          suffix: 'COMPLETED',
          title: 'Seed completed training approval',
          amount: 6200,
          claimStatus: 'APPROVED',
          workflowStatus: 'COMPLETED',
          expenseDate: historyDate(1, 9)
        }
      ]) {
        const financeClaim = await upsertFirst(
          prisma.expenseClaim,
          { tenantId, employeeId: primaryEmployee.id, title: approvalSpec.title },
          {
            tenantId,
            employeeId: primaryEmployee.id,
            categoryId: expenseCategory.id,
            title: approvalSpec.title,
            amount: approvalSpec.amount,
            description: 'Finance approval history seeded for status variety.',
            expenseDate: approvalSpec.expenseDate,
            status: approvalSpec.claimStatus,
            createdAt: approvalSpec.expenseDate
          },
          {
            amount: approvalSpec.amount,
            expenseDate: approvalSpec.expenseDate,
            status: approvalSpec.claimStatus
          }
        );

        await upsertFirst(
          prisma.workflowRequest,
          { tenantId, module: 'FINANCE', action: `EXPENSE_APPROVAL_${approvalSpec.suffix}` },
          {
            tenantId,
            module: 'FINANCE',
            action: `EXPENSE_APPROVAL_${approvalSpec.suffix}`,
            payload: {
              expenseClaimId: financeClaim.id,
              title: financeClaim.title,
              amount: financeClaim.amount
            },
            status: approvalSpec.workflowStatus,
            createdBy: primaryUser.id,
            requestedBy: primaryUser.id,
            createdAt: approvalSpec.expenseDate
          },
          {
            payload: {
              expenseClaimId: financeClaim.id,
              title: financeClaim.title,
              amount: financeClaim.amount
            },
            status: approvalSpec.workflowStatus
          }
        );
      }

      for (const purchaseSpec of [
        {
          suffix: '04',
          title: 'Seed cancelled PO',
          qty: 7,
          unitPrice: 7900,
          subtotal: 55300,
          taxAmount: 4977,
          shippingCost: 600,
          totalAmount: 60877,
          status: 'CANCELLED',
          approvalStatus: 'APPROVED',
          paymentStatus: 'UNPAID',
          orderDate: historyDate(4, 7),
          expectedDeliveryDate: historyDate(4, 18),
          received: false
        },
        {
          suffix: '05',
          title: 'Seed rejected approval PO',
          qty: 9,
          unitPrice: 7600,
          subtotal: 68400,
          taxAmount: 6156,
          shippingCost: 650,
          totalAmount: 75206,
          status: 'DRAFT',
          approvalStatus: 'REJECTED',
          paymentStatus: 'UNPAID',
          orderDate: historyDate(3, 11),
          expectedDeliveryDate: historyDate(3, 20),
          received: false
        },
        {
          suffix: '06',
          title: 'Seed older received PO',
          qty: 10,
          unitPrice: 8000,
          subtotal: 80000,
          taxAmount: 7200,
          shippingCost: 750,
          totalAmount: 87950,
          status: 'RECEIVED',
          approvalStatus: 'APPROVED',
          paymentStatus: 'PAID',
          orderDate: historyDate(5, 10),
          expectedDeliveryDate: historyDate(5, 18),
          received: true
        }
      ]) {
        const reqNumber = `PR-SEED-${tenantUniqueCode}-${purchaseSpec.suffix}`;
        const poNumber = `PO-SEED-${tenantUniqueCode}-${purchaseSpec.suffix}`;
        const receiptNumber = `GRN-SEED-${tenantUniqueCode}-${purchaseSpec.suffix}`;

        const varietyRequisition = await upsertFirst(
          prisma.purchaseRequisition,
          { requisitionNumber: reqNumber },
          {
            tenantId,
            requisitionNumber: reqNumber,
            requestedBy: primaryUser.id,
            departmentId: defaultDepartment.id,
            vendorId: baselineVendor.id,
            title: `${purchaseSpec.title} requisition`,
            description: 'Historical purchase seed data for analytics trends.',
            priority: 'MEDIUM',
            requestedDate: purchaseSpec.orderDate,
            requiredDate: offsetDate(purchaseSpec.expectedDeliveryDate, 4),
            status: purchaseSpec.approvalStatus === 'REJECTED' ? 'REJECTED' : 'APPROVED',
            approvalStatus: purchaseSpec.approvalStatus,
            approvedBy: purchaseSpec.approvalStatus === 'REJECTED' ? null : primaryUser.id,
            approvedAt: purchaseSpec.approvalStatus === 'REJECTED' ? null : offsetDate(purchaseSpec.orderDate, 1),
            rejectionReason: purchaseSpec.approvalStatus === 'REJECTED' ? 'Budget threshold exceeded' : null,
            items: [
              {
                itemName: dispatchItem.name,
                description: purchaseSpec.title,
                quantity: purchaseSpec.qty,
                estimatedPrice: purchaseSpec.unitPrice,
                unit: 'unit'
              }
            ],
            totalAmount: purchaseSpec.subtotal,
            createdAt: purchaseSpec.orderDate
          },
          {
            status: purchaseSpec.approvalStatus === 'REJECTED' ? 'REJECTED' : 'APPROVED',
            approvalStatus: purchaseSpec.approvalStatus,
            totalAmount: purchaseSpec.subtotal,
            rejectionReason: purchaseSpec.approvalStatus === 'REJECTED' ? 'Budget threshold exceeded' : null
          }
        );

        const varietyOrder = await upsertFirst(
          prisma.purchaseOrder,
          { poNumber },
          {
            tenantId,
            poNumber,
            requisitionId: varietyRequisition.id,
            vendorId: baselineVendor.id,
            title: purchaseSpec.title,
            description: 'Historical purchase order seed data.',
            orderDate: purchaseSpec.orderDate,
            expectedDeliveryDate: purchaseSpec.expectedDeliveryDate,
            actualDeliveryDate: purchaseSpec.received ? offsetDate(purchaseSpec.expectedDeliveryDate, -1) : null,
            status: purchaseSpec.status,
            items: [
              {
                itemName: dispatchItem.name,
                description: purchaseSpec.title,
                quantity: purchaseSpec.qty,
                unitPrice: purchaseSpec.unitPrice,
                unit: 'unit',
                tax: purchaseSpec.taxAmount,
                discount: 0,
                total: purchaseSpec.totalAmount
              }
            ],
            subtotal: purchaseSpec.subtotal,
            taxAmount: purchaseSpec.taxAmount,
            discountAmount: 0,
            shippingCost: purchaseSpec.shippingCost,
            totalAmount: purchaseSpec.totalAmount,
            paymentTerms: 'NET30',
            paymentStatus: purchaseSpec.paymentStatus,
            shippingAddress: 'Seed Main Warehouse',
            shippingMethod: 'Road',
            approvalStatus: purchaseSpec.approvalStatus,
            approvedBy: purchaseSpec.approvalStatus === 'REJECTED' ? null : primaryUser.id,
            approvedAt: purchaseSpec.approvalStatus === 'REJECTED' ? null : offsetDate(purchaseSpec.orderDate, 1),
            createdBy: primaryUser.id,
            createdAt: purchaseSpec.orderDate
          },
          {
            status: purchaseSpec.status,
            approvalStatus: purchaseSpec.approvalStatus,
            paymentStatus: purchaseSpec.paymentStatus,
            totalAmount: purchaseSpec.totalAmount
          }
        );

        if (purchaseSpec.received) {
          await upsertFirst(
            prisma.goodsReceipt,
            { receiptNumber },
            {
              tenantId,
              receiptNumber,
              purchaseOrderId: varietyOrder.id,
              receivedDate: offsetDate(purchaseSpec.expectedDeliveryDate, -1),
              receivedBy: primaryUser.id,
              items: [
                {
                  itemName: dispatchItem.name,
                  orderedQty: purchaseSpec.qty,
                  receivedQty: purchaseSpec.qty,
                  rejectedQty: 0,
                  condition: 'GOOD',
                  notes: 'Older receipt seed data.'
                }
              ],
              status: 'ACCEPTED',
              qualityStatus: 'PASSED',
              warehouseLocation: warehouse.name,
              createdAt: offsetDate(purchaseSpec.expectedDeliveryDate, -1)
            },
            {
              status: 'ACCEPTED',
              qualityStatus: 'PASSED'
            }
          );
        }
      }

      const extendedSalesScenarios = [
        { suffix: '04', monthsAgo: 1, day: 6, itemQty: 5, unitPrice: 8800, discount: 300, tax: 1600, quoteStatus: 'ACCEPTED', dealStage: 'WON', dealStatus: 'WON', orderStatus: 'DELIVERED', invoiceStatus: 'PAID', trackingStatus: 'DELIVERED', paymentRatio: 1, customerLabel: 'Central' },
        { suffix: '05', monthsAgo: 1, day: 18, itemQty: 3, unitPrice: 9900, discount: 200, tax: 1100, quoteStatus: 'ACCEPTED', dealStage: 'NEGOTIATION', dealStatus: 'OPEN', orderStatus: 'CONFIRMED', invoiceStatus: 'SENT', trackingStatus: 'PROCESSING', paymentRatio: 0, customerLabel: 'South' },
        { suffix: '06', monthsAgo: 2, day: 7, itemQty: 4, unitPrice: 9300, discount: 250, tax: 1450, quoteStatus: 'ACCEPTED', dealStage: 'WON', dealStatus: 'WON', orderStatus: 'DELIVERED', invoiceStatus: 'PAID', trackingStatus: 'DELIVERED', paymentRatio: 1, customerLabel: 'East' },
        { suffix: '07', monthsAgo: 2, day: 20, itemQty: 6, unitPrice: 9050, discount: 500, tax: 1900, quoteStatus: 'ACCEPTED', dealStage: 'NEGOTIATION', dealStatus: 'OPEN', orderStatus: 'SHIPPED', invoiceStatus: 'PARTIALLY_PAID', trackingStatus: 'DELAYED', paymentRatio: 0.45, customerLabel: 'Metro' },
        { suffix: '08', monthsAgo: 3, day: 9, itemQty: 2, unitPrice: 10400, discount: 150, tax: 820, quoteStatus: 'ACCEPTED', dealStage: 'PROPOSAL', dealStatus: 'OPEN', orderStatus: 'CONFIRMED', invoiceStatus: 'DRAFT', trackingStatus: 'PENDING', paymentRatio: 0, customerLabel: 'Industrial' },
        { suffix: '09', monthsAgo: 3, day: 23, itemQty: 5, unitPrice: 8700, discount: 300, tax: 1500, quoteStatus: 'ACCEPTED', dealStage: 'WON', dealStatus: 'WON', orderStatus: 'DELIVERED', invoiceStatus: 'PAID', trackingStatus: 'DELIVERED', paymentRatio: 1, customerLabel: 'Northwest' },
        { suffix: '10', monthsAgo: 4, day: 12, itemQty: 3, unitPrice: 9600, discount: 250, tax: 1050, quoteStatus: 'ACCEPTED', dealStage: 'NEGOTIATION', dealStatus: 'OPEN', orderStatus: 'SHIPPED', invoiceStatus: 'OVERDUE', trackingStatus: 'IN_TRANSIT', paymentRatio: 0, customerLabel: 'Export' },
        { suffix: '11', monthsAgo: 5, day: 8, itemQty: 7, unitPrice: 8450, discount: 550, tax: 2300, quoteStatus: 'ACCEPTED', dealStage: 'WON', dealStatus: 'WON', orderStatus: 'DELIVERED', invoiceStatus: 'PAID', trackingStatus: 'DELIVERED', paymentRatio: 1, customerLabel: 'Legacy' },
        { suffix: '12', monthsAgo: 5, day: 21, itemQty: 4, unitPrice: 9150, discount: 350, tax: 1350, quoteStatus: 'ACCEPTED', dealStage: 'PROPOSAL', dealStatus: 'OPEN', orderStatus: 'CONFIRMED', invoiceStatus: 'SENT', trackingStatus: 'PROCESSING', paymentRatio: 0, customerLabel: 'Regional' }
      ];

      for (const salesSpec of extendedSalesScenarios) {
        const createdAt = historyDate(salesSpec.monthsAgo, salesSpec.day);
        const orderDate = offsetDate(createdAt, 2);
        const issueDate = offsetDate(orderDate, 1);
        const expectedDelivery = offsetDate(orderDate, 10);
        const subtotal = salesSpec.itemQty * salesSpec.unitPrice;
        const total = subtotal - salesSpec.discount + salesSpec.tax;
        const paidAmount = Number((total * salesSpec.paymentRatio).toFixed(2));

        const historyCustomer = await upsertFirst(
          prisma.customer,
          { tenantId, name: `Seed Customer ${tenantCode} ${salesSpec.customerLabel}` },
          {
            tenantId,
            name: `Seed Customer ${tenantCode} ${salesSpec.customerLabel}`,
            status: 'ACTIVE',
            type: 'BUSINESS',
            primaryEmail: `sales-${salesSpec.suffix}+${tenantLabel}@ueorms.local`,
            primaryPhone: '+1-555-0400',
            ownerId: primaryUser.id,
            category: 'CUSTOMER',
            source: 'REFERRAL',
            createdAt
          },
          {
            ownerId: primaryUser.id,
            status: 'ACTIVE'
          }
        );

        const historyDeal = await upsertFirst(
          prisma.deal,
          { tenantId, name: `Seed History Deal ${tenantCode} ${salesSpec.suffix}` },
          {
            tenantId,
            customerId: historyCustomer.id,
            name: `Seed History Deal ${tenantCode} ${salesSpec.suffix}`,
            stage: salesSpec.dealStage,
            value: subtotal,
            expectedCloseDate: offsetDate(createdAt, 18),
            status: salesSpec.dealStatus,
            dealNumber: `DEAL-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            pipelineId: pipeline.id,
            stageOrder: salesSpec.dealStage === 'WON' ? 3 : 2,
            probability: salesSpec.dealStage === 'WON' ? 100 : 65,
            amount: subtotal,
            currencyCode: 'USD',
            discount: salesSpec.discount,
            tax: salesSpec.tax,
            total,
            products: [
              {
                productId: dispatchItem.id,
                name: dispatchItem.name,
                quantity: salesSpec.itemQty,
                price: salesSpec.unitPrice,
                total: subtotal
              }
            ],
            ownerId: primaryUser.id,
            teamMembers: [primaryUser.id],
            source: 'REFERRAL',
            createdAt,
            createdDate: createdAt,
            closedDate: salesSpec.dealStatus === 'WON' ? offsetDate(createdAt, 20) : null,
            lastActivityDate: offsetDate(createdAt, 12)
          },
          {
            customerId: historyCustomer.id,
            stage: salesSpec.dealStage,
            status: salesSpec.dealStatus,
            total
          }
        );

        const historyItems = [
          {
            description: dispatchItem.name,
            quantity: salesSpec.itemQty,
            unitPrice: salesSpec.unitPrice,
            total: subtotal
          }
        ];

        const historyQuote = await upsertFirst(
          prisma.salesQuotation,
          { tenantId, title: `Seed History Quote ${tenantCode} ${salesSpec.suffix}` },
          {
            tenantId,
            customerId: historyCustomer.id,
            dealId: historyDeal.id,
            customerName: historyCustomer.name,
            customerEmail: historyCustomer.primaryEmail,
            title: `Seed History Quote ${tenantCode} ${salesSpec.suffix}`,
            description: 'Historical sales quotation seed data.',
            items: historyItems,
            subtotal,
            tax: salesSpec.tax,
            discount: salesSpec.discount,
            total,
            status: salesSpec.quoteStatus,
            validUntil: offsetDate(createdAt, 30),
            createdAt
          },
          {
            dealId: historyDeal.id,
            status: salesSpec.quoteStatus,
            total
          }
        );

        const historyOrder = await upsertFirst(
          prisma.salesOrder,
          { tenantId, orderNumber: `SO-SEED-${tenantUniqueCode}-${salesSpec.suffix}` },
          {
            tenantId,
            customerId: historyCustomer.id,
            dealId: historyDeal.id,
            orderNumber: `SO-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            customerName: historyCustomer.name,
            customerEmail: historyCustomer.primaryEmail,
            quotationId: historyQuote.id,
            orderDate,
            expectedDelivery,
            items: historyItems,
            subtotal,
            tax: salesSpec.tax,
            discount: salesSpec.discount,
            total,
            status: salesSpec.orderStatus,
            notes: 'Historical sales order seed data.',
            createdAt: orderDate
          },
          {
            dealId: historyDeal.id,
            quotationId: historyQuote.id,
            status: salesSpec.orderStatus,
            total
          }
        );

        const historyInvoice = await upsertFirst(
          prisma.salesInvoice,
          { tenantId, invoiceNumber: `INV-SEED-${tenantUniqueCode}-${salesSpec.suffix}` },
          {
            tenantId,
            customerId: historyCustomer.id,
            dealId: historyDeal.id,
            invoiceNumber: `INV-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            customerName: historyCustomer.name,
            customerEmail: historyCustomer.primaryEmail,
            orderId: historyOrder.id,
            issueDate,
            dueDate: offsetDate(issueDate, 14),
            items: historyItems,
            subtotal,
            tax: salesSpec.tax,
            discount: salesSpec.discount,
            total,
            amountPaid: paidAmount,
            status: salesSpec.invoiceStatus,
            createdAt: issueDate
          },
          {
            orderId: historyOrder.id,
            amountPaid: paidAmount,
            status: salesSpec.invoiceStatus,
            total
          }
        );

        if (paidAmount > 0) {
          await upsertFirst(
            prisma.invoicePayment,
            {
              tenantId,
              invoiceId: historyInvoice.id,
              referenceNumber: `PAY-SEED-${tenantUniqueCode}-${salesSpec.suffix}`
            },
            {
              tenantId,
              invoiceId: historyInvoice.id,
              amount: paidAmount,
              paymentDate: offsetDate(issueDate, 5),
              paymentMethod: 'BANK_TRANSFER',
              referenceNumber: `PAY-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
              notes: 'Historical invoice payment seed data.',
              createdAt: offsetDate(issueDate, 5)
            },
            {
              amount: paidAmount,
              paymentDate: offsetDate(issueDate, 5),
              paymentMethod: 'BANK_TRANSFER'
            }
          );
        }

        await upsertFirst(
          prisma.salesOrderTracking,
          {
            tenantId,
            salesOrderId: historyOrder.id,
            trackingNumber: `TRK-SEED-${tenantUniqueCode}-${salesSpec.suffix}`
          },
          {
            tenantId,
            salesOrderId: historyOrder.id,
            status: salesSpec.trackingStatus,
            carrier: 'Seed Logistics',
            trackingNumber: `TRK-SEED-${tenantUniqueCode}-${salesSpec.suffix}`,
            location: salesSpec.trackingStatus === 'DELIVERED' ? 'Customer Site' : salesSpec.trackingStatus === 'DELAYED' ? 'Transit Delay Hub' : 'Regional Hub',
            notes: 'Historical dispatch tracking seed data.'
          },
          {
            status: salesSpec.trackingStatus,
            location: salesSpec.trackingStatus === 'DELIVERED' ? 'Customer Site' : salesSpec.trackingStatus === 'DELAYED' ? 'Transit Delay Hub' : 'Regional Hub'
          }
        );

        await upsertFirst(
          prisma.stockMovement,
          { tenantId, movementNumber: `SM-SEED-DSP-${tenantUniqueCode}-${salesSpec.suffix}` },
          {
            tenantId,
            movementNumber: `SM-SEED-DSP-${tenantUniqueCode}-${salesSpec.suffix}`,
            type: 'OUT',
            reason: 'SALE',
            itemId: dispatchItem.id,
            warehouseId: warehouse.id,
            quantity: salesSpec.itemQty,
            referenceType: 'SALES_ORDER',
            referenceId: historyOrder.id,
            unitCost: 8200,
            totalCost: 8200 * salesSpec.itemQty,
            status: 'COMPLETED',
            approvedBy: primaryUser.id,
            approvedAt: orderDate,
            notes: salesSpec.trackingStatus === 'DELAYED' ? 'Historical delayed dispatch generated by seed.' : 'Historical warehouse dispatch generated by seed.',
            createdBy: primaryUser.id,
            createdAt: orderDate
          },
          {
            quantity: salesSpec.itemQty,
            totalCost: 8200 * salesSpec.itemQty,
            approvedAt: orderDate
          }
        );
      }

      for (const lostDealSpec of [
        { suffix: 'LD1', monthsAgo: 2, day: 5, customerLabel: 'Dormant', reason: 'Lost to competitor pricing' },
        { suffix: 'LD2', monthsAgo: 4, day: 16, customerLabel: 'Paused', reason: 'Customer budget deferred' }
      ]) {
        const createdAt = historyDate(lostDealSpec.monthsAgo, lostDealSpec.day);
        const lostCustomer = await upsertFirst(
          prisma.customer,
          { tenantId, name: `Seed Lost Customer ${tenantCode} ${lostDealSpec.customerLabel}` },
          {
            tenantId,
            name: `Seed Lost Customer ${tenantCode} ${lostDealSpec.customerLabel}`,
            status: 'ACTIVE',
            type: 'BUSINESS',
            primaryEmail: `lost-${lostDealSpec.suffix.toLowerCase()}+${tenantLabel}@ueorms.local`,
            primaryPhone: '+1-555-0500',
            ownerId: primaryUser.id,
            category: 'PROSPECT',
            source: 'REFERRAL',
            createdAt
          },
          {
            ownerId: primaryUser.id,
            status: 'ACTIVE'
          }
        );

        await upsertFirst(
          prisma.deal,
          { tenantId, name: `Seed Lost Deal ${tenantCode} ${lostDealSpec.suffix}` },
          {
            tenantId,
            customerId: lostCustomer.id,
            name: `Seed Lost Deal ${tenantCode} ${lostDealSpec.suffix}`,
            stage: 'LOST',
            value: 22500,
            expectedCloseDate: offsetDate(createdAt, 15),
            status: 'LOST',
            dealNumber: `DEAL-SEED-${tenantUniqueCode}-${lostDealSpec.suffix}`,
            pipelineId: pipeline.id,
            stageOrder: 2,
            probability: 0,
            amount: 22500,
            currencyCode: 'USD',
            discount: 0,
            tax: 0,
            total: 22500,
            ownerId: primaryUser.id,
            teamMembers: [primaryUser.id],
            source: 'REFERRAL',
            createdAt,
            createdDate: createdAt,
            closedDate: offsetDate(createdAt, 20),
            lostReason: 'COMPETITION',
            lostToCompetitor: 'ControlHub',
            notes: lostDealSpec.reason
          },
          {
            status: 'LOST',
            stage: 'LOST',
            lostReason: 'COMPETITION',
            lostToCompetitor: 'ControlHub',
            notes: lostDealSpec.reason
          }
        );
      }

      const designFolder = await upsertFirst(
        prisma.documentFolder,
        { tenantId, name: 'Website Redesign', path: '/projects/website-redesign' },
        {
          tenantId,
          name: 'Website Redesign',
          description: 'Project documents for the website redesign initiative.',
          path: '/projects/website-redesign',
          color: '#0F766E',
          icon: 'LayoutTemplate',
          createdBy: adminUser.id
        },
        {
          description: 'Project documents for the website redesign initiative.',
          color: '#0F766E',
          icon: 'LayoutTemplate',
          createdBy: adminUser.id
        }
      );

      const redesignTemplate = await upsertFirst(
        prisma.documentTemplate,
        { tenantId, name: 'Website Redesign Brief Template' },
        {
          tenantId,
          name: 'Website Redesign Brief Template',
          description: 'Template used for website redesign discovery and scope sign-off.',
          category: 'REPORT',
          fileName: 'website-redesign-brief-template.docx',
          storagePath: `/templates/${tenantLabel}-website-redesign-brief-template.docx`,
          fileSize: 148000,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fields: [
            { name: 'projectName', type: 'text', required: true },
            { name: 'owner', type: 'text', required: true },
            { name: 'launchDate', type: 'date', required: false }
          ],
          usageCount: 2,
          isActive: true,
          createdBy: adminUser.id
        },
        {
          description: 'Template used for website redesign discovery and scope sign-off.',
          usageCount: 2,
          isActive: true
        }
      );

      const redesignDocument = await upsertFirst(
        prisma.document,
        { tenantId, fileName: `website-redesign-kickoff-${tenantLabel}.pdf` },
        {
          tenantId,
          folderId: designFolder.id,
          name: 'Website Redesign Kickoff Pack',
          description: 'Demo kickoff pack covering sitemap, UI goals, and release phases.',
          fileName: `website-redesign-kickoff-${tenantLabel}.pdf`,
          fileSize: 356000,
          mimeType: 'application/pdf',
          storagePath: `/documents/${tenantLabel}/website-redesign-kickoff.pdf`,
          storageProvider: 'LOCAL',
          checksum: `website-redesign-${tenantUniqueCode.toLowerCase()}-v1`,
          tags: ['website', 'redesign', 'ux'],
          metadata: {
            projectName: 'Website Redesign',
            owner: managerUser.email,
            tenantCode: tenantUniqueCode
          },
          version: 2,
          isLatest: true,
          status: 'ACTIVE',
          isPublic: false,
          downloadCount: 3,
          viewCount: 9,
          templateId: redesignTemplate.id,
          createdBy: managerUser.id,
          updatedBy: managerUser.id
        },
        {
          folderId: designFolder.id,
          description: 'Demo kickoff pack covering sitemap, UI goals, and release phases.',
          version: 2,
          downloadCount: 3,
          viewCount: 9,
          templateId: redesignTemplate.id,
          updatedBy: managerUser.id
        }
      );

      await upsertFirst(
        prisma.documentVersion,
        { documentId: redesignDocument.id, versionNumber: 1 },
        {
          documentId: redesignDocument.id,
          versionNumber: 1,
          fileName: `website-redesign-kickoff-${tenantLabel}-v1.pdf`,
          fileSize: 332000,
          storagePath: `/documents/${tenantLabel}/versions/website-redesign-kickoff-v1.pdf`,
          checksum: `website-redesign-${tenantUniqueCode.toLowerCase()}-v1`,
          changeLog: 'Initial scoped draft.',
          createdBy: managerUser.id
        },
        {
          changeLog: 'Initial scoped draft.'
        }
      );

      await upsertFirst(
        prisma.documentVersion,
        { documentId: redesignDocument.id, versionNumber: 2 },
        {
          documentId: redesignDocument.id,
          versionNumber: 2,
          fileName: `website-redesign-kickoff-${tenantLabel}-v2.pdf`,
          fileSize: 356000,
          storagePath: `/documents/${tenantLabel}/versions/website-redesign-kickoff-v2.pdf`,
          checksum: `website-redesign-${tenantUniqueCode.toLowerCase()}-v2`,
          changeLog: 'Updated with wireframe milestones and launch checklist.',
          createdBy: managerUser.id
        },
        {
          changeLog: 'Updated with wireframe milestones and launch checklist.'
        }
      );

      await upsertFirst(
        prisma.documentPermission,
        { documentId: redesignDocument.id, userId: taskUser.id },
        {
          documentId: redesignDocument.id,
          userId: taskUser.id,
          canView: true,
          canEdit: true,
          canDelete: false,
          canShare: false,
          canManage: false
        },
        {
          canView: true,
          canEdit: true,
          canDelete: false,
          canShare: false,
          canManage: false
        }
      );

      if (managerRole) {
        await upsertFirst(
          prisma.documentFolderPermission,
          { folderId: designFolder.id, roleId: managerRole.id },
          {
            folderId: designFolder.id,
            roleId: managerRole.id,
            canView: true,
            canEdit: true,
            canDelete: false,
            canCreate: true,
            canManage: true
          },
          {
            canView: true,
            canEdit: true,
            canDelete: false,
            canCreate: true,
            canManage: true
          }
        );
      }

      await upsertFirst(
        prisma.documentActivity,
        { tenantId, documentId: redesignDocument.id, action: 'CREATED' },
        {
          tenantId,
          documentId: redesignDocument.id,
          userId: managerUser.id,
          action: 'CREATED',
          details: { source: 'baseline-seed', version: 2 },
          ipAddress: '127.0.0.1',
          userAgent: 'demo-seed-script'
        },
        {
          userId: managerUser.id,
          details: { source: 'baseline-seed', version: 2 }
        }
      );

      await upsertFirst(
        prisma.documentComment,
        { documentId: redesignDocument.id, userId: taskUser.id, content: 'Homepage hero section copy is ready for review.' },
        {
          documentId: redesignDocument.id,
          userId: taskUser.id,
          content: 'Homepage hero section copy is ready for review.'
        },
        {
          content: 'Homepage hero section copy is ready for review.'
        }
      );

      const peripheralsCategory = await upsertFirst(
        prisma.assetCategory,
        { tenantId, code: 'PERIPHERALS' },
        {
          tenantId,
          name: 'Peripherals',
          code: 'PERIPHERALS',
          description: 'Monitors, tablets, and supporting office hardware.',
          defaultDepreciationMethod: 'STRAIGHT_LINE',
          defaultDepreciationRate: 25,
          defaultUsefulLife: 48,
          isActive: true
        },
        {
          description: 'Monitors, tablets, and supporting office hardware.',
          defaultDepreciationRate: 25,
          defaultUsefulLife: 48,
          isActive: true
        }
      );

      const allocatedAsset = await upsertFirst(
        prisma.asset,
        { tenantId, assetCode: `AST-MON-${tenantUniqueCode}` },
        {
          tenantId,
          categoryId: peripheralsCategory.id,
          assetCode: `AST-MON-${tenantUniqueCode}`,
          name: 'Design Review Monitor',
          description: 'Allocated to the website redesign team for UX reviews.',
          purchaseDate: historyDate(3, 12),
          purchasePrice: 28000,
          vendor: 'Pixel Displays Pvt Ltd',
          invoiceNumber: `MON-${tenantUniqueCode}`,
          serialNumber: `MON-${tenantUniqueCode}-01`,
          model: 'UltraView 32',
          manufacturer: 'ViewTech',
          location: 'Design Studio',
          status: 'ALLOCATED',
          condition: 'EXCELLENT',
          depreciationMethod: 'STRAIGHT_LINE',
          depreciationRate: 25,
          usefulLife: 48,
          salvageValue: 4000,
          currentValue: 26250,
          accumulatedDepreciation: 1750,
          warrantyExpiry: addDays(420),
          notes: 'Primary monitor used for design walkthroughs.',
          tags: ['design', 'monitor']
        },
        {
          categoryId: peripheralsCategory.id,
          status: 'ALLOCATED',
          condition: 'EXCELLENT',
          currentValue: 26250,
          accumulatedDepreciation: 1750
        }
      );

      const maintenanceAsset = await upsertFirst(
        prisma.asset,
        { tenantId, assetCode: `AST-TAB-${tenantUniqueCode}` },
        {
          tenantId,
          categoryId: peripheralsCategory.id,
          assetCode: `AST-TAB-${tenantUniqueCode}`,
          name: 'Client Demo Tablet',
          description: 'Tablet used in mobile layout validation, currently under maintenance.',
          purchaseDate: historyDate(7, 8),
          purchasePrice: 46000,
          vendor: 'Mobility Hub',
          invoiceNumber: `TAB-${tenantUniqueCode}`,
          serialNumber: `TAB-${tenantUniqueCode}-01`,
          model: 'SketchTab Pro',
          manufacturer: 'SketchTab',
          location: 'IT Repair Desk',
          status: 'MAINTENANCE',
          condition: 'FAIR',
          depreciationMethod: 'STRAIGHT_LINE',
          depreciationRate: 30,
          usefulLife: 36,
          salvageValue: 3000,
          currentValue: 36800,
          accumulatedDepreciation: 9200,
          notes: 'Battery replacement and calibration are pending.',
          tags: ['tablet', 'maintenance']
        },
        {
          categoryId: peripheralsCategory.id,
          status: 'MAINTENANCE',
          condition: 'FAIR',
          currentValue: 36800,
          accumulatedDepreciation: 9200
        }
      );

      await upsertFirst(
        prisma.assetAllocation,
        { tenantId, assetId: allocatedAsset.id, employeeId: taskEmployee.id },
        {
          tenantId,
          assetId: allocatedAsset.id,
          employeeId: taskEmployee.id,
          allocatedDate: addDays(-21),
          expectedReturnDate: addDays(180),
          status: 'ACTIVE',
          purpose: 'Website redesign prototyping and client walkthroughs.',
          allocatedBy: adminUser.id,
          location: 'Design Studio',
          notes: 'Allocated for daily UI review cycles.'
        },
        {
          status: 'ACTIVE',
          expectedReturnDate: addDays(180),
          allocatedBy: adminUser.id,
          location: 'Design Studio'
        }
      );

      await upsertFirst(
        prisma.assetMaintenance,
        { tenantId, assetId: maintenanceAsset.id, description: 'Battery calibration and screen inspection' },
        {
          tenantId,
          assetId: maintenanceAsset.id,
          maintenanceType: 'CORRECTIVE',
          scheduledDate: addDays(-2),
          completedDate: null,
          status: 'IN_PROGRESS',
          statusBeforeMaintenance: 'ALLOCATED',
          description: 'Battery calibration and screen inspection',
          performedBy: 'Mobility Hub Service Desk',
          cost: 2400,
          conditionBefore: 'FAIR',
          nextMaintenanceDate: addDays(90),
          notes: 'Repair expected to finish next week.'
        },
        {
          status: 'IN_PROGRESS',
          performedBy: 'Mobility Hub Service Desk',
          cost: 2400,
          nextMaintenanceDate: addDays(90)
        }
      );

      await upsertFirst(
        prisma.assetDepreciation,
        { tenantId, assetId: allocatedAsset.id, year: 2026, month: 4 },
        {
          tenantId,
          assetId: allocatedAsset.id,
          period: new Date('2026-04-30T00:00:00.000Z'),
          year: 2026,
          month: 4,
          openingValue: 26850,
          depreciationAmount: 600,
          closingValue: 26250,
          accumulatedDepreciation: 1750,
          method: 'STRAIGHT_LINE',
          rate: 25,
          notes: 'Seeded monitor depreciation for dashboard trends.'
        },
        {
          openingValue: 26850,
          depreciationAmount: 600,
          closingValue: 26250,
          accumulatedDepreciation: 1750,
          method: 'STRAIGHT_LINE',
          rate: 25
        }
      );

      const uxReviewTask = await upsertFirst(
        prisma.task,
        { tenantId, employeeId: taskEmployee.id, title: 'Prepare homepage UX review' },
        {
          tenantId,
          employeeId: taskEmployee.id,
          assignedBy: managerEmployee.id,
          title: 'Prepare homepage UX review',
          description: 'Consolidate hero section, navigation, and CTA feedback before the client review.',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: addDays(3)
        },
        {
          assignedBy: managerEmployee.id,
          description: 'Consolidate hero section, navigation, and CTA feedback before the client review.',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          dueDate: addDays(3)
        }
      );

      await upsertFirst(
        prisma.task,
        { tenantId, employeeId: managerEmployee.id, title: 'Approve redesign release checklist' },
        {
          tenantId,
          employeeId: managerEmployee.id,
          assignedBy: adminEmployee.id,
          title: 'Approve redesign release checklist',
          description: 'Validate analytics tags, accessibility notes, and launch dependencies.',
          priority: 'MEDIUM',
          status: 'PENDING',
          dueDate: addDays(5)
        },
        {
          assignedBy: adminEmployee.id,
          priority: 'MEDIUM',
          status: 'PENDING',
          dueDate: addDays(5)
        }
      );

      for (const notificationSpec of [
        {
          employeeId: taskEmployee.id,
          type: 'TASK_ASSIGNED',
          title: 'Homepage UX review assigned',
          message: 'Prepare the Website Redesign homepage UX review for tomorrow\'s standup.',
          isRead: false
        },
        {
          employeeId: managerEmployee.id,
          type: 'DEADLINE_REMINDER',
          title: 'Release checklist due soon',
          message: 'Website Redesign release checklist is due in 5 days.',
          isRead: false
        },
        {
          employeeId: taskEmployee.id,
          type: 'TASK_OVERDUE',
          title: 'Tablet maintenance update pending',
          message: 'Client Demo Tablet maintenance status needs an updated ETA.',
          isRead: true
        }
      ]) {
        await upsertFirst(
          prisma.notification,
          { tenantId, employeeId: notificationSpec.employeeId, title: notificationSpec.title },
          {
            tenantId,
            employeeId: notificationSpec.employeeId,
            type: notificationSpec.type,
            title: notificationSpec.title,
            message: notificationSpec.message,
            isRead: notificationSpec.isRead
          },
          {
            type: notificationSpec.type,
            message: notificationSpec.message,
            isRead: notificationSpec.isRead
          }
        );
      }

      const websiteProject = await upsertFirst(
        prisma.project,
        { projectCode: `PRJ-WEB-${tenantUniqueCode}` },
        {
          tenantId,
          projectCode: `PRJ-WEB-${tenantUniqueCode}`,
          projectName: 'Website Redesign',
          description: 'Marketing website redesign with content refresh, analytics, and responsive UI cleanup.',
          clientName: tenant.name,
          projectManager: managerEmployee.id,
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          type: 'INTERNAL',
          startDate: historyDate(1, 4),
          endDate: addDays(24),
          actualStartDate: historyDate(1, 6),
          estimatedBudget: 180000,
          actualCost: 74500,
          progressPercent: 58,
          totalPlannedHours: 240,
          totalActualHours: 121,
          totalResourceCost: 68200,
          budgetVariance: -105500,
          scheduleVariance: -3,
          utilizationPercent: 84,
          healthScore: 'YELLOW',
          riskLevel: 'MEDIUM',
          departmentId: defaultDepartment.id,
          documentFolderId: designFolder.id,
          customFields: { channel: 'marketing', release: 'summer-refresh' },
          notes: 'Demo project used for task, milestone, and dashboard coverage.',
          attachments: [`/documents/${tenantLabel}/website-redesign-kickoff.pdf`],
          createdBy: adminUser.id
        },
        {
          projectManager: managerEmployee.id,
          status: 'IN_PROGRESS',
          progressPercent: 58,
          totalActualHours: 121,
          totalResourceCost: 68200,
          budgetVariance: -105500,
          scheduleVariance: -3,
          healthScore: 'YELLOW',
          riskLevel: 'MEDIUM',
          documentFolderId: designFolder.id
        }
      );

      for (const projectMember of [
        { employee: managerEmployee, userId: managerUser.id, role: 'PROJECT_MANAGER', allocationPercent: 50, hourlyRate: 1800 },
        { employee: taskEmployee, userId: taskUser.id, role: 'DESIGNER', allocationPercent: 85, hourlyRate: 1400 }
      ]) {
        await upsertFirst(
          prisma.projectMember,
          { projectId: websiteProject.id, employeeId: projectMember.employee.id },
          {
            tenantId,
            projectId: websiteProject.id,
            employeeId: projectMember.employee.id,
            userId: projectMember.userId,
            role: projectMember.role,
            allocationPercent: projectMember.allocationPercent,
            startDate: historyDate(1, 6),
            status: 'ACTIVE',
            hourlyRate: projectMember.hourlyRate,
            permissions: { canApproveTime: projectMember.role === 'PROJECT_MANAGER' },
            notes: 'Seeded Website Redesign project member.'
          },
          {
            userId: projectMember.userId,
            role: projectMember.role,
            allocationPercent: projectMember.allocationPercent,
            hourlyRate: projectMember.hourlyRate,
            status: 'ACTIVE'
          }
        );
      }

      const discoveryMilestone = await upsertFirst(
        prisma.projectMilestone,
        { projectId: websiteProject.id, milestoneName: 'Discovery and Wireframes' },
        {
          tenantId,
          projectId: websiteProject.id,
          milestoneName: 'Discovery and Wireframes',
          description: 'Audit navigation, refresh information architecture, and finalize wireframes.',
          status: 'COMPLETED',
          startDate: historyDate(1, 6),
          dueDate: historyDate(0, 2),
          completedDate: historyDate(0, 1),
          progressPercent: 100,
          assignedTo: taskEmployee.id,
          deliverables: [
            { name: 'Navigation map', status: 'DONE' },
            { name: 'Homepage wireframe', status: 'DONE' }
          ],
          isCriticalPath: true,
          isAutoScheduled: false,
          notes: 'Discovery sign-off completed.',
          createdBy: managerUser.id
        },
        {
          status: 'COMPLETED',
          completedDate: historyDate(0, 1),
          progressPercent: 100,
          assignedTo: taskEmployee.id
        }
      );

      const implementationMilestone = await upsertFirst(
        prisma.projectMilestone,
        { projectId: websiteProject.id, milestoneName: 'Responsive UI Implementation' },
        {
          tenantId,
          projectId: websiteProject.id,
          milestoneName: 'Responsive UI Implementation',
          description: 'Implement approved pages and refine tablet/mobile layouts.',
          status: 'IN_PROGRESS',
          startDate: historyDate(0, 3),
          dueDate: addDays(10),
          progressPercent: 62,
          assignedTo: taskEmployee.id,
          deliverables: [
            { name: 'Homepage implementation', status: 'DONE' },
            { name: 'Case study template', status: 'IN_PROGRESS' }
          ],
          isCriticalPath: true,
          isAutoScheduled: true,
          notes: 'Awaiting final QA on breakpoints.',
          createdBy: managerUser.id
        },
        {
          status: 'IN_PROGRESS',
          dueDate: addDays(10),
          progressPercent: 62,
          assignedTo: taskEmployee.id
        }
      );

      await upsertFirst(
        prisma.projectMilestoneDependency,
        { predecessorId: discoveryMilestone.id, successorId: implementationMilestone.id },
        {
          tenantId,
          predecessorId: discoveryMilestone.id,
          successorId: implementationMilestone.id,
          dependencyType: 'FS',
          lagDays: 0
        },
        {
          dependencyType: 'FS',
          lagDays: 0
        }
      );

      const redesignTimesheet = await upsertFirst(
        prisma.projectTimesheet,
        { tenantId, employeeId: taskEmployee.id, weekStartDate: new Date('2026-04-06T00:00:00.000Z') },
        {
          tenantId,
          employeeId: taskEmployee.id,
          weekStartDate: new Date('2026-04-06T00:00:00.000Z'),
          weekEndDate: new Date('2026-04-12T23:59:59.000Z'),
          status: 'APPROVED',
          totalHours: 38.5,
          billableHours: 24,
          submittedAt: new Date('2026-04-11T15:30:00.000Z'),
          submittedBy: taskUser.id,
          approvedAt: new Date('2026-04-12T10:00:00.000Z'),
          approvedBy: managerUser.id,
          notes: 'Website redesign sprint timesheet.'
        },
        {
          status: 'APPROVED',
          totalHours: 38.5,
          billableHours: 24,
          approvedAt: new Date('2026-04-12T10:00:00.000Z'),
          approvedBy: managerUser.id,
          notes: 'Website redesign sprint timesheet.'
        }
      );

      await upsertFirst(
        prisma.projectTimeLog,
        { projectId: websiteProject.id, employeeId: taskEmployee.id, taskDescription: 'Built homepage and campaign landing page layouts' },
        {
          tenantId,
          projectId: websiteProject.id,
          employeeId: taskEmployee.id,
          timesheetId: redesignTimesheet.id,
          logDate: new Date('2026-04-08T00:00:00.000Z'),
          hoursWorked: 8,
          taskDescription: 'Built homepage and campaign landing page layouts',
          milestoneId: implementationMilestone.id,
          billable: false,
          hourlyRate: 1400,
          totalCost: 11200,
          status: 'APPROVED',
          notes: 'Responsive layout and component polish.'
        },
        {
          timesheetId: redesignTimesheet.id,
          hoursWorked: 8,
          milestoneId: implementationMilestone.id,
          totalCost: 11200,
          status: 'APPROVED'
        }
      );

      await upsertFirst(
        prisma.projectTimeLog,
        { projectId: websiteProject.id, employeeId: managerEmployee.id, taskDescription: 'Reviewed scope changes and approved wireframes' },
        {
          tenantId,
          projectId: websiteProject.id,
          employeeId: managerEmployee.id,
          logDate: new Date('2026-04-09T00:00:00.000Z'),
          hoursWorked: 3.5,
          taskDescription: 'Reviewed scope changes and approved wireframes',
          milestoneId: discoveryMilestone.id,
          billable: false,
          hourlyRate: 1800,
          totalCost: 6300,
          status: 'APPROVED',
          notes: 'Stakeholder review and approval pass.'
        },
        {
          hoursWorked: 3.5,
          milestoneId: discoveryMilestone.id,
          totalCost: 6300,
          status: 'APPROVED'
        }
      );

      for (const contactSpec of [
        {
          name: `${tenantCode} Marketing Lead`,
          email: `marketing-lead+${tenantLabel}@ueorms.local`,
          title: 'Marketing Lead',
          role: 'DECISION_MAKER',
          isPrimary: true,
          tags: ['website', 'marketing', 'primary']
        },
        {
          name: `${tenantCode} Brand Coordinator`,
          email: `brand-coordinator+${tenantLabel}@ueorms.local`,
          title: 'Brand Coordinator',
          role: 'INFLUENCER',
          isPrimary: false,
          tags: ['brand', 'content']
        }
      ]) {
        const [firstName, ...lastNameParts] = contactSpec.name.split(' ');
        await upsertFirst(
          prisma.contact,
          { tenantId, customerId: customer.id, email: contactSpec.email },
          {
            tenantId,
            customerId: customer.id,
            name: contactSpec.name,
            email: contactSpec.email,
            phone: '+1-555-0600',
            title: contactSpec.title,
            status: 'ACTIVE',
            firstName,
            lastName: lastNameParts.join(' '),
            jobTitle: contactSpec.title,
            department: 'Marketing',
            role: contactSpec.role,
            mobilePhone: '+1-555-0601',
            workPhone: '+1-555-0602',
            linkedinUrl: 'https://linkedin.com/company/demo',
            isPrimary: contactSpec.isPrimary,
            ownerId: managerUser.id,
            preferredChannel: 'EMAIL',
            lastContactDate: addDays(-2),
            emailOptIn: true,
            smsOptIn: false,
            doNotCall: false,
            tags: contactSpec.tags,
            customFields: { initiative: 'Website Redesign' }
          },
          {
            title: contactSpec.title,
            jobTitle: contactSpec.title,
            role: contactSpec.role,
            isPrimary: contactSpec.isPrimary,
            ownerId: managerUser.id,
            lastContactDate: addDays(-2),
            tags: contactSpec.tags
          }
        );
      }

      const overflowWarehouse = await upsertFirst(
        prisma.warehouse,
        { tenantId, code: 'SEED-WH-02' },
        {
          tenantId,
          branchId: branch.id,
          code: 'SEED-WH-02',
          name: 'Overflow Warehouse',
          type: 'GENERAL',
          address: 'Plot 22, Logistics Park',
          city: 'Seed City',
          state: 'Gujarat',
          country: 'India',
          postalCode: '380001',
          capacity: 4500,
          unit: 'SQFT',
          managerId: managerUser.id,
          phone: '+91-79-5000-2200',
          isActive: true
        },
        {
          name: 'Overflow Warehouse',
          capacity: 4500,
          managerId: managerUser.id,
          phone: '+91-79-5000-2200',
          isActive: true
        }
      );

      await upsertFirst(
        prisma.warehouseStock,
        { warehouseId: overflowWarehouse.id, itemId: dispatchItem.id },
        {
          tenantId,
          warehouseId: overflowWarehouse.id,
          itemId: dispatchItem.id,
          quantity: 9,
          reservedQty: 1,
          availableQty: 8,
          binLocation: 'B-04-02',
          zone: 'DRY',
          reorderPoint: 4,
          reorderQty: 6,
          minStock: 2,
          maxStock: 25,
          avgCost: 8250,
          lastPurchasePrice: 8300
        },
        {
          quantity: 9,
          reservedQty: 1,
          availableQty: 8,
          binLocation: 'B-04-02',
          zone: 'DRY',
          avgCost: 8250,
          lastPurchasePrice: 8300
        }
      );

      await upsertFirst(
        prisma.stockMovement,
        { tenantId, movementNumber: `SM-SEED-TRF-${tenantUniqueCode}` },
        {
          tenantId,
          movementNumber: `SM-SEED-TRF-${tenantUniqueCode}`,
          type: 'TRANSFER',
          reason: 'TRANSFER',
          itemId: dispatchItem.id,
          fromWarehouseId: warehouse.id,
          toWarehouseId: overflowWarehouse.id,
          quantity: 4,
          referenceType: 'ADJUSTMENT',
          referenceId: `TRF-${tenantUniqueCode}`,
          unitCost: 8200,
          totalCost: 32800,
          status: 'COMPLETED',
          approvedBy: managerUser.id,
          approvedAt: addDays(-2),
          notes: 'Seeded transfer to balance overflow warehouse inventory.',
          createdBy: managerUser.id,
          createdAt: addDays(-2)
        },
        {
          quantity: 4,
          totalCost: 32800,
          status: 'COMPLETED',
          approvedBy: managerUser.id,
          approvedAt: addDays(-2)
        }
      );

      const analyticsVendor = await upsertFirst(
        prisma.vendor,
        { tenantId, name: `Analytics Supplier ${tenantCode}` },
        {
          tenantId,
          vendorCode: `AV-${tenantUniqueCode}`,
          name: `Analytics Supplier ${tenantCode}`,
          contactPerson: 'Supplier Success Desk',
          email: `analytics-vendor+${tenantLabel}@ueorms.local`,
          phone: '+91-79-5000-3300',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          paymentTerms: 'NET45',
          status: 'ACTIVE',
          category: 'SERVICES',
          rating: 4.4,
          notes: 'Secondary supplier seeded for purchase analytics vendor comparison.'
        },
        {
          email: `analytics-vendor+${tenantLabel}@ueorms.local`,
          paymentTerms: 'NET45',
          status: 'ACTIVE',
          rating: 4.4
        }
      );

      const analyticsRequisition = await upsertFirst(
        prisma.purchaseRequisition,
        { requisitionNumber: `PR-SEED-${tenantUniqueCode}-VA1` },
        {
          tenantId,
          requisitionNumber: `PR-SEED-${tenantUniqueCode}-VA1`,
          requestedBy: managerUser.id,
          departmentId: defaultDepartment.id,
          vendorId: analyticsVendor.id,
          title: 'Analytics dashboard accessories requisition',
          description: 'Additional supplier mix for purchase analytics dashboards.',
          priority: 'MEDIUM',
          requestedDate: historyDate(1, 11),
          requiredDate: historyDate(1, 20),
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approvedBy: adminUser.id,
          approvedAt: historyDate(1, 12),
          items: [
            {
              itemName: dispatchItem.name,
              description: 'Display accessories and stock top-up',
              quantity: 3,
              estimatedPrice: 8450,
              unit: 'unit'
            }
          ],
          totalAmount: 25350,
          notes: 'Seeded alternate vendor requisition.'
        },
        {
          vendorId: analyticsVendor.id,
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approvedBy: adminUser.id,
          approvedAt: historyDate(1, 12),
          totalAmount: 25350
        }
      );

      await upsertFirst(
        prisma.purchaseOrder,
        { poNumber: `PO-SEED-${tenantUniqueCode}-VA1` },
        {
          tenantId,
          poNumber: `PO-SEED-${tenantUniqueCode}-VA1`,
          requisitionId: analyticsRequisition.id,
          vendorId: analyticsVendor.id,
          title: 'Analytics supplier replenishment PO',
          description: 'Supplementary order to diversify purchase analytics vendor trends.',
          orderDate: historyDate(1, 13),
          expectedDeliveryDate: historyDate(1, 19),
          actualDeliveryDate: historyDate(1, 18),
          status: 'RECEIVED',
          items: [
            {
              itemName: dispatchItem.name,
              description: 'Display accessories and stock top-up',
              quantity: 3,
              unitPrice: 8450,
              unit: 'unit',
              tax: 2282,
              discount: 0,
              total: 27632
            }
          ],
          subtotal: 25350,
          taxAmount: 2282,
          discountAmount: 0,
          shippingCost: 350,
          totalAmount: 27982,
          paymentTerms: 'NET45',
          paymentStatus: 'PARTIAL',
          shippingAddress: 'Overflow Warehouse',
          shippingMethod: 'Road',
          approvalStatus: 'APPROVED',
          approvedBy: adminUser.id,
          approvedAt: historyDate(1, 13),
          createdBy: managerUser.id,
          createdAt: historyDate(1, 13)
        },
        {
          requisitionId: analyticsRequisition.id,
          vendorId: analyticsVendor.id,
          status: 'RECEIVED',
          paymentStatus: 'PARTIAL',
          approvalStatus: 'APPROVED',
          totalAmount: 27982
        }
      );

      await upsertFirst(
        prisma.supplierEvaluation,
        { tenantId, vendorId: analyticsVendor.id, evaluationPeriod: 'Q2-2026' },
        {
          tenantId,
          vendorId: analyticsVendor.id,
          evaluatedBy: managerUser.id,
          evaluationDate: new Date('2026-04-18T00:00:00.000Z'),
          evaluationPeriod: 'Q2-2026',
          qualityRating: 4.5,
          deliveryRating: 4.2,
          priceRating: 4.0,
          serviceRating: 4.4,
          communicationRating: 4.7,
          overallRating: 4.36,
          onTimeDeliveryRate: 93,
          defectRate: 1.2,
          responseTime: '6 hours',
          strengths: 'Responsive support and predictable delivery cadence.',
          weaknesses: 'Pricing is slightly above the main supplier.',
          recommendations: 'Retain as secondary supplier for fast-moving items.',
          status: 'COMPLETED',
          notes: 'Seeded supplier evaluation for purchase analytics.'
        },
        {
          evaluatedBy: managerUser.id,
          qualityRating: 4.5,
          deliveryRating: 4.2,
          priceRating: 4.0,
          serviceRating: 4.4,
          communicationRating: 4.7,
          overallRating: 4.36,
          onTimeDeliveryRate: 93,
          defectRate: 1.2,
          responseTime: '6 hours',
          status: 'COMPLETED'
        }
      );
    }
  }
};

export const seedComprehensiveDemoData = async () => {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('🌱 Seeding tenant and subscription...');
  const { tenant } = await seedTenantAndSubscription();
  
  console.log('🌱 Seeding organization, departments, and users...');
  const { departments, users, employees } = await seedOrganization(tenant.id, passwordHash);
  
  console.log('🌱 Seeding branch, inventory, and manufacturing...');
  const { warehouse, items } = await seedBranchInventoryAndManufacturing(tenant.id, departments, users);
  
  console.log('🌱 Seeding HR and payroll...');
  const hr = await seedHRAndPayroll(tenant.id, employees, departments, users);
  
  console.log('🌱 Seeding CRM and sales...');
  const crmSales = await seedCRMAndSales(tenant.id, users, employees, items);
  
  console.log('🌱 Seeding purchase, AP, and finance...');
  const finance = await seedPurchaseAPAndFinance(tenant.id, users, departments, warehouse, items, employees);
  
  console.log('🌱 Seeding projects and assets...');
  const projectsAssets = await seedProjectsAndAssets(tenant.id, employees, departments, users);
  
  console.log('🌱 Seeding documents, reports, and communication...');
  await seedDocumentsReportsCommunication(
    tenant.id,
    users,
    crmSales.customer,
    crmSales.deal,
    projectsAssets.project
  );
  
  console.log('🌱 Seeding workflows, notifications, and customizations...');
  await seedWorkflowsNotificationsAndCustomizations(
    tenant.id,
    users,
    employees,
    hr.leaveRequest,
    hr.expenseClaim,
    projectsAssets.project
  );

  // ============================================
  // ENHANCED SEED DATA (15 CATEGORIES)
  // ============================================
  
  console.log('🚀 ENHANCING WITH COMPREHENSIVE TEST DATA...\n');
  
  console.log('📊 [1/6] Adding more employees to each department (3-5 per dept)...');
  const additionalEmployees = await seedAdditionalEmployees(tenant.id, departments, employees);
  console.log(`    ✓ Added ${additionalEmployees.length} employees across all departments`);
  
  console.log('📦 [2/6] Adding goods receipt records with line items...');
  const additionalGRs = await seedAdditionalGoodsReceipts(tenant.id, users, warehouse, items, finance.purchaseOrder);
  console.log(`    ✓ Added ${additionalGRs.length} goods receipt records`);
  
  console.log('🚚 [3/6] Adding warehouse dispatch and stock movements...');
  const movements = await seedWarehouseDispatchAndMovements(tenant.id, users, warehouse, items);
  console.log(`    ✓ Added ${movements.length} warehouse dispatch/movement records`);
  
  console.log('✅ [4/6] Adding finance approvals for POs, bills, and expenses...');
  const approvals = await seedFinanceApprovals(tenant.id, users, employees);
  console.log(`    ✓ Added ${approvals.length} approval workflow records`);
  
  console.log('📄 [5/6] Adding comprehensive documents with folders and files...');
  const documents = await seedEnhancedDocuments(tenant.id, users, employees);
  console.log(`    ✓ Added ${documents.length} documents with organized folder structure`);
  
  console.log('🏢 [6/6] Adding additional vendors with evaluation data...');
  const additionalVendors = await seedAdditionalVendors(tenant.id, users);
  console.log(`    ✓ Added ${additionalVendors.length} vendors with comprehensive data`);

  await seedBaselineForExistingTenants(passwordHash);

  console.log('\n✨ ========================================');
  console.log('✨ Comprehensive demo seed completed successfully!');
  console.log('✨ ========================================\n');
  console.log('📋 Demo Data Summary:');
  console.log(`   • Tenant: UEORMS Demo Tenant`);
  console.log(`   • Admin Login: ${DEMO_ADMIN_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`   • Total Employees: ${5 + additionalEmployees.length}`);
  console.log(`   • Goods Receipts: ${additionalGRs.length + 1}`);
  console.log(`   • Stock Movements: ${movements.length + 2}`);
  console.log(`   • Finance Approvals: ${approvals.length}`);
  console.log(`   • Documents: ${documents.length}`);
  console.log(`   • Vendors: ${additionalVendors.length + 1}`);
  console.log('✨ ========================================\n');
};