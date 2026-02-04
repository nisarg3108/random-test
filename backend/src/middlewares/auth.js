import { requireAuth } from '../core/auth/auth.middleware.js';

// Export requireAuth as authenticate for compatibility
export const authenticate = requireAuth;