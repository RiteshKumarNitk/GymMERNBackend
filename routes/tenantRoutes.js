const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

router.post(
  '/', 
  roleGuard([ROLES.SUPERADMIN]), 
  tenantController.createTenant
);

router.get(
  '/', 
  roleGuard([ROLES.SUPERADMIN]), 
  tenantController.getTenants
);

module.exports = router;