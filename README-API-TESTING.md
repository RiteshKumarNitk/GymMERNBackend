# GymOwl SaaS API Testing Guide

## Overview

This guide provides instructions on how to test the GymOwl SaaS API using Postman. The API follows a hierarchical structure where:

1. **Super Admin** can create gym tenants and gym owners
2. **Gym Owners** can create front desk staff and managers
3. **Front Desk Staff** can create trainers and members

## Prerequisites

1. Node.js and npm installed
2. MongoDB running locally or connection to MongoDB Atlas
3. Postman installed
4. GymOwl SaaS application running locally

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Start the application: `npm start`
5. Import the Postman collection: `GymOwl_SaaS.postman_collection.json`

## Testing Flow

### 1. Super Admin Operations

#### Create Super Admin (Initial Setup)

- This is a one-time setup to create the first super admin
- Run the "Create Super Admin" request in the Postman collection

#### Login as Super Admin

- Use the credentials: `superadmin@example.com` / `admin123`
- The response will include a JWT token
- Save this token to the `superadmin_token` variable in Postman

#### Create Tenant (Gym)

- Use the Super Admin token to create a new gym tenant
- This will also create a gym owner account
- Note the tenant ID from the response

#### View Tenant Details

- Use the Super Admin token to view details of the created tenant
- Replace `:id` in the URL with the tenant ID from the previous step

### 2. Gym Owner Operations

#### Login as Gym Owner

- Use the credentials created during tenant creation: `john@fitlife.com` / `password123`
- Save the token to the `owner_token` variable in Postman

#### Create Front Desk Staff

- Use the Gym Owner token to create a front desk staff account
- This creates a user with the `frontdesk` role

#### Create Manager (Optional)

- Similar to creating front desk staff, but with the `manager` role

### 3. Front Desk Operations

#### Login as Front Desk

- Use the credentials created by the gym owner: `alice@fitlife.com` / `alice123`
- Save the token to the `frontdesk_token` variable in Postman

#### Create Trainer

- Use the Front Desk token to create a trainer
- Note the trainer ID from the response
- Save this ID to the `trainer_id` variable in Postman

#### Create Member

- Use the Front Desk token to create a member
- You can create a member with or without assigning a trainer
- To assign a trainer, use the trainer ID from the previous step

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login and get JWT token

### Super Admin

- `GET /api/superadmin/reports` - Get CRM reports
- `GET /api/superadmin/tenants` - Get all tenants
- `GET /api/superadmin/tenants/:id` - Get tenant details

### Tenant Management

- `POST /api/tenants` - Create a new tenant (Super Admin only)
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant

### Gym Management

- `GET /api/gym/profile` - Get gym profile
- `PUT /api/gym/profile` - Update gym profile

### User Management

- `POST /api/users` - Create user (Owner, Manager)
- `GET /api/users` - Get users

### Trainer Management

- `POST /api/trainers` - Create trainer
- `GET /api/trainers` - Get trainers

### Member Management

- `POST /api/members` - Create member
- `GET /api/members` - Get members

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure you're using the correct token for each request
   - Tokens expire after a certain period; re-login if necessary

2. **Permission Errors**
   - Verify you're using the correct role for each operation
   - Super Admin can create tenants
   - Gym Owners can create staff
   - Front Desk can create trainers and members

3. **Invalid Input Errors**
   - Check the required fields for each request
   - Ensure email addresses are unique
   - Verify that referenced IDs (like trainerId) exist

## Notes

- The system uses JWT for authentication
- Tokens contain user ID, email, role, and tenant ID
- Role-based access control restricts operations based on user role
- Multi-tenancy ensures data isolation between different gyms