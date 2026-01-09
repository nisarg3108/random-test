import prisma from '../../config/db.js';
import { realTimeServer } from '../../core/realtime.js';

export const createItem = async (data, tenantId) => {
  const { name, sku, price, quantity, description } = data;

  if (!name || !sku || price === undefined) {
    throw new Error('Missing required fields');
  }

  const item = await prisma.inventoryItem.create({
    data: {
      name,
      sku,
      price,
      quantity: quantity || 0,
      description,
      tenantId,
    },
  });

  // Broadcast real-time update
  realTimeServer.broadcastInventoryUpdate(tenantId, {
    type: 'ITEM_CREATED',
    item
  });

  return item;
};

export const listItems = async (tenantId) => {
  return prisma.inventoryItem.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateItem = async (id, data, tenantId) => {
  const item = await prisma.inventoryItem.update({
    where: { id, tenantId },
    data,
  });

  // Broadcast real-time update
  realTimeServer.broadcastInventoryUpdate(tenantId, {
    type: 'ITEM_UPDATED',
    item
  });

  return item;
};

export const deleteItem = async (id, tenantId) => {
  const item = await prisma.inventoryItem.delete({
    where: { id, tenantId },
  });

  // Broadcast real-time update
  realTimeServer.broadcastInventoryUpdate(tenantId, {
    type: 'ITEM_DELETED',
    item: { id }
  });

  return item;
};
