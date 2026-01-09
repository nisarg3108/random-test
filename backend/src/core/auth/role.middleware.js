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
