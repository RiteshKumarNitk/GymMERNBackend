const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');

/**
 * Generate a PDF invoice for a tenant
 * @param {string} invoiceId - The ID of the invoice to generate PDF for
 * @returns {Promise<string>} - Path to the generated PDF file
 */
exports.generateInvoicePDF = async (invoiceId) => {
  try {
    // Find invoice by ID
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    // Find tenant details
    const tenant = await Tenant.findOne({ tenantId: invoice.tenantId });
    if (!tenant) {
      throw new Error(`Tenant with ID ${invoice.tenantId} not found`);
    }

    // Create directory for invoices if it doesn't exist
    const invoicesDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // Create PDF file path
    const pdfPath = path.join(invoicesDir, `invoice_${invoice.invoiceNumber}.pdf`);

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(pdfPath));

    // Add company logo (placeholder - in a real app, you'd have your logo)
    // doc.image('path/to/logo.png', 50, 45, { width: 50 });

    // Add company information
    doc.fontSize(20).text('GymOwl', 50, 50);
    doc.fontSize(10).text('Your Fitness Business Solution', 50, 75);
    doc.text('123 Fitness Street, Workout City', 50, 90);
    doc.text('support@gymowl.com | www.gymowl.com', 50, 105);

    // Add line
    doc.moveTo(50, 125).lineTo(550, 125).stroke();

    // Add invoice title
    doc.fontSize(16).text('INVOICE', 50, 140);

    // Add invoice details
    doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 170);
    doc.text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, 50, 185);
    doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 50, 200);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 50, 215);

    // Add tenant information
    doc.fontSize(12).text('Bill To:', 300, 170);
    doc.fontSize(10).text(tenant.name, 300, 185);
    doc.text(tenant.contactEmail, 300, 200);
    doc.text(tenant.billingAddress || 'No billing address provided', 300, 215, {
      width: 250,
      align: 'left'
    });

    // Add subscription period
    if (invoice.subscriptionPeriod && invoice.subscriptionPeriod.startDate && invoice.subscriptionPeriod.endDate) {
      doc.fontSize(10).text('Subscription Period:', 50, 245);
      doc.text(
        `${invoice.subscriptionPeriod.startDate.toLocaleDateString()} to ${invoice.subscriptionPeriod.endDate.toLocaleDateString()}`,
        150, 245
      );
    }

    // Add table headers
    doc.fontSize(10).text('Description', 50, 280);
    doc.text('Quantity', 300, 280);
    doc.text('Unit Price', 350, 280);
    doc.text('Amount', 450, 280);

    // Add line
    doc.moveTo(50, 295).lineTo(550, 295).stroke();

    // Add items
    let y = 310;
    if (invoice.items && invoice.items.length > 0) {
      invoice.items.forEach(item => {
        doc.text(item.description || 'Subscription Service', 50, y, { width: 200 });
        doc.text(item.quantity || 1, 300, y);
        doc.text(`₹${(item.unitPrice || 0).toFixed(2)}`, 350, y);
        doc.text(`₹${(item.amount || 0).toFixed(2)}`, 450, y);
        y += 20;
      });
    } else {
      // Default item if none provided
      doc.text('Subscription Service', 50, y);
      doc.text('1', 300, y);
      doc.text(`₹${invoice.amount.toFixed(2)}`, 350, y);
      doc.text(`₹${invoice.amount.toFixed(2)}`, 450, y);
    }

    // Add line
    doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();

    // Add totals
    y += 30;
    doc.text('Subtotal:', 350, y);
    doc.text(`₹${invoice.amount.toFixed(2)}`, 450, y);
    y += 15;
    doc.text('Tax (18% GST):', 350, y);
    doc.text(`₹${invoice.tax.toFixed(2)}`, 450, y);
    y += 15;
    doc.fontSize(12).text('Total:', 350, y);
    doc.fontSize(12).text(`₹${invoice.totalAmount.toFixed(2)}`, 450, y);

    // Add payment information
    y += 40;
    doc.fontSize(10).text('Payment Information', 50, y);
    y += 15;
    doc.text('Please make payment within the due date to avoid service interruption.', 50, y);
    y += 15;
    doc.text('For any billing inquiries, please contact billing@gymowl.com', 50, y);

    // Add footer
    doc.fontSize(10).text('Thank you for choosing GymOwl!', 50, 700, { align: 'center' });

    // Finalize the PDF
    doc.end();

    logger.info(`Generated PDF invoice for ${invoice.invoiceNumber}`, { invoiceId, tenantId: invoice.tenantId });

    return pdfPath;
  } catch (error) {
    logger.error(`Error generating PDF invoice: ${error.message}`, { error: error.stack });
    throw error;
  }
};

/**
 * Send invoice email to tenant
 * @param {string} invoiceId - The ID of the invoice to send
 * @returns {Promise<boolean>} - Whether the email was sent successfully
 */
exports.sendInvoiceEmail = async (invoiceId) => {
  try {
    // In a real application, this would send an actual email with the PDF attached
    // For now, we'll just log it
    
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    const tenant = await Tenant.findOne({ tenantId: invoice.tenantId });
    if (!tenant) {
      throw new Error(`Tenant with ID ${invoice.tenantId} not found`);
    }

    // Generate the PDF
    const pdfPath = await this.generateInvoicePDF(invoiceId);

    // Log the email sending (in a real app, you would use a service like SendGrid, Mailgun, etc.)
    logger.info(`Sending invoice email to ${tenant.contactEmail}`, {
      invoiceId,
      tenantId: invoice.tenantId,
      invoiceNumber: invoice.invoiceNumber,
      pdfPath
    });

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      invoice.status = 'sent';
      await invoice.save();
    }

    return true;
  } catch (error) {
    logger.error(`Error sending invoice email: ${error.message}`, { error: error.stack });
    throw error;
  }
};

/**
 * Mark an invoice as paid
 * @param {string} invoiceId - The ID of the invoice to mark as paid
 * @param {string} transactionId - Optional transaction ID from payment gateway
 * @returns {Promise<object>} - The updated invoice
 */
exports.markInvoiceAsPaid = async (invoiceId, transactionId = null) => {
  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    if (transactionId) {
      invoice.transactionId = transactionId;
    }

    await invoice.save();

    logger.info(`Marked invoice ${invoice.invoiceNumber} as paid`, {
      invoiceId,
      tenantId: invoice.tenantId,
      transactionId
    });

    return invoice;
  } catch (error) {
    logger.error(`Error marking invoice as paid: ${error.message}`, { error: error.stack });
    throw error;
  }
};