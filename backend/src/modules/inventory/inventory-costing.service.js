/**
 * Inventory Costing Service
 * Supports FIFO, LIFO, and WEIGHTED_AVG costing.
 */

import prisma from '../../config/db.js';

const DEFAULT_METHOD = 'WEIGHTED_AVG';
const SUPPORTED_METHODS = new Set(['FIFO', 'LIFO', 'WEIGHTED_AVG']);

const resolveDb = (tx) => tx || prisma;

const normalizeMethod = (method) => {
  if (!method) {
    return DEFAULT_METHOD;
  }

  const normalized = String(method).toUpperCase();
  return SUPPORTED_METHODS.has(normalized) ? normalized : DEFAULT_METHOD;
};

const buildLayers = (movements) => {
  const layers = [];

  const consume = (qty) => {
    let remaining = qty;
    while (remaining > 0 && layers.length > 0) {
      const layer = layers[0];
      const take = Math.min(layer.qty, remaining);
      layer.qty -= take;
      remaining -= take;
      if (layer.qty <= 0) {
        layers.shift();
      }
    }
  };

  movements.forEach((movement) => {
    const qty = Number(movement.quantity || 0);
    if (!qty) {
      return;
    }

    const isIn = movement.type === 'IN' || (movement.type === 'ADJUSTMENT' && qty > 0);
    const isOut = movement.type === 'OUT' || (movement.type === 'ADJUSTMENT' && qty < 0);

    if (isIn) {
      const unitCost = Number(movement.unitCost || 0);
      if (unitCost > 0) {
        layers.push({ qty, unitCost });
      }
      return;
    }

    if (isOut) {
      consume(Math.abs(qty));
    }
  });

  return layers;
};

const costFromLayers = (layers, quantity, method) => {
  if (!layers.length || quantity <= 0) {
    return { totalCost: 0, unitCost: 0, remainingQty: quantity };
  }

  let remainingQty = quantity;
  let totalCost = 0;

  const takeFrom = (index) => {
    const layer = layers[index];
    const take = Math.min(layer.qty, remainingQty);
    totalCost += take * layer.unitCost;
    remainingQty -= take;
    layer.qty -= take;
    return layer.qty <= 0;
  };

  if (method === 'LIFO') {
    while (remainingQty > 0 && layers.length > 0) {
      const lastIndex = layers.length - 1;
      const exhausted = takeFrom(lastIndex);
      if (exhausted) {
        layers.pop();
      }
    }
  } else {
    while (remainingQty > 0 && layers.length > 0) {
      const exhausted = takeFrom(0);
      if (exhausted) {
        layers.shift();
      }
    }
  }

  const unitCost = quantity > 0 ? totalCost / (quantity - remainingQty || 1) : 0;

  return { totalCost, unitCost, remainingQty };
};

const resolveMethodFromConfig = async (tenantId, tx) => {
  const db = resolveDb(tx);
  const config = await db.companyConfig.findUnique({
    where: { tenantId },
    select: { businessRules: true },
  });

  const method = config?.businessRules?.inventoryCostingMethod;
  return normalizeMethod(method);
};

export const calculateWeightedAvgCost = async ({ tx, tenantId, itemId, warehouseId }) => {
  const db = resolveDb(tx);
  const stock = await db.warehouseStock.findUnique({
    where: {
      warehouseId_itemId: {
        warehouseId,
        itemId,
      },
    },
    select: { avgCost: true, lastPurchasePrice: true },
  });

  const cost = Number(stock?.avgCost || stock?.lastPurchasePrice || 0);
  return { unitCost: cost, totalCost: 0 };
};

export const calculateOutCost = async ({ tx, tenantId, itemId, warehouseId, quantity }) => {
  const db = resolveDb(tx);
  const method = await resolveMethodFromConfig(tenantId, tx);

  if (method === 'WEIGHTED_AVG') {
    const avg = await calculateWeightedAvgCost({ tx, tenantId, itemId, warehouseId });
    return {
      unitCost: avg.unitCost,
      totalCost: avg.unitCost * quantity,
    };
  }

  const movements = await db.stockMovement.findMany({
    where: {
      tenantId,
      itemId,
      warehouseId,
      status: 'COMPLETED',
      type: { in: ['IN', 'OUT', 'ADJUSTMENT'] },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      type: true,
      quantity: true,
      unitCost: true,
      createdAt: true,
    },
  });

  const layers = buildLayers(movements);
  const cost = costFromLayers(layers, quantity, method);

  if (cost.remainingQty > 0) {
    const avg = await calculateWeightedAvgCost({ tx, tenantId, itemId, warehouseId });
    const fallbackCost = avg.unitCost * cost.remainingQty;
    return {
      unitCost: (cost.totalCost + fallbackCost) / quantity,
      totalCost: cost.totalCost + fallbackCost,
    };
  }

  return {
    unitCost: cost.unitCost,
    totalCost: cost.totalCost,
  };
};

export const resolveCostingMethod = async (tenantId, tx) => {
  return resolveMethodFromConfig(tenantId, tx);
};
