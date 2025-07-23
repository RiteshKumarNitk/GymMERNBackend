const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

const auth = require('../middleware/auth');  // Add this line
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

// router.post(
//   '/', 
//   roleGuard([ROLES.SUPERADMIN]), 
//   tenantController.createTenant
// );

// router.post(
//   '/', 
//   auth, // Make sure this middleware is included
//   roleGuard([ROLES.SUPERADMIN]), 
//   tenantController.createTenant
// );

// In your tenantRoutes.js, temporarily add:
router.post('/', 
  (req, res, next) => {
    console.log('Headers:', req.headers);
    console.log('User:', req.user); 
    next();
  },
  auth,
  roleGuard([ROLES.SUPERADMIN]),
  tenantController.createTenant
);

router.get(
  '/', 
  roleGuard([ROLES.SUPERADMIN]), 
  tenantController.getTenants
);

module.exports = router;