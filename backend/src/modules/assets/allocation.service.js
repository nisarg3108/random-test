import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// ASSET ALLOCATION SERVICES
// ========================================

export const allocateAsset = async (data, tenantId) => {
  const { assetId, employeeId, allocatedDate, expectedReturnDate, purpose, location, allocatedBy } = data;

  // Check if asset is available
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, tenantId },
  });

  if (!asset) {
    throw new Error('Asset not found');
  }

  if (asset.status !== 'AVAILABLE') {
    throw new Error(`Asset is currently ${asset.status.toLowerCase()} and cannot be allocated`);
  }

  // Check if employee exists
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  // Create allocation and update asset status in a transaction
  const [allocation] = await prisma.$transaction([
    prisma.assetAllocation.create({
      data: {
        tenantId,
        assetId,
        employeeId,
        allocatedDate: allocatedDate ? new Date(allocatedDate) : new Date(),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        purpose,
        location,
        allocatedBy,
        status: 'ACTIVE',
      },
      include: {
        asset: {
          include: { category: true },
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
            designation: true,
          },
        },
      },
    }),
    prisma.asset.update({
      where: { id: assetId },
      data: { status: 'ALLOCATED' },
    }),
  ]);

  return allocation;
};

export const listAllocations = async (tenantId, filters = {}) => {
  const where = { tenantId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  if (filters.assetId) {
    where.assetId = filters.assetId;
  }

  const allocations = await prisma.assetAllocation.findMany({
    where,
    include: {
      asset: {
        include: { category: true },
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          designation: true,
        },
      },
    },
    orderBy: { allocatedDate: 'desc' },
  });

  return allocations;
};

export const getAllocationById = async (id, tenantId) => {
  const allocation = await prisma.assetAllocation.findFirst({
    where: { id, tenantId },
    include: {
      asset: {
        include: { category: true },
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          designation: true,
          department: {
            select: { name: true },
          },
        },
      },
    },
  });
  return allocation;
};

export const returnAsset = async (id, data, tenantId) => {
  const { returnCondition, returnNotes } = data;

  // Get the allocation (allow ACTIVE or OVERDUE)
  const allocation = await prisma.assetAllocation.findFirst({
    where: { id, tenantId, status: { in: ['ACTIVE', 'OVERDUE'] } },
  });

  if (!allocation) {
    throw new Error('Active allocation not found');
  }

  // Update allocation and asset status in a transaction
  const [updatedAllocation] = await prisma.$transaction([
    prisma.assetAllocation.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnDate: new Date(),
        returnCondition,
        returnNotes,
      },
      include: {
        asset: {
          include: { category: true },
        },
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
          },
        },
      },
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: {
        status: 'AVAILABLE',
        condition: returnCondition || undefined,
      },
    }),
  ]);

  return updatedAllocation;
};

export const updateAllocation = async (id, data, tenantId) => {
  const allocation = await prisma.assetAllocation.update({
    where: { id },
    data: {
      ...data,
      tenantId,
    },
    include: {
      asset: {
        include: { category: true },
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
        },
      },
    },
  });
  return allocation;
};

export const getMyAllocations = async (employeeId, tenantId) => {
  const allocations = await prisma.assetAllocation.findMany({
    where: {
      employeeId,
      tenantId,
      status: 'ACTIVE',
    },
    include: {
      asset: {
        include: { category: true },
      },
    },
    orderBy: { allocatedDate: 'desc' },
  });

  return allocations;
};

/**
 * Mark overdue allocations
 * Scans all ACTIVE allocations and marks them as OVERDUE if past expectedReturnDate
 */
export const markOverdueAllocations = async () => {
  const now = new Date();
  
  // Find all ACTIVE allocations that are past their expected return date
  const overdueAllocations = await prisma.assetAllocation.findMany({
    where: {
      status: 'ACTIVE',
      expectedReturnDate: {
        lt: now, // Less than current time = overdue
      },
    },
  });

  if (overdueAllocations.length === 0) {
    return { count: 0, allocations: [] };
  }

  // Update all overdue allocations to OVERDUE status
  const updatePromises = overdueAllocations.map((allocation) =>
    prisma.assetAllocation.update({
      where: { id: allocation.id },
      data: { status: 'OVERDUE' },
    })
  );

  await Promise.all(updatePromises);

  return {
    count: overdueAllocations.length,
    allocations: overdueAllocations.map(a => ({
      id: a.id,
      assetId: a.assetId,
      employeeId: a.employeeId,
      expectedReturnDate: a.expectedReturnDate,
    })),
  };
};

/**
 * Get overdue allocations
 * Returns all allocations with OVERDUE status
 */
export const getOverdueAllocations = async (tenantId) => {
  const allocations = await prisma.assetAllocation.findMany({
    where: {
      tenantId,
      status: 'OVERDUE',
    },
    include: {
      asset: {
        include: { category: true },
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          email: true,
          designation: true,
          department: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { expectedReturnDate: 'asc' }, // Oldest overdue first
  });

  return allocations;
};
