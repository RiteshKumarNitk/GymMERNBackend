const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');

/**
 * Create a new subscription for a tenant
 */
exports.createSubscription = async (tenantId, planData) => {
  try {
    const tenant = await Tenant.findOne({ tenantId });
    
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    
    // Set default prices based on plan type
    let price = 0;
    switch(planData.plan) {
      case 'trial':
        price = 0;
        break;
      case 'monthly':
        price = 999;
        break;
      case 'biannual':
        price = 4999;
        break;
      case 'annual':
        price = 9999;
        break;
      default:
        price = 0;
    }
    
    // Create new subscription
    const subscription = new Subscription({
      tenantId,
      plan: planData.plan,
      status: 'active',
      startDate: new Date(),
      price,
      autoRenew: planData.autoRenew || false,
      features: {
        maxUsers: planData.plan === 'trial' ? 2 : 
                 planData.plan === 'monthly' ? 5 : 
                 planData.plan === 'biannual' ? 10 : 15,
        maxMembers: planData.plan === 'trial' ? 20 : 
                    planData.plan === 'monthly' ? 100 : 
                    planData.plan === 'biannual' ? 250 : 500,
        advancedReports: planData.plan !== 'trial' && planData.plan !== 'monthly',
        multipleLocations: planData.plan === 'annual',
        apiAccess: planData.plan === 'annual'
      }
    });
    
    // Save subscription (pre-save hook will calculate end date)
    await subscription.save();
    
    // Update tenant with subscription details
    tenant.subscriptionType = planData.plan;
    tenant.subscriptionStartDate = subscription.startDate;
    tenant.subscriptionEndDate = subscription.endDate;
    tenant.status = planData.plan === 'trial' ? 'trial' : 'active';
    tenant.autoRenew = planData.autoRenew || false;
    tenant.nextBillingDate = subscription.endDate;
    
    await tenant.save();
    
    // Generate invoice for paid plans
    if (planData.plan !== 'trial') {
      await this.generateInvoice(tenantId, subscription);
    }
    
    logger.info(`Subscription created for tenant ${tenantId}`, { tenantId, plan: planData.plan });
    
    return subscription;
  } catch (error) {
    logger.error(`Error creating subscription for tenant ${tenantId}`, { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Generate an invoice for a subscription
 */
exports.generateInvoice = async (tenantId, subscription) => {
  try {
    const tenant = await Tenant.findOne({ tenantId });
    
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    
    // Calculate tax (18% GST)
    const taxRate = 0.18;
    const taxAmount = subscription.price * taxRate;
    const totalAmount = subscription.price + taxAmount;
    
    // Set due date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    // Create invoice
    const invoice = new Invoice({
      tenantId,
      amount: subscription.price,
      tax: taxAmount,
      totalAmount,
      dueDate,
      status: 'sent',
      subscriptionPeriod: {
        startDate: subscription.startDate,
        endDate: subscription.endDate
      },
      items: [{
        description: `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Subscription Plan`,
        quantity: 1,
        unitPrice: subscription.price,
        amount: subscription.price
      }]
    });
    
    await invoice.save();
    
    // Add invoice to subscription
    subscription.invoices.push(invoice._id);
    await subscription.save();
    
    logger.info(`Invoice generated for tenant ${tenantId}`, { tenantId, invoiceId: invoice._id });
    
    return invoice;
  } catch (error) {
    logger.error(`Error generating invoice for tenant ${tenantId}`, { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Check for subscriptions that are about to expire and send reminders
 */
exports.checkExpiringSubscriptions = async () => {
  try {
    const today = new Date();
    const reminderDays = 7; // Send reminder 7 days before expiry
    
    // Calculate the date for which we need to send reminders
    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + reminderDays);
    
    // Find subscriptions that expire in 7 days and haven't had reminders sent
    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      endDate: {
        $gte: new Date(reminderDate.setHours(0, 0, 0, 0)),
        $lte: new Date(reminderDate.setHours(23, 59, 59, 999))
      },
      renewalReminderSent: false
    }).populate('tenantId');
    
    logger.info(`Found ${expiringSubscriptions.length} subscriptions expiring soon`);
    
    // Process each expiring subscription
    for (const subscription of expiringSubscriptions) {
      // Send reminder (in a real system, this would trigger an email/SMS)
      logger.info(`Sending renewal reminder for tenant ${subscription.tenantId}`, {
        tenantId: subscription.tenantId,
        expiryDate: subscription.endDate
      });
      
      // Mark reminder as sent
      subscription.renewalReminderSent = true;
      subscription.renewalReminderDate = today;
      await subscription.save();
      
      // In a real system, you would send an email/SMS here
      // For now, we'll just log it
      logger.info(`Renewal reminder sent for tenant ${subscription.tenantId}`);
    }
    
    return expiringSubscriptions.length;
  } catch (error) {
    logger.error('Error checking expiring subscriptions', { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Process subscription renewals for tenants with auto-renew enabled
 */
exports.processAutoRenewals = async () => {
  try {
    const today = new Date();
    
    // Find subscriptions that expire today and have auto-renew enabled
    const renewalSubscriptions = await Subscription.find({
      status: 'active',
      autoRenew: true,
      endDate: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999))
      }
    });
    
    logger.info(`Found ${renewalSubscriptions.length} subscriptions for auto-renewal`);
    
    // Process each renewal
    for (const subscription of renewalSubscriptions) {
      // In a real system, this would process payment through a payment gateway
      // For now, we'll just create a new subscription period
      
      // Calculate new dates
      const newStartDate = new Date(subscription.endDate);
      let newEndDate = new Date(newStartDate);
      
      switch(subscription.plan) {
        case 'monthly':
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case 'biannual':
          newEndDate.setMonth(newEndDate.getMonth() + 6);
          break;
        case 'annual':
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
      }
      
      // Update subscription
      subscription.startDate = newStartDate;
      subscription.endDate = newEndDate;
      subscription.renewalReminderSent = false;
      subscription.renewalReminderDate = null;
      
      await subscription.save();
      
      // Update tenant
      const tenant = await Tenant.findOne({ tenantId: subscription.tenantId });
      if (tenant) {
        tenant.subscriptionStartDate = newStartDate;
        tenant.subscriptionEndDate = newEndDate;
        tenant.lastBillingDate = new Date();
        tenant.nextBillingDate = newEndDate;
        
        await tenant.save();
      }
      
      // Generate new invoice
      await this.generateInvoice(subscription.tenantId, subscription);
      
      logger.info(`Auto-renewed subscription for tenant ${subscription.tenantId}`, {
        tenantId: subscription.tenantId,
        plan: subscription.plan,
        newEndDate
      });
    }
    
    return renewalSubscriptions.length;
  } catch (error) {
    logger.error('Error processing auto renewals', { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Cancel a subscription
 */
exports.cancelSubscription = async (tenantId) => {
  try {
    const subscription = await Subscription.findOne({ tenantId, status: 'active' });
    
    if (!subscription) {
      throw new Error(`No active subscription found for tenant ${tenantId}`);
    }
    
    // Update subscription
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    
    await subscription.save();
    
    // Update tenant
    const tenant = await Tenant.findOne({ tenantId });
    if (tenant) {
      tenant.status = 'inactive';
      tenant.autoRenew = false;
      
      await tenant.save();
    }
    
    logger.info(`Subscription cancelled for tenant ${tenantId}`, { tenantId });
    
    return subscription;
  } catch (error) {
    logger.error(`Error cancelling subscription for tenant ${tenantId}`, { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Get subscription details for a tenant
 */
exports.getSubscriptionDetails = async (tenantId) => {
  try {
    const subscription = await Subscription.findOne({ tenantId, status: 'active' })
      .populate('invoices');
    
    if (!subscription) {
      throw new Error(`No active subscription found for tenant ${tenantId}`);
    }
    
    return subscription;
  } catch (error) {
    logger.error(`Error getting subscription details for tenant ${tenantId}`, { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Get all invoices for a tenant
 */
exports.getTenantInvoices = async (tenantId) => {
  try {
    const invoices = await Invoice.find({ tenantId }).sort({ issueDate: -1 });
    return invoices;
  } catch (error) {
    logger.error(`Error getting invoices for tenant ${tenantId}`, { error: error.message, stack: error.stack });
    throw error;
  }
};