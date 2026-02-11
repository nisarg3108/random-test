import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// ASSET MAINTENANCE SERVICES
// ========================================

export const createMaintenanceSchedule = async (data, tenantId) => {
  const { startImmediately, ...scheduleData } = data;

  // Get the asset to check current status
  const asset = await prisma.asset.findFirst({
    where: { id: scheduleData.assetId, tenantId },
  });

  if (!asset) {
    throw new Error('Asset not found');
  }

  // Determine initial status and whether to update asset status
  let initialStatus = 'SCHEDULED';
  let statusBeforeMaintenance = null;
  let shouldUpdateAssetStatus = false;

  if (startImmediately) {
    initialStatus = 'IN_PROGRESS';
    statusBeforeMaintenance = asset.status;
    shouldUpdateAssetStatus = true;
  }

  // Create maintenance schedule and optionally update asset status
  const updates = [
    prisma.assetMaintenance.create({
      data: {
        ...scheduleData,
        tenantId,
        status: initialStatus,
        statusBeforeMaintenance,
        scheduledDate: new Date(scheduleData.scheduledDate),
        completedDate: scheduleData.completedDate ? new Date(scheduleData.completedDate) : null,
        nextMaintenanceDate: scheduleData.nextMaintenanceDate ? new Date(scheduleData.nextMaintenanceDate) : null,
      },
      include: {
        asset: {
          include: { category: true },
        },
      },
    }),
  ];

  if (shouldUpdateAssetStatus) {
    updates.push(
      prisma.asset.update({
        where: { id: asset.id },
        data: { status: 'MAINTENANCE' },
      })
    );
  }

  const [schedule] = await prisma.$transaction(updates);
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

  // Get current maintenance record
  const currentMaintenance = await prisma.assetMaintenance.findFirst({
    where: { id, tenantId },
    include: { asset: true },
  });

  if (!currentMaintenance) {
    throw new Error('Maintenance schedule not found');
  }

  const updates = [];

  // If status is changing to IN_PROGRESS and asset is not already in MAINTENANCE
  if (data.status === 'IN_PROGRESS' && currentMaintenance.status !== 'IN_PROGRESS') {
    if (currentMaintenance.asset.status !== 'MAINTENANCE') {
      updateData.statusBeforeMaintenance = currentMaintenance.asset.status;
      updates.push(
        prisma.asset.update({
          where: { id: currentMaintenance.assetId },
          data: { status: 'MAINTENANCE' },
        })
      );
    }
  }

  // If status is changing to CANCELLED and asset is in MAINTENANCE
  if (data.status === 'CANCELLED' && currentMaintenance.asset.status === 'MAINTENANCE') {
    const restoreStatus = currentMaintenance.statusBeforeMaintenance || 'AVAILABLE';
    updates.push(
      prisma.asset.update({
        where: { id: currentMaintenance.assetId },
        data: { status: restoreStatus },
      })
    );
  }

  updates.unshift(
    prisma.assetMaintenance.update({
      where: { id },
      data: updateData,
      include: {
        asset: {
          include: { category: true },
        },
      },
    })
  );

  const [schedule] = await prisma.$transaction(updates);
  return schedule;
};

export const completeMaintenance = async (id, data, tenantId) => {
  const { performedBy, cost, conditionAfter, nextMaintenanceDate, notes } = data;

  // Get the maintenance record with asset
  const maintenance = await prisma.assetMaintenance.findFirst({
    where: { id, tenantId },
    include: { asset: true },
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

  // Build asset update data
  const assetUpdateData = {};

  // Update asset condition if provided
  if (conditionAfter) {
    assetUpdateData.condition = conditionAfter;
  }

  // Restore asset status after maintenance completion
  if (maintenance.asset.status === 'MAINTENANCE') {
    // Check if there are other active maintenance schedules for this asset
    const otherActiveMaintenance = await prisma.assetMaintenance.count({
      where: {
        assetId: maintenance.assetId,
        tenantId,
        id: { not: id },
        status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
      },
    });

    // Only restore status if no other active maintenance
    if (otherActiveMaintenance === 0) {
      // Restore to previous status or AVAILABLE if unknown
      assetUpdateData.status = maintenance.statusBeforeMaintenance || 'AVAILABLE';
    }
  }

  // Apply asset updates if any
  if (Object.keys(assetUpdateData).length > 0) {
    updates.push(
      prisma.asset.update({
        where: { id: maintenance.assetId },
        data: assetUpdateData,
      })
    );
  }

  const [completedMaintenance] = await prisma.$transaction(updates);
  return completedMaintenance;
};

export const deleteMaintenance = async (id, tenantId) => {
  // Get the maintenance record first
  const maintenance = await prisma.assetMaintenance.findFirst({
    where: { id, tenantId },
    include: { asset: true },
  });

  if (!maintenance) {
    throw new Error('Maintenance schedule not found');
  }

  const updates = [
    prisma.assetMaintenance.delete({
      where: { id },
    }),
  ];

  // If maintenance was in progress and asset is in MAINTENANCE status, restore it
  if (maintenance.status === 'IN_PROGRESS' && maintenance.asset.status === 'MAINTENANCE') {
    // Check if there are other active maintenance schedules
    const otherActiveMaintenance = await prisma.assetMaintenance.count({
      where: {
        assetId: maintenance.assetId,
        tenantId,
        id: { not: id },
        status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
      },
    });

    // Only restore if no other active maintenance
    if (otherActiveMaintenance === 0) {
      const restoreStatus = maintenance.statusBeforeMaintenance || 'AVAILABLE';
      updates.push(
        prisma.asset.update({
          where: { id: maintenance.assetId },
          data: { status: restoreStatus },
        })
      );
    }
  }

  await prisma.$transaction(updates);
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

// ========================================
// START MAINTENANCE
// ========================================

export const startMaintenance = async (id, tenantId) => {
  // Get the maintenance record
  const maintenance = await prisma.assetMaintenance.findFirst({
    where: { id, tenantId },
    include: { asset: true },
  });

  if (!maintenance) {
    throw new Error('Maintenance schedule not found');
  }

  if (maintenance.status === 'COMPLETED') {
    throw new Error('Cannot start a completed maintenance');
  }

  if (maintenance.status === 'IN_PROGRESS') {
    throw new Error('Maintenance is already in progress');
  }

  const updates = [];

  // Store current asset status before changing to MAINTENANCE
  const statusBeforeMaintenance = maintenance.asset.status;

  updates.push(
    prisma.assetMaintenance.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        statusBeforeMaintenance,
        conditionBefore: maintenance.asset.condition,
      },
      include: {
        asset: {
          include: { category: true },
        },
      },
    })
  );

  // Update asset status to MAINTENANCE if not already
  if (maintenance.asset.status !== 'MAINTENANCE') {
    updates.push(
      prisma.asset.update({
        where: { id: maintenance.assetId },
        data: { status: 'MAINTENANCE' },
      })
    );
  }

  const [startedMaintenance] = await prisma.$transaction(updates);
  return startedMaintenance;
};
