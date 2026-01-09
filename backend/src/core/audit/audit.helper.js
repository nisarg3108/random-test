import { logAudit } from './audit.service.js';

/**
 * Helper function to create standardized audit logs
 */
export const createAuditLog = async (req, action, entity, entityId, additionalMeta = {}) => {
  try {
    console.log('[AUDIT HELPER] Creating audit log:', { action, entity, entityId });
    console.log('[AUDIT HELPER] User info:', req.user);
    
    const baseLog = {
      userId: req.user?.userId,
      tenantId: req.user?.tenantId,
      action,
      entity,
      entityId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      meta: {
        ...additionalMeta,
        timestamp: new Date().toISOString(),
        requestId: req.id || null
      }
    };

    console.log('[AUDIT HELPER] Base log data:', baseLog);
    const result = await logAudit(baseLog);
    console.log('[AUDIT HELPER] Audit log created:', result);
    return result;
  } catch (error) {
    console.error('[AUDIT HELPER ERROR]', error);
    return null;
  }
};

/**
 * Helper function for CREATE operations
 */
export const logCreate = async (req, entity, entityData, additionalMeta = {}) => {
  console.log('[AUDIT HELPER] logCreate called:', { entity, entityData, additionalMeta });
  return createAuditLog(req, 'CREATE', entity, entityData.id, {
    ...additionalMeta,
    changes: {
      created: entityData
    },
    details: {
      description: `Created ${entity.toLowerCase()} "${entityData.name || entityData.title || entityData.email || entityData.id}"`
    }
  });
};

/**
 * Helper function for UPDATE operations
 */
export const logUpdate = async (req, entity, entityId, oldData, newData, additionalMeta = {}) => {
  const changes = {};
  
  // Compare old and new data to track changes
  Object.keys(newData).forEach(key => {
    if (oldData[key] !== newData[key]) {
      changes[key] = {
        from: oldData[key],
        to: newData[key]
      };
    }
  });

  return createAuditLog(req, 'UPDATE', entity, entityId, {
    ...additionalMeta,
    changes: {
      updated: changes
    },
    details: {
      description: `Updated ${entity.toLowerCase()} "${newData.name || newData.title || newData.email || entityId}"`
    }
  });
};

/**
 * Helper function for DELETE operations
 */
export const logDelete = async (req, entity, entityData, additionalMeta = {}) => {
  return createAuditLog(req, 'DELETE', entity, entityData.id, {
    ...additionalMeta,
    changes: {
      deleted: entityData
    },
    details: {
      description: `Deleted ${entity.toLowerCase()} "${entityData.name || entityData.title || entityData.email || entityData.id}"`
    }
  });
};

/**
 * Helper function for LOGIN operations
 */
export const logLogin = async (req, userData, additionalMeta = {}) => {
  return createAuditLog(req, 'LOGIN', 'USER', userData.id, {
    ...additionalMeta,
    details: {
      description: `User logged in: ${userData.email}`
    },
    loginInfo: {
      email: userData.email,
      role: userData.role,
      loginTime: new Date().toISOString()
    }
  });
};

/**
 * Helper function for LOGOUT operations
 */
export const logLogout = async (req, userData, additionalMeta = {}) => {
  return createAuditLog(req, 'LOGOUT', 'USER', userData.id, {
    ...additionalMeta,
    details: {
      description: `User logged out: ${userData.email}`
    },
    logoutInfo: {
      email: userData.email,
      logoutTime: new Date().toISOString()
    }
  });
};