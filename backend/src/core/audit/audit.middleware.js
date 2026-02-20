/**
 * Audit Middleware
 * Logs write operations for authenticated users.
 */

import { logAudit } from './audit.service.js';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const EXCLUDED_PATH_PREFIXES = new Set([
  '/api/audit-logs',
  '/api/health',
  '/api/db-test',
]);

const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const redactedKeys = new Set([
    'password',
    'passwordHash',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'refreshToken',
    'secret',
    'apiKey',
  ]);

  const sanitized = Array.isArray(body) ? [] : {};
  Object.entries(body).forEach(([key, value]) => {
    if (redactedKeys.has(key)) {
      sanitized[key] = '[REDACTED]';
      return;
    }

    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeBody(value);
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
};

const resolveEntity = (req) => {
  const baseUrl = req.baseUrl || '';
  const trimmed = baseUrl.replace(/^\/api\/?/, '').trim();
  if (!trimmed) {
    return 'SYSTEM';
  }

  const entity = trimmed.split('/')[0];
  return entity.replace(/-/g, '_').toUpperCase();
};

const resolveEntityId = (req) => {
  if (!req.params || typeof req.params !== 'object') {
    return null;
  }

  if (req.params.id) {
    return req.params.id;
  }

  const paramKey = Object.keys(req.params).find((key) =>
    key.toLowerCase().endsWith('id')
  );

  return paramKey ? req.params[paramKey] : null;
};

const resolveAction = (method) => {
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'UNKNOWN';
  }
};

export const auditMiddleware = (req, res, next) => {
  if (!WRITE_METHODS.has(req.method)) {
    return next();
  }

  if ([...EXCLUDED_PATH_PREFIXES].some((prefix) => req.baseUrl?.startsWith(prefix))) {
    return next();
  }

  res.on('finish', async () => {
    if (res.statusCode < 200 || res.statusCode >= 400) {
      return;
    }

    if (!req.user?.userId || !req.user?.tenantId) {
      return;
    }

    const action = resolveAction(req.method);
    const entity = resolveEntity(req);
    const entityId = resolveEntityId(req) || req.body?.id || 'N/A';

    await logAudit({
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      action,
      entity,
      entityId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      meta: {
        path: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        requestBody: sanitizeBody(req.body),
      },
    });
  });

  next();
};

export default auditMiddleware;
