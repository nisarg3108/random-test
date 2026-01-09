import prisma from '../../config/db.js';
import { realTimeServer } from '../../core/realtime.js';

export const createItem = async (data, tenantId) => {
  const { name, sku, price, quantity, description } = data;

  if (!name || !sku || price === undefined) {
    throw new Error('Missing required fields');
  }

  try {
    const item = await prisma.item.create({
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
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      throw new Error(`Item with SKU '${sku}' already exists`);
    }
    throw error;
  }
};

export const listItems = async (tenantId) => {
  return prisma.item.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateItem = async (id, data, tenantId) => {
  try {
    const item = await prisma.item.update({
      where: { id, tenantId },
      data,
    });

    // Broadcast real-time update
    realTimeServer.broadcastInventoryUpdate(tenantId, {
      type: 'ITEM_UPDATED',
      item
    });

    return item;
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      throw new Error(`Item with SKU '${data.sku}' already exists`);
    }
    throw error;
  }
};

export const deleteItem = async (id, tenantId) => {
  const item = await prisma.item.delete({
    where: { id, tenantId },
  });

  // Broadcast real-time update
  realTimeServer.broadcastInventoryUpdate(tenantId, {
    type: 'ITEM_DELETED',
    item: { id }
  });

  return item;
};
