# SaaSify – Technical Documentation

---

## 1. PROJECT OVERVIEW

**Project Name:** SaaSify – Hosting & Domain Automation Platform

**Description:**
A production-grade, full-stack MERN (MongoDB, Express, React, Node.js) SaaS platform for web hosting, domain management, and billing automation. Inspired by WHMCS, it supports multi-tenant hosting, domain registration, automated billing, and AWS-based provisioning.

**Technology Stack:**
| Layer         | Technology                  | Purpose                        |
|--------------|-----------------------------|---------------------------------|
| Frontend     | React 19, Vite 7, Tailwind  | SPA, UI/UX                     |
| State Mgmt   | Zustand                     | Client state                   |
| Backend      | Node.js 20+, Express 4      | REST API, business logic       |
| Database     | MongoDB (Mongoose ODM)      | Data persistence               |
| Cache/Queue  | Redis, BullMQ               | Caching, background jobs       |
| Payments     | Stripe, Razorpay            | Payment processing             |
| Domains      | GoDaddy API                 | Domain registration            |
| Email        | SendGrid, Nodemailer        | Transactional emails           |
| Cloud        | AWS (EC2, S3, Route53, etc) | Hosting, DNS, storage          |
| Auth         | JWT, 2FA, RBAC              | Security, access control       |
| Logging      | Winston, Morgan             | Logging, audit                 |
| Testing      | Jest, Supertest             | Automated testing              |

**Directory Structure:**
```
SaaSify/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Redis, AWS, indexes
│   │   ├── cron/           # Scheduled jobs
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── modules/        # Feature modules
│   │   ├── queues/         # BullMQ queues
│   │   ├── services/       # Business logic
│   │   ├── workers/        # Background workers
│   │   ├── utils/          # Helpers, logger, encryption
│   ├── storage/            # File storage (invoices)
├── frontend/
│   ├── src/
│   │   ├── config/         # API config
│   │   ├── store/          # Zustand state
│   │   ├── services/       # API services
│   │   ├── layouts/        # Layout components
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   ├── public/             # Static assets
├── docs/                   # Documentation
```

**Prerequisites & Dependencies:**
- Node.js 20+
- MongoDB
- Redis
- AWS account (for provisioning)
- GoDaddy, Stripe, Razorpay credentials

---

## 2. ARCHITECTURE

**System Architecture Diagram:**
```mermaid
graph TD
  subgraph Frontend
    FE[React SPA]
  end
  subgraph Backend
    API[Express API]
    CRON[Cron Jobs]
    WORKERS[Workers]
    QUEUES[BullMQ]
  end
  subgraph Infra
    DB[(MongoDB)]
    REDIS[(Redis)]
    AWS[AWS Services]
    EMAIL[SendGrid/Nodemailer]
    PAYMENT[Stripe/Razorpay]
    DOMAIN[GoDaddy API]
  end
  FE-->|REST/HTTPS|API
  API-->|DB|DB

  ## 5. DATABASE SCHEMA (FULL)

  ### User
  ```js

**Key Architectural Decisions:**
- Monorepo for FE/BE
- RESTful API
- JWT + refresh tokens
- BullMQ for async jobs
- AWS-native provisioning
- Multi-tenant, RBAC

---

## 3. SETUP & INSTALLATION

