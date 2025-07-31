const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Create a new subscription
// POST /api/subscriptions
// Access: Superadmin, Owner
router.post(
  '/',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER']),
  subscriptionController.createSubscription
);

// Get subscription details for a tenant
// GET /api/subscriptions/:tenantId
// Access: Superadmin, Owner, Admin of the tenant
router.get(
  '/:tenantId',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER', 'ADMIN']),
  subscriptionController.getSubscription
);

// Cancel a subscription
// PUT /api/subscriptions/:tenantId/cancel
// Access: Superadmin, Owner of the tenant
router.put(
  '/:tenantId/cancel',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER']),
  subscriptionController.cancelSubscription
);

// Get all invoices for a tenant
// GET /api/subscriptions/:tenantId/invoices
// Access: Superadmin, Owner, Admin of the tenant
router.get(
  '/:tenantId/invoices',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER', 'ADMIN']),
  subscriptionController.getTenantInvoices
);

// Get a specific invoice
// GET /api/subscriptions/invoices/:invoiceId
// Access: Superadmin, Owner, Admin of the tenant
router.get(
  '/invoices/:invoiceId',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER', 'ADMIN']),
  subscriptionController.getInvoice
);

// Generate PDF invoice
// GET /api/subscriptions/invoices/:invoiceId/pdf
// Access: Superadmin, Owner, Admin of the tenant
router.get(
  '/invoices/:invoiceId/pdf',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER', 'ADMIN']),
  subscriptionController.generateInvoicePDF
);

// Send invoice by email
// POST /api/subscriptions/invoices/:invoiceId/send
// Access: Superadmin, Owner of the tenant
router.post(
  '/invoices/:invoiceId/send',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER']),
  subscriptionController.sendInvoiceEmail
);

// Mark invoice as paid
// PUT /api/subscriptions/invoices/:invoiceId/pay
// Access: Superadmin, Owner of the tenant
router.put(
  '/invoices/:invoiceId/pay',
  auth,
  roleGuard(['SUPERADMIN', 'OWNER']),
  subscriptionController.markInvoiceAsPaid
);

module.exports = router;