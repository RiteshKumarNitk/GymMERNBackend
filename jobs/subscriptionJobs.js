const cron = require('node-cron');
const subscriptionService = require('../services/subscriptionService');
const {logger} = require('../utils/logger');

/**
 * Initialize subscription-related scheduled jobs
 */
const initSubscriptionJobs = () => {
  // Check for expiring subscriptions daily at 8:00 AM
  // Format: second minute hour day-of-month month day-of-week
  cron.schedule('0 8 * * *', async () => {
    try {
      logger.info('Running scheduled job: Check expiring subscriptions');
      const count = await subscriptionService.checkExpiringSubscriptions();
      logger.info(`Sent renewal reminders for ${count} expiring subscriptions`);
    } catch (error) {
      logger.error('Error in expiring subscriptions job', { error: error.message, stack: error.stack });
    }
  });

  // Process auto-renewals daily at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    try {
      logger.info('Running scheduled job: Process auto-renewals');
      const count = await subscriptionService.processAutoRenewals();
      logger.info(`Processed ${count} subscription auto-renewals`);
    } catch (error) {
      logger.error('Error in auto-renewal job', { error: error.message, stack: error.stack });
    }
  });

  // Check for overdue invoices daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('Running scheduled job: Check overdue invoices');
      // This would be implemented in a real system
      // await subscriptionService.checkOverdueInvoices();
      logger.info('Checked for overdue invoices');
    } catch (error) {
      logger.error('Error in overdue invoices job', { error: error.message, stack: error.stack });
    }
  });
  console.log('Subscription scheduled jobs initialized')
  // logger.info('Subscription scheduled jobs initialized');
};

module.exports = { initSubscriptionJobs };