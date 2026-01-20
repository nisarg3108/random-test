import prisma from '../../config/db.js';
import { realTimeServer } from '../../core/realtime.js';

// Input validation helper
const validateItemData = (data) => {
  const { name, sku, price } = data;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Item name is required and must be a non-empty string');
  }
  
  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    throw new Error('SKU is required and must be a non-empty string');
  }
  
  if (price === undefined || price === null || isNaN(price) || price < 0) {
    throw new Error('Price is required and must be a non-negative number');
  }
  
  return true;
};

export const createItem = async (data, tenantId) => {
  validateItemData(data);
  
  const { name, sku, price, quantity, description, category } = data;

  try {
    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        price: parseFloat(price),
        quantity: quantity ? parseInt(quantity) : 0,
        description: description?.trim() || null,
        category: category?.trim() || null,
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

export const getItem = async (id, tenantId) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Valid item ID is required');
  }
  
  return prisma.item.findFirst({
    where: { id, tenantId },
  });
};

export const updateItem = async (id, data, tenantId) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Valid item ID is required');
  }
  
  // Validate only provided fields
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new Error('Item name must be a non-empty string');
    }
    data.name = data.name.trim();
  }
  
  if (data.sku !== undefined) {
    if (!data.sku || typeof data.sku !== 'string' || data.sku.trim().length === 0) {
      throw new Error('SKU must be a non-empty string');
    }
    data.sku = data.sku.trim().toUpperCase();
  }
  
  if (data.price !== undefined) {
    if (isNaN(data.price) || data.price < 0) {
      throw new Error('Price must be a non-negative number');
    }
    data.price = parseFloat(data.price);
  }
  
  if (data.quantity !== undefined) {
    if (isNaN(data.quantity) || data.quantity < 0) {
      throw new Error('Quantity must be a non-negative number');
    }
    data.quantity = parseInt(data.quantity);
  }
  
  if (data.description !== undefined) {
    data.description = data.description?.trim() || null;
  }
  
  if (data.category !== undefined) {
    data.category = data.category?.trim() || null;
  }

  try {
    const item = await prisma.item.update({
      where: { id, tenantId },
      data,
    });

    // Check for low stock and create notifications for admins/managers
    if (data.quantity !== undefined && data.quantity <= 5) {
      await createLowStockNotifications(tenantId, item);
    }

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
    if (error.code === 'P2025') {
      throw new Error('Item not found');
    }
    throw error;
  }
};

// Helper function to create low stock notifications
const createLowStockNotifications = async (tenantId, item) => {
  try {
    // Get all admin and manager users in the tenant
    const adminUsers = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['ADMIN', 'MANAGER'] }
      },
      include: {
        employee: true
      }
    });

    // Create notifications for each admin/manager
    const notifications = adminUsers
      .filter(user => user.employee) // Only users with employee records
      .map(user => ({
        tenantId,
        employeeId: user.employee.id,
        type: 'INVENTORY_ALERT',
        title: 'Low Stock Alert',
        message: `${item.name} (${item.sku}) is running low with only ${item.quantity} units remaining`
      }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }
  } catch (error) {
    console.error('Failed to create low stock notifications:', error);
  }
};

export const deleteItem = async (id, tenantId) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Valid item ID is required');
  }
  
  try {
    const item = await prisma.item.delete({
      where: { id, tenantId },
    });

    // Broadcast real-time update
    realTimeServer.broadcastInventoryUpdate(tenantId, {
      type: 'ITEM_DELETED',
      item: { id }
    });

    return item;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('Item not found');
    }
    throw error;
  }
};
