# GymOwl SaaS Platform

Production-ready multi-tenant gym management system

## Features
- Multi-tenant architecture with data isolation
- Role-based access control (6 roles)
- JWT authentication
- MVC architecture
- Scalable MongoDB schemas
- Complete validation
- Error handling middleware

## Installation
1. Clone repo
2. Install dependencies: `npm install`
3. Create `.env` file based on `.env.example`
4. Start server: `npm run dev`

## API Endpoints
| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| /api/auth/login | POST | User login | Public |
| /api/tenants | POST | Create new tenant | Super Admin |
| /api/users | POST | Create user | Tenant Owner |
| /api/members | POST | Create member | Front Desk |

## Future Expansion
- Payment integration (Stripe/Razorpay)
- Class scheduling
- Equipment management
- Mobile app integration