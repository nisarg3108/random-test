import prisma from '../config/db.js';
import { env } from '../config/env.js';

/**
 * Middleware to check if tenant has a subscription that includes the requested module
 * @param {string} moduleKey - The module key to check (e.g., 'INVENTORY', 'SALES', 'PURCHASE')
 * @returns {Function} Express middleware function
 */
export const requireModuleEntitlement = (moduleKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ 
          message: 'Unauthorized: Missing user context',
          error: 'MISSING_USER_CONTEXT'
        });
      }

      if (env.nodeEnv !== 'production' && req.user.role === 'ADMIN') {
        return next();
      }

      // Get the tenant's active subscription with all subscription items
      const subscription = await prisma.subscription.findFirst({
        where: {
          tenantId: req.user.tenantId,
          status: 'ACTIVE'
        },
        include: {
          items: true,
          plan: {
            include: {
              modules: true
            }
          }
        }
      });

      // Check if tenant has an active subscription
      if (!subscription) {
        return res.status(403).json({ 
          message: 'Forbidden: No active subscription found',
          error: 'NO_ACTIVE_SUBSCRIPTION',
          module: moduleKey
        });
      }

      // Check if the subscription includes the requested module
      const hasModuleAccess = subscription.items.some(
        item => item.moduleKey === moduleKey
      );

      if (!hasModuleAccess) {
        return res.status(403).json({ 
          message: `Forbidden: Module "${moduleKey}" is not included in your subscription plan`,
          error: 'MODULE_NOT_INCLUDED',
          module: moduleKey,
          plan: subscription.plan?.name,
          availableModules: subscription.items.map(item => item.moduleKey)
        });
      }

      // Attach subscription context to request for later use
      req.subscription = {
        id: subscription.id,
        planId: subscription.plan?.id,
        planName: subscription.plan?.name,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        modules: subscription.items.map(item => item.moduleKey)
      };

      next();
    } catch (error) {
      console.error(`[Entitlement Middleware] Error checking module access for ${moduleKey}:`, error);
      return res.status(500).json({ 
        message: 'Internal server error while checking module entitlement',
        error: 'ENTITLEMENT_CHECK_FAILED'
      });
    }
  };
};

/**
 * Middleware to check multiple module entitlements
 * Tenant must have access to ALL specified modules
 * @param {string[]} moduleKeys - Array of module keys to check
 * @returns {Function} Express middleware function
 */
export const requireModuleEntitlements = (moduleKeys = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ 
          message: 'Unauthorized: Missing user context',
          error: 'MISSING_USER_CONTEXT'
        });
      }

      if (moduleKeys.length === 0) {
        return next();
      }

      if (env.nodeEnv !== 'production' && req.user.role === 'ADMIN') {
        return next();
      }

      // Get the tenant's active subscription with all subscription items
      const subscription = await prisma.subscription.findFirst({
        where: {
          tenantId: req.user.tenantId,
          status: 'ACTIVE'
        },
        include: {
          items: true,
          plan: {
            include: {
              modules: true
            }
          }
        }
      });

      // Check if tenant has an active subscription
      if (!subscription) {
        return res.status(403).json({ 
          message: 'Forbidden: No active subscription found',
          error: 'NO_ACTIVE_SUBSCRIPTION',
          requiredModules: moduleKeys
        });
      }

      // Get available modules
      const availableModules = subscription.items.map(item => item.moduleKey);

      // Check if all required modules are available
      const missingModules = moduleKeys.filter(
        moduleKey => !availableModules.includes(moduleKey)
      );

      if (missingModules.length > 0) {
        return res.status(403).json({ 
          message: `Forbidden: Required modules not included in subscription`,
          error: 'MODULES_NOT_INCLUDED',
          requiredModules: moduleKeys,
          missingModules,
          plan: subscription.plan?.name,
          availableModules
        });
      }

      // Attach subscription context to request for later use
      req.subscription = {
        id: subscription.id,
        planId: subscription.plan?.id,
        planName: subscription.plan?.name,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        modules: availableModules
      };

      next();
    } catch (error) {
      console.error(`[Entitlement Middleware] Error checking module access:`, error);
      return res.status(500).json({ 
        message: 'Internal server error while checking module entitlement',
        error: 'ENTITLEMENT_CHECK_FAILED'
      });
    }
  };
};
