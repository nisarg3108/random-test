/**
 * Rate limiting middleware
 * Simple in-memory sliding window limiter.
 */

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 120;
const DEFAULT_MAX_REQUESTS_AUTH = 240;

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || DEFAULT_MAX_REQUESTS;
const MAX_REQUESTS_AUTH =
  Number(process.env.RATE_LIMIT_MAX_AUTH) || DEFAULT_MAX_REQUESTS_AUTH;

const EXCLUDED_PATHS = new Set([
  '/api/health',
  '/api/db-test',
]);

const buckets = new Map();

const getKey = (req) => {
  const userId = req.user?.userId || req.user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${req.ip}`;
};

const prune = (timestamps, now) => timestamps.filter((t) => now - t < WINDOW_MS);

export const rateLimitMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  if (!req.originalUrl?.startsWith('/api')) {
    return next();
  }

  if (EXCLUDED_PATHS.has(req.baseUrl || req.path || req.originalUrl)) {
    return next();
  }

  const limit = req.user ? MAX_REQUESTS_AUTH : MAX_REQUESTS;
  const key = getKey(req);
  const now = Date.now();

  const entry = buckets.get(key) || [];
  const pruned = prune(entry, now);

  if (pruned.length >= limit) {
    res.setHeader('Retry-After', Math.ceil(WINDOW_MS / 1000));
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', String(now + WINDOW_MS));
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  }

  pruned.push(now);
  buckets.set(key, pruned);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(limit - pruned.length));
  res.setHeader('X-RateLimit-Reset', String(now + WINDOW_MS));

  return next();
};

export default rateLimitMiddleware;
