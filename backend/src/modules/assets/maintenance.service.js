import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// ASSET MAINTENANCE SERVICES
// ========================================

export const createMaintenanceSchedule = async (data, tenantId) => {
  const schedule = await prisma.assetMaintenance.create({
    data: {
      ...data,
      tenantId,
      scheduledDate: new Date(data.scheduledDate),
      completedDate: data.completedDate ? new Date(data.completedDate) : null,
      nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
    },
    include: {
      asset: {
        include: { category: true },
      },
    },
  });
  return schedule;
};

export const listMaintenanceSchedules = async (tenantId, filters = {}) => {
  const where = { tenantId };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.assetId) {
    where.assetId = filters.assetId;
  }

  if (filters.maintenanceType) {
    where.maintenanceType = filters.maintenanceType;
  }

  const schedules = await prisma.assetMaintenance.findMany({
    where,
    include: {
      asset: {
        include: { category: true },
      },
    },
    orderBy: { scheduledDate: 'desc' },
  });

  return schedules;
};

export const getMaintenanceById = async (id, tenantId) => {
  const schedule = await prisma.assetMaintenance.findFirst({
    where: { id, tenantId },
    include: {
      asset: {
        include: { category: true },
      },
    },
  });
  return schedule;
};

export const updateMaintenance = async (id, data, tenantId) => {
  const updateData = { ...data };
  
  if (data.scheduledDate) {
    updateData.scheduledDate = new Date(data.scheduledDate);
  }
  if (data.completedDate) {
    updateData.completedDate = new Date(data.completedDate);
  }
  if (data.nextMaintenanceDate) {
    updateData.nextMaintenanceDate = new Date(data.nextMaintenanceDate);
  }

  const schedule = await prisma.assetMaintenance.update({
    where: { id },
    data: updateData,
    include: {
      asset: {
        include: { category: true },
      },
    },
  });
  return schedule;
};

export const completeMaintenance = async (id, data, tenantId) => {
  const { performedBy, cost, conditionAfter, nextMaintenanceDate, notes } = data;

  // Get the maintenance record
  const maintenance = await prisma.assetMaintenance.findFirst({
    where: { id, tenantId },
  });

  if (!maintenance) {
    throw new Error('Maintenance schedule not found');
  }

  if (maintenance.status === 'COMPLETED') {
    throw new Error('Maintenance already completed');
  }

  // Update maintenance and possibly asset condition
  const updates = [
    prisma.assetMaintenance.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        performedBy,
        cost: cost || 0,
        conditionAfter,
        nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
        notes,
      },
      include: {
        asset: {
          include: { category: true },
        },
      },
    }),
  ];

  // Update asset condition if provided
  if (conditionAfter) {
    updates.push(
      prisma.asset.update({
        where: { id: maintenance.assetId },
        data: { condition: conditionAfter },
      })
    );
  }

  const [completedMaintenance] = await prisma.$transaction(updates);
  return completedMaintenance;
};

export const deleteMaintenance = async (id, tenantId) => {
  await prisma.assetMaintenance.delete({
    where: { id },
  });
};

export const getUpcomingMaintenance = async (tenantId, days = 30) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const schedules = await prisma.assetMaintenance.findMany({
    where: {
      tenantId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      scheduledDate: {
        gte: new Date(),
        lte: futureDate,
      },
    },
    include: {
      asset: {
        include: { category: true },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  return schedules;
};

export const getOverdueMaintenance = async (tenantId) => {
  const schedules = await prisma.assetMaintenance.findMany({
    where: {
      tenantId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      scheduledDate: {
        lt: new Date(),
      },
    },
    include: {
      asset: {
        include: { category: true },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  // Update status to OVERDUE
  if (schedules.length > 0) {
    await prisma.assetMaintenance.updateMany({
      where: {
        id: { in: schedules.map((s) => s.id) },
      },
      data: { status: 'OVERDUE' },
    });
  }

  return schedules;
};