**Local Setup:**
```bash
# Backend
cd backend
  ```

  ### Client
  ```js
npm install
cp .env.example .env
npm run dev

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Environment Variables:**
See [backend/.env.example](../backend/.env.example) and [frontend/.env.example](../frontend/.env.example)

**Key Variables:**
| Variable                | Description                  |
  ```

  ### Domain
  ```js
|------------------------|------------------------------|
| MONGODB_URI            | MongoDB connection string    |
| REDIS_URL              | Redis connection string      |
| JWT_SECRET             | JWT signing key              |
| SMTP_*                 | Email credentials            |
| GODADDY_API_KEY/SECRET | GoDaddy API keys             |
| RAZORPAY_KEY_ID/SECRET | Razorpay API keys            |
| STRIPE_SECRET_KEY      | Stripe API key               |
| AWS_*                  | AWS credentials              |

**Build & Run Commands:**
- Backend: `npm run dev` (dev), `npm start` (prod)
- Frontend: `npm run dev` (dev), `npm run build && npm run preview` (prod)
- Workers: `npm run worker` (backend)
- Cron: `npm run cron` (backend)

---

## 4. API DOCUMENTATION

  ```

  ### Product
  ```js
**Authentication:**
- JWT (access/refresh), 2FA, RBAC
- Endpoints: `/api/auth/*`, `/api/clients/*`, `/api/admin/*`

**Example Endpoint Table:**
| Method | Path                | Auth      | Description                |
|--------|---------------------|-----------|----------------------------|
| POST   | /api/auth/login     | None      | User login                 |
| POST   | /api/auth/register  | None      | User registration          |
| POST   | /api/auth/2fa       | JWT       | Enable/verify 2FA          |
| GET    | /api/domains/search | JWT       | Search domains             |
| POST   | /api/domains        | JWT       | Register domain            |
| GET    | /api/invoices       | JWT       | List invoices              |
| POST   | /api/payments/stripe| JWT       | Pay invoice (Stripe)       |
| POST   | /api/payments/razorpay| JWT    | Pay invoice (Razorpay)     |
  ```

  ### Order
  ```js

**Request/Response Example:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "..."
}
// Response
  ```

  ### Service
  ```js
{
  "success": true,
  "data": { "accessToken": "...", "refreshToken": "..." }
}
```

**See:** [backend/SaaSify_API_Collection.postman_collection.json](../backend/SaaSify_API_Collection.postman_collection.json)

---

## 5. DATABASE SCHEMA

**Entities:**
- User, Client, Domain, Product, Order, Service, Invoice, Transaction, Wallet, ActivityLog
  ```

  ### Invoice
  ```js

**Example (User):**
| Field                | Type      | Notes                |
|----------------------|-----------|----------------------|
| email                | String    | Unique, required     |
| passwordHash         | String    | Hashed (bcrypt)      |
| role                 | String    | admin/staff/client   |
| twoFAEnabled         | Boolean   | 2FA status           |
| emailVerified        | Boolean   | Email verification   |
| ...                  | ...       | ...                  |

**Relationships:**
- Client references User
- Service references Client, Product, Order
  ```

  ### Transaction
  ```js
- Invoice references Client, Order, Service
- Domain references Client, Order

**Indexes & Constraints:**
- Unique: email, domainName, invoiceNumber
- Indexed: status, role, expiryDate, dueDate

---

## 6. CORE MODULES/COMPONENTS

**Backend Modules:**
- `auth`: Auth, JWT, 2FA, RBAC
- `clients`: Client profile, wallet
- `domains`: Search, register, renew, DNS
- `hosting`: Provisioning (AWS/cPanel), suspension
  ```

  ### ActivityLog
  ```js
- `invoices`: Billing, PDF, reminders
- `payments`: Stripe, Razorpay, webhooks
- `cart`: Cart, checkout
- `admin`: Admin panel APIs

**Frontend:**
- `services/`: API abstraction (axios)
- `store/`: Zustand state
- `pages/`: Dashboard, domains, invoices, cart
- `components/`: UI widgets, forms

**Example (Invoice Service):**
```js
  ```

  ### Server
  ```js
// backend/src/services/invoice.service.js
class InvoiceService {
  async createInvoiceFromOrder(order, client) { /* ... */ }
  async generatePDF(invoiceId) { /* ... */ }
}
```

---

## 7. TESTING

- **Frameworks:** Jest, Supertest (backend)
- **How to Run:**
  ```

  ### HostingService
  ```js
  - `npm run test` (backend)
  - `npm run test:watch` (watch mode)
  - `npm run test:coverage` (coverage)
- **Coverage:** [TODO: VERIFY] (Check Jest output)

---

## 8. DEPLOYMENT

- **Environments:** Dev, Staging, Production
- **CI/CD:** [TODO: VERIFY] (Recommend GitHub Actions, see `package.json` scripts)
- **Hosting:** AWS (EC2, S3, Route53, CloudFront)
  ```

  **Relationships:**
  - Client references User
  - Service references Client, Product, Order
  - Invoice references Client, Order, Service
  - Domain references Client, Order
  - Transaction references Client, Invoice, Order
  - HostingService references User, Domain

  **Indexes & Constraints:**
  - Unique: email, domainName, invoiceNumber, transactionId
  - Indexed: status, role, expiryDate, dueDate, etc.

  ---

  ## 5a. API ENDPOINTS & MODEL MAPPING (FULL)

  ### Auth API
  | Method | Path | Description | Model(s) |
  |--------|------|-------------|----------|
  | POST | /api/auth/register | Register new user | User |
  | POST | /api/auth/verify-email | Verify email | User |
  | POST | /api/auth/login | Login | User |
  | POST | /api/auth/logout | Logout | User |
  | POST | /api/auth/refresh-token | Refresh JWT | User |
  | POST | /api/auth/forgot-password | Request password reset | User |
  | POST | /api/auth/reset-password | Reset password | User |
  | POST | /api/auth/change-password | Change password | User |
  | POST | /api/auth/enable-2fa | Enable 2FA | User |

  ### Clients API
  | Method | Path | Description | Model(s) |
  |--------|------|-------------|----------|
  | GET | /api/clients/me | Get client profile | Client, User |
  | PATCH | /api/clients/me | Update client profile | Client |
  | GET | /api/clients/me/wallet | Get wallet balance | Client |
  | POST | /api/clients/me/wallet/add | Add funds to wallet | Client, Transaction |
  | GET | /api/clients/me/activity | Get activity logs | ActivityLog |

  ### Domains API
  | Method | Path | Description | Model(s) |
  |--------|------|-------------|----------|
  | GET | /api/domains/search | Search for domains | Domain |
  | GET | /api/domains/availability/:domain | Check domain availability | Domain |
  | GET | /api/domains/suggestions | Get domain suggestions | Domain |
  | GET | /api/domains/pricing/:tld | Get domain pricing | Product |
  | GET | /api/domains/tlds | List supported TLDs | Product |
  | GET | /api/domains/my-domains | Get user's domains | Domain |
  | GET | /api/domains/:id | Get domain by ID | Domain |
  | POST | /api/domains/transfer | Initiate domain transfer | Domain |

  ### Invoices API
  | Method | Path | Description | Model(s) |
  |--------|------|-------------|----------|
  | GET | /api/invoices | List my invoices | Invoice |
  | GET | /api/invoices/:id | Get invoice by ID | Invoice |
  | GET | /api/invoices/:id/pdf | Download invoice PDF | Invoice |
  | POST | /api/invoices/:id/pay | Pay invoice | Invoice, Transaction |
  | POST | /api/invoices/admin/create | Admin create invoice | Invoice |
  | GET | /api/invoices/admin/all | Admin list all invoices | Invoice |
  | PATCH | /api/invoices/admin/:id | Admin update invoice | Invoice |
  | DELETE | /api/invoices/admin/:id | Admin delete invoice | Invoice |
  | POST | /api/invoices/admin/:id/send-email | Admin send invoice email | Invoice |

  ### Payments API
  | Method | Path | Description | Model(s) |
  |--------|------|-------------|----------|
  | POST | /api/payments/razorpay/create-order | Create Razorpay order | Transaction |
  | POST | /api/payments/razorpay/verify | Verify Razorpay payment | Transaction |
  | POST | /api/payments/razorpay/webhook | Razorpay webhook | Transaction |
  | POST | /api/payments/stripe/create-intent | Create Stripe intent | Transaction |
  | POST | /api/payments/stripe/confirm | Confirm Stripe payment | Transaction |
  | POST | /api/payments/stripe/webhook | Stripe webhook | Transaction |
  | GET | /api/payments/stripe/config | Get Stripe config | - |
  | POST | /api/payments/wallet/razorpay/create-order | Wallet top-up | Transaction |
  | POST | /api/payments/refund | Create refund | Transaction |
  | GET | /api/payments/refund/:refundId | Get refund status | Transaction |

  ### Cart API
  | Method | Path | Description | Model(s) |
  |--------|------|-------------|----------|
  | GET | /api/cart | Get user's cart | Order, Product |
  | POST | /api/cart/add | Add item to cart | Order, Product |
  | PATCH | /api/cart/:itemId | Update cart item | Order |
  | DELETE | /api/cart/:itemId | Remove item from cart | Order |
  | DELETE | /api/cart/clear | Clear cart | Order |
  | POST | /api/cart/coupon | Apply coupon | Order |
  | DELETE | /api/cart/coupon | Remove coupon | Order |
  | POST | /api/cart/checkout | Checkout and create order | Order, Transaction |
  | POST | /api/cart/verify-payment | Verify payment | Transaction |

  ### Hosting API
  | Method | Path | Description | Model(s) |
  |--------|------|-------------|----------|
  | POST | /api/hosting/static/create | Create static hosting | HostingService, Domain |
  | GET | /api/hosting/static | List static hosting | HostingService |
  | GET | /api/hosting/static/:id | Get static hosting details | HostingService |
  | POST | /api/hosting/static/:id/upload-url | Generate upload URL | HostingService |
  | GET | /api/hosting/static/:id/files | List files | HostingService |
  | DELETE | /api/hosting/static/:id/files | Delete file | HostingService |
  | POST | /api/hosting/static/:id/invalidate | Invalidate cache | HostingService |
  | DELETE | /api/hosting/static/:id | Terminate static hosting | HostingService |
  | POST | /api/hosting/dynamic/create | Create dynamic hosting | HostingService, Domain |
  | GET | /api/hosting/dynamic | List dynamic hosting | HostingService |
  | GET | /api/hosting/dynamic/:id | Get dynamic hosting details | HostingService |
  | GET | /api/hosting/dynamic/:id/ssh | Get SSH info | HostingService |
  | GET | /api/hosting/dynamic/:id/database | Get DB info | HostingService |
  | GET | /api/hosting/dynamic/:id/status | Get instance status | HostingService |
  | DELETE | /api/hosting/dynamic/:id | Terminate dynamic hosting | HostingService |

  ---
- **Workers:** Run via `npm run worker` (BullMQ)
- **Cron Jobs:** Run via `npm run cron`

---

## 9. TROUBLESHOOTING & FAQ

| Issue                        | Solution                                  |
|------------------------------|-------------------------------------------|
| MongoDB connection error     | Ensure MongoDB is running on port 27017   |
| Redis connection error       | Start Redis with `redis-server`           |
| Frontend can't connect       | Check VITE_API_URL matches backend URL    |
| Workers not running          | Start with `npm run worker` in backend    |
| AWS provisioning fails       | Check AWS credentials and permissions     |
| Payment webhooks fail        | Verify webhook secrets and endpoints      |

---

## 10. CONTRIBUTING GUIDELINES

- **Code Style:**
  - JS: Prettier, ESLint (`npm run lint`)
  - React: Functional components, hooks
- **Pull Requests:**
  - Fork, branch, PR with description
  - Reference issues/requirements
- **Version Control:**
  - Git, feature-branch workflow
  - Commit messages: Conventional Commits

---

[//]: # (Auto-generated by GitHub Copilot, 2026-02-13)
