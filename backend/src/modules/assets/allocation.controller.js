import {
  allocateAsset,
  listAllocations,
  getAllocationById,
  returnAsset,
  updateAllocation,
  getMyAllocations,
} from './allocation.service.js';
import { logAudit } from '../../core/audit/audit.service.js';

// ========================================
// ASSET ALLOCATION CONTROLLERS
// ========================================

export const allocateAssetController = async (req, res, next) => {
  try {
    const allocationData = {
      ...req.body,
      allocatedBy: req.user.userId,
    };

    const allocation = await allocateAsset(allocationData, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'ALLOCATE',
      entity: 'ASSET',
      entityId: allocation.assetId,
      meta: {
        employeeId: allocation.employeeId,
        allocationId: allocation.id,
      },
    });

    res.status(201).json(allocation);
  } catch (err) {
    next(err);
  }
};

export const listAllocationsController = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      employeeId: req.query.employeeId,
      assetId: req.query.assetId,
    };

    const allocations = await listAllocations(req.user.tenantId, filters);
    res.json(allocations);
  } catch (err) {
    next(err);
  }
};

export const getAllocationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await getAllocationById(id, req.user.tenantId);

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    res.json(allocation);
  } catch (err) {
    next(err);
  }
};

export const returnAssetController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await returnAsset(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'RETURN',
      entity: 'ASSET',
      entityId: allocation.assetId,
      meta: {
        allocationId: allocation.id,
        returnCondition: allocation.returnCondition,
      },
    });

    res.json(allocation);
  } catch (err) {
    next(err);
  }
};

export const updateAllocationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await updateAllocation(id, req.body, req.user.tenantId);

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action: 'UPDATE',
      entity: 'ASSET_ALLOCATION',
      entityId: id,
    });

    res.json(allocation);
  } catch (err) {
    next(err);
  }
};

export const getMyAllocationsController = async (req, res, next) => {
  try {
    // Get employee record for current user
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const employee = await prisma.employee.findFirst({
      where: {
        userId: req.user.userId,
        tenantId: req.user.tenantId,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const allocations = await getMyAllocations(employee.id, req.user.tenantId);
    res.json(allocations);
  } catch (err) {
    next(err);
  }
};
