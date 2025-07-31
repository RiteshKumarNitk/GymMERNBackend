# GymOwl SaaS Platform - Subscription Management

This document provides information about the subscription management features added to the GymOwl SaaS platform.

## Features Added

1. **Enhanced Tenant Management**
   - Tenant deactivation instead of deletion (for data retention & compliance)
   - Additional tenant information collection (location, city, business details)
   - Tenant status tracking (active, inactive, trial, suspended)

2. **Subscription Management**
   - Different subscription plans (trial, monthly, biannual, annual)
   - Subscription tracking with start and end dates
   - Auto-renewal options

3. **Invoice Generation**
   - PDF invoice generation with tenant and subscription details
   - Invoice status tracking (draft, sent, paid, overdue)
   - Email notification for invoices

4. **Renewal & Notifications**
   - Automated reminders for subscription expiry
   - Scheduled jobs for checking expiring subscriptions and processing renewals

## API Endpoints

### Tenant Management

```
# Create a new tenant
POST /api/tenants

# Get all tenants
GET /api/tenants

# Get tenant details
GET /api/tenants/:id

# Update tenant
PUT /api/tenants/:id

# Delete (archive) tenant
DELETE /api/tenants/:id

# Deactivate tenant
PUT /api/tenants/:id/deactivate

# Reactivate tenant
PUT /api/tenants/:id/reactivate

# Update tenant business details
PUT /api/tenants/:id/business-details
```

### Subscription Management

```
# Create a new subscription
POST /api/subscriptions

# Get subscription details for a tenant
GET /api/subscriptions/:tenantId

# Cancel a subscription
PUT /api/subscriptions/:tenantId/cancel

# Get all invoices for a tenant
GET /api/subscriptions/:tenantId/invoices

# Get a specific invoice
GET /api/subscriptions/invoices/:invoiceId

# Generate PDF invoice
GET /api/subscriptions/invoices/:invoiceId/pdf

# Send invoice by email
POST /api/subscriptions/invoices/:invoiceId/send

# Mark invoice as paid
PUT /api/subscriptions/invoices/:invoiceId/pay
```

## Database Schema Updates

### Tenant Model

The Tenant model has been updated with the following fields:

- `status`: Enum ['active', 'inactive', 'trial', 'suspended']
- `subscriptionType`: Enum ['trial', 'monthly', 'biannual', 'annual']
- `subscriptionStartDate`: Date when the subscription started
- `subscriptionEndDate`: Date when the subscription will end
- `location`: Object containing address, city, state, zipCode, country
- `businessDetails`: Object containing business information
- `contactPhone`: String for phone contact
- `autoRenew`: Boolean indicating if subscription should auto-renew
- `lastBillingDate`: Date of last billing
- `nextBillingDate`: Date of next billing

### New Models

#### Subscription Model

Tracks subscription details for tenants:

- `tenantId`: Reference to the tenant
- `plan`: Type of subscription plan
- `status`: Current status of the subscription
- `startDate`: When the subscription started
- `endDate`: When the subscription will end
- `price`: Cost of the subscription
- `autoRenew`: Whether to automatically renew
- `features`: Object containing plan features

#### Invoice Model

Manages invoices for tenant subscriptions:

- `invoiceNumber`: Unique identifier for the invoice
- `tenantId`: Reference to the tenant
- `amount`: Base amount before tax
- `tax`: Tax amount
- `totalAmount`: Total amount including tax
- `status`: Current status of the invoice
- `dueDate`: When payment is due
- `issueDate`: When the invoice was issued
- `paidDate`: When the invoice was paid
- `items`: Array of line items

## Scheduled Jobs

The system includes the following scheduled jobs:

1. **Check Expiring Subscriptions**: Runs daily at 8:00 AM to identify subscriptions that are about to expire and send reminders.

2. **Process Auto-Renewals**: Runs daily at 1:00 AM to automatically renew subscriptions that have auto-renew enabled and are due for renewal.

3. **Check Overdue Invoices**: Runs daily at 9:00 AM to identify overdue invoices and take appropriate actions.

## Testing

A test script is provided to test the subscription functionality:

```
node scripts/testSubscription.js
```

This script will:
1. Create a subscription for an existing tenant
2. Generate an invoice
3. Create a PDF invoice
4. Mark the invoice as paid
5. Cancel the subscription

## Future Enhancements

1. **Payment Gateway Integration**: Integration with payment gateways like Razorpay, Stripe, etc.

2. **Advanced Reporting**: Detailed reports on subscription metrics, revenue, etc.

3. **Customizable Invoice Templates**: Allow tenants to customize their invoice templates.

4. **Multiple Payment Methods**: Support for different payment methods.

5. **Subscription Analytics**: Insights into subscription trends, churn rate, etc.