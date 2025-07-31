const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const subscriptionService = require('../services/subscriptionService');
const invoiceService = require('../services/invoiceService');

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Test creating a subscription
const testCreateSubscription = async () => {
  try {
    // Find a tenant to use for testing
    const tenant = await Tenant.findOne();
    if (!tenant) {
      console.error('No tenant found for testing');
      return;
    }

    console.log(`Creating subscription for tenant: ${tenant.name} (${tenant.tenantId})`);

    // Create a subscription
    const subscription = await subscriptionService.createSubscription(tenant.tenantId, {
      plan: 'monthly',
      autoRenew: true
    });

    console.log('Subscription created:', subscription);

    // Get tenant invoices
    const invoices = await subscriptionService.getTenantInvoices(tenant.tenantId);
    console.log(`Found ${invoices.length} invoices for tenant`);

    if (invoices.length > 0) {
      // Generate PDF for the first invoice
      const pdfPath = await invoiceService.generateInvoicePDF(invoices[0]._id);
      console.log(`Generated PDF invoice at: ${pdfPath}`);

      // Mark invoice as paid
      const updatedInvoice = await invoiceService.markInvoiceAsPaid(invoices[0]._id, 'TEST-TRANSACTION-123');
      console.log('Invoice marked as paid:', updatedInvoice);
    }

    // Test cancelling subscription
    const cancelledSubscription = await subscriptionService.cancelSubscription(tenant.tenantId);
    console.log('Subscription cancelled:', cancelledSubscription);

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
connectDB()
  .then(() => testCreateSubscription())
  .then(() => {
    console.log('Tests completed, disconnecting from database...');
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error running tests:', error);
    mongoose.disconnect();
  });