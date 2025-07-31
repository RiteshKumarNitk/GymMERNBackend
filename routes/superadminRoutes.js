const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

router.get(
  '/reports',
  roleGuard([ROLES.SUPERADMIN]),
  superadminController.getCRMReports
);

router.get(
  '/tenants',
  roleGuard([ROLES.SUPERADMIN]),
  superadminController.getTenants
);

router.get(
  '/tenants/:id',
  roleGuard([ROLES.SUPERADMIN]),
  superadminController.getTenantDetails
);

module.exports = router;