const ROLES = require('../config/roles');

const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorizedsssss' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden - Insufficient permissions' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = roleGuard;