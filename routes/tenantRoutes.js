const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ROLES = require('../config/roles');

// Create a new tenant
// POST /api/tenants
// Access: Super Admin
router.post(
  '/',
  auth,
  roleGuard([ROLES.SUPERADMIN]),
  tenantController.createTenant
);

// Get all tenants
// GET /api/tenants
// Access: Super Admin
router.get(
  '/',
  auth,
  roleGuard([ROLES.SUPERADMIN]),
  tenantController.getTenants
);

// Get tenant details
// GET /api/tenants/:id
// Access: Super Admin, Owner, Admin of the tenant
router.get(
  '/:id',
  auth,
  roleGuard([ROLES.SUPERADMIN, ROLES.OWNER, ROLES.ADMIN]),
  tenantController.getTenantDetails
);

// Update tenant
// PUT /api/tenants/:id
// Access: Super Admin
router.put(
  '/:id',
  auth,
  roleGuard([ROLES.SUPERADMIN]),
  tenantController.updateTenant
);

// Delete (archive) tenant
// DELETE /api/tenants/:id
// Access: Super Admin
router.delete(
  '/:id',
  auth,
  roleGuard([ROLES.SUPERADMIN]),
  tenantController.deleteTenant
);

// Deactivate tenant
// PUT /api/tenants/:id/deactivate
// Access: Super Admin, Owner
router.put(
  '/:id/deactivate',
  auth,
  roleGuard([ROLES.SUPERADMIN, ROLES.OWNER]),
  tenantController.deactivateTenant
);

// Reactivate tenant
// PUT /api/tenants/:id/reactivate
// Access: Super Admin
router.put(
  '/:id/reactivate',
  auth,
  roleGuard([ROLES.SUPERADMIN]),
  tenantController.reactivateTenant
);

// Update tenant business details
// PUT /api/tenants/:id/business-details
// Access: Super Admin, Owner
router.put(
  '/:id/business-details',
  auth,
  roleGuard([ROLES.SUPERADMIN, ROLES.OWNER]),
  tenantController.updateBusinessDetails
);

module.exports = router;