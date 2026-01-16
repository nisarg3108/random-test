export const requireRole = (roles = []) => {
  return (req, res, next) => {
    console.log('User role:', req.user.role);
    console.log('Required roles:', roles);
    
    if (!req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied: insufficient permissions',
      });
    }
    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    // For now, check if user has MANAGER or ADMIN role for approval permissions
    if (permission === 'inventory.approve') {
      if (req.user.role === 'MANAGER' || req.user.role === 'ADMIN') {
        return next();
      }
    }
    return res.status(403).json({
      message: 'Access denied: insufficient permissions',
    });
  };
};
