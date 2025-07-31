const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');
const subscriptionService = require('../services/subscriptionService');
const invoiceService = require('../services/invoiceService');
const logger = require('../utils/logger');

/**
 * Create a new subscription for a tenant
 * @route POST /api/subscriptions
 * @access Private (Superadmin, Owner)
 */
exports.createSubscription = async (req, res) => {
  try {
    const { tenantId, plan, autoRenew } = req.body;

    // Validate input
    if (!tenantId || !plan) {
      return res.status(400).json({ success: false, message: 'Tenant ID and plan are required' });
    }

    // Check if tenant exists
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // Check if user has permission (must be superadmin or the tenant owner)
    if (req.user.role !== 'SUPERADMIN' && 
        (req.user.tenantId !== tenantId || req.user.role !== 'OWNER')) {
      return res.status(403).json({ success: false, message: 'Not authorized to create subscription for this tenant' });
    }

    // Create subscription
    const subscription = await subscriptionService.createSubscription(tenantId, {
      plan,
      autoRenew: autoRenew || false
    });

    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error creating subscription: ${error.message}`, { error: error.stack });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get subscription details for a tenant
 * @route GET /api/subscriptions/:tenantId
 * @access Private (Superadmin, Owner, Admin of the tenant)
 */
exports.getSubscription = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this subscription' });
    }

    // Get subscription details
    const subscription = await subscriptionService.getSubscriptionDetails(tenantId);

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error getting subscription: ${error.message}`, { error: error.stack });
    
    // Handle not found error specifically
    if (error.message.includes('No active subscription found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Cancel a subscription
 * @route PUT /api/subscriptions/:tenantId/cancel
 * @access Private (Superadmin, Owner of the tenant)
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && 
        (req.user.tenantId !== tenantId || req.user.role !== 'OWNER')) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this subscription' });
    }

    // Cancel subscription
    const subscription = await subscriptionService.cancelSubscription(tenantId);

    res.status(200).json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    logger.error(`Error cancelling subscription: ${error.message}`, { error: error.stack });
    
    // Handle not found error specifically
    if (error.message.includes('No active subscription found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all invoices for a tenant
 * @route GET /api/subscriptions/:tenantId/invoices
 * @access Private (Superadmin, Owner, Admin of the tenant)
 */
exports.getTenantInvoices = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && req.user.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these invoices' });
    }

    // Get invoices
    const invoices = await subscriptionService.getTenantInvoices(tenantId);

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    logger.error(`Error getting tenant invoices: ${error.message}`, { error: error.stack });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get a specific invoice
 * @route GET /api/subscriptions/invoices/:invoiceId
 * @access Private (Superadmin, Owner, Admin of the tenant)
 */
exports.getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && req.user.tenantId !== invoice.tenantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error(`Error getting invoice: ${error.message}`, { error: error.stack });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Generate PDF invoice
 * @route GET /api/subscriptions/invoices/:invoiceId/pdf
 * @access Private (Superadmin, Owner, Admin of the tenant)
 */
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && req.user.tenantId !== invoice.tenantId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this invoice' });
    }

    // Generate PDF
    const pdfPath = await invoiceService.generateInvoicePDF(invoiceId);

    // Send file
    res.download(pdfPath, `invoice_${invoice.invoiceNumber}.pdf`, (err) => {
      if (err) {
        logger.error(`Error sending PDF file: ${err.message}`, { error: err.stack });
        // If there's an error after headers are sent, we can't send another response
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error sending PDF file' });
        }
      }
    });
  } catch (error) {
    logger.error(`Error generating invoice PDF: ${error.message}`, { error: error.stack });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Send invoice by email
 * @route POST /api/subscriptions/invoices/:invoiceId/send
 * @access Private (Superadmin, Owner of the tenant)
 */
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Find invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && 
        (req.user.tenantId !== invoice.tenantId || req.user.role !== 'OWNER')) {
      return res.status(403).json({ success: false, message: 'Not authorized to send this invoice' });
    }

    // Send invoice email
    await invoiceService.sendInvoiceEmail(invoiceId);

    res.status(200).json({
      success: true,
      message: 'Invoice email sent successfully'
    });
  } catch (error) {
    logger.error(`Error sending invoice email: ${error.message}`, { error: error.stack });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Mark invoice as paid
 * @route PUT /api/subscriptions/invoices/:invoiceId/pay
 * @access Private (Superadmin, Owner of the tenant)
 */
exports.markInvoiceAsPaid = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { transactionId } = req.body;

    // Find invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Check if user has permission
    if (req.user.role !== 'SUPERADMIN' && 
        (req.user.tenantId !== invoice.tenantId || req.user.role !== 'OWNER')) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this invoice' });
    }

    // Mark as paid
    const updatedInvoice = await invoiceService.markInvoiceAsPaid(invoiceId, transactionId);

    res.status(200).json({
      success: true,
      data: updatedInvoice,
      message: 'Invoice marked as paid successfully'
    });
  } catch (error) {
    logger.error(`Error marking invoice as paid: ${error.message}`, { error: error.stack });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};