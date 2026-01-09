import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    // ✅ NORMALIZE USER CONTEXT (CRITICAL)
    req.user = {
      userId: decoded.userId || decoded.id,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    };

    if (!req.user.userId || !req.user.tenantId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
