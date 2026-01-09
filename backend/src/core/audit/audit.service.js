import prisma from '../../config/db.js';

export const logAudit = async ({
  userId,
  tenantId,
  action,
  entity,
  entityId,
  meta = {},
  userEmail = null,
  ipAddress = null,
  userAgent = null
}) => {
  try {
    console.log('[AUDIT SERVICE] Starting audit log creation:', {
      userId, tenantId, action, entity, entityId
    });

    // Get user information if not provided
    let userInfo = {};
    if (userId && !userEmail) {
      console.log('[AUDIT SERVICE] Fetching user info for userId:', userId);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, role: true }
      });
      if (user) {
        userInfo = { email: user.email, role: user.role };
        console.log('[AUDIT SERVICE] User info found:', userInfo);
      } else {
        console.log('[AUDIT SERVICE] User not found for userId:', userId);
      }
    } else if (userEmail) {
      userInfo = { email: userEmail };
    }

    // Enhanced meta information
    const enhancedMeta = {
      ...meta,
      userInfo,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      details: {
        action: `${action} ${entity}`,
        description: generateActionDescription(action, entity, meta),
        ...meta.details
      }
    };

    console.log('[AUDIT SERVICE] Creating audit log with data:', {
      userId, tenantId, action, entity, entityId, meta: enhancedMeta
    });

    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        tenantId,
        action,
        entity,
        entityId,
        meta: enhancedMeta,
      },
    });

    console.log(`[AUDIT] ${action} ${entity} by user ${userId} (${userInfo.email || 'Unknown'})`, {
      entityId,
      auditLogId: auditLog.id
    });

    return auditLog;
  } catch (error) {
    console.error('[AUDIT ERROR] Failed to log audit:', error);
    console.error('[AUDIT ERROR] Stack trace:', error.stack);
    // Don't throw error to prevent breaking the main operation
    return null;
  }
};

const generateActionDescription = (action, entity, meta) => {
  const entityName = meta.name || meta.title || meta.email || meta.entityId || 'Unknown';
  
  switch (action) {
    case 'CREATE':
      return `Created ${entity.toLowerCase()} "${entityName}"`;
    case 'UPDATE':
      return `Updated ${entity.toLowerCase()} "${entityName}"`;
    case 'DELETE':
      return `Deleted ${entity.toLowerCase()} "${entityName}"`;
    case 'LOGIN':
      return `User logged in`;
    case 'LOGOUT':
      return `User logged out`;
    default:
      return `${action} performed on ${entity.toLowerCase()}`;
  }
};
