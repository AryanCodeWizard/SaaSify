# 🚀 SaaSify – Production-Ready Domain & Hosting Management Platform

**A full-featured MERN-stack SaaS platform for domain registration, web hosting, and automated billing – inspired by WHMCS.**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Supported-brightgreen)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19+-blue)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-blue)]()

---

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT Authentication** with refresh token rotation
- **Role-Based Access Control (RBAC)** – Admin & Client roles
- **Two-Factor Authentication (2FA)** – TOTP-based security
- **Email Verification** – Secure account creation
- **Password Reset** – Token-based recovery
- **Rate Limiting** – Brute force & DDoS protection
- **Account Suspension** – Admin controls

### 🌐 Domain Management
- **Domain Search** – Real-time availability checking across multiple TLDs
- **GoDaddy API Integration** – Automated domain registration
- **Domain Transfer** – Seamless domain migration with status tracking
- **DNS Management** – Full control over A, AAAA, CNAME, MX, TXT, SRV records
- **Domain Contacts** – Registrant, Admin, Tech, Billing contact management
- **Domain Security** – Lock/Unlock, privacy protection options
- **Auto-Renewal** – Automatic domain renewal before expiry
- **Expiry Tracking** – Email notifications for upcoming renewals
- **Email Forwarding** – Configure email forwarding rules

### 💳 Billing & Payments
- **Multi-Gateway Support** – Razorpay (India) & Stripe (International)
- **Wallet System** – Customer balance management
- **Invoice Management** – Automated PDF generation & delivery
- **Payment Processing** – Secure payment handling with validation
- **Invoice History** – Complete transaction tracking
- **Payment Reminders** – Automated email notifications (3 days before due)
- **Late Fees** – Automatic calculation and application
- **Service Suspension** – Automatic suspension after 7 days overdue
- **Service Termination** – Automatic termination after 30 days suspended

### 🏠 Hosting Services
- **Dynamic Hosting** – Managed cloud hosting with SSH/Database access
- **Static Hosting** – AWS S3 + CloudFront CDN deployment
- **Infrastructure Management** – EC2, RDS, Route53 integration
- **SSL Certificates** – AWS ACM integration
- **Database Access** – MySQL/MariaDB provisioning
- **SSH Access** – Secure shell credentials
- **Service Status** – Real-time instance monitoring

### 🤖 Automation & Background Jobs
- **Cron Jobs** – Scheduled domain management tasks
- **Background Workers** – BullMQ-powered job queue
- **Domain Expiry Monitoring** – Daily checks (24-hour cycle)
- **Auto-Renewal Processing** – Automatic renewal execution
- **Transfer Status Updates** – Hourly status tracking
- **Email Notifications** – Transactional email delivery
- **Service Lifecycle Management** – Suspension & termination automation

### 📊 Admin Dashboard
- **User Management** – View, edit, suspend users
- **Dashboard Stats** – Revenue, MRR, active services overview
- **Audit Logs** – Complete activity tracking
- **Client Credit Management** – Add/deduct wallet balance
- **Invoice Management** – Create & manage invoices
- **System Health** – AWS & Database connection status

### 💰 Wallet & Transactions
- **Balance Management** – Real-time wallet balance
- **Add Funds** – Top-up via payment gateways
- **Pay Invoices** – Direct wallet payment option
- **Transaction History** – Complete transaction log
- **Admin Adjustments** – Manual credit/debit operations

### 📱 User Interface
- **Responsive Design** – Mobile-first approach
- **Dark/Light Mode Ready** – Modern UI with Tailwind CSS
- **Real-time Updates** – Instant feedback on actions
- **Dashboard** – User overview & quick stats
- **Domain Management** – Intuitive domain control panel
- **Invoice Portal** – Download & track payments
- **User Settings** – Profile management & preferences

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI library |
| **Vite 7** | Build tool & dev server |
| **React Router 7** | Client-side routing |
| **Tailwind CSS 4** | Utility-first styling |
| **Zustand** | State management |
| **Axios** | HTTP client |
| **React Hook Form** | Form management |
| **Zod** | Schema validation |
| **Lucide React** | Icon library |
| **Date-fns** | Date formatting |
| **React Hot Toast** | Toast notifications |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 20+** | Runtime |
| **Express 4** | Web framework |
| **MongoDB** | Primary database |
| **Mongoose** | ODM for MongoDB |
| **Redis** | Caching & sessions |
| **BullMQ** | Job queue system |
| **JWT** | Authentication tokens |
| **Bcrypt** | Password hashing |
| **Winston** | Logging |
| **Morgan** | HTTP request logger |
| **Joi** | Schema validation |
| **dotenv** | Environment variables |

### Integrations & Services
| Service | Purpose |
|---------|---------|
| **GoDaddy API** | Domain registration & management |
| **Razorpay** | Payment processing (India) |
| **Stripe** | Payment processing (International) |
| **SendGrid/Nodemailer** | Email delivery |
| **AWS Services** | EC2, S3, RDS, Route53, CloudFront, ACM |
| **Speakeasy** | Two-factor authentication (TOTP) |

### Dev Tools
| Tool | Purpose |
|------|---------|
| **Jest** | Unit testing |
| **Supertest** | API testing |
| **ESLint** | Code linting |
| **Nodemon** | Dev auto-reload |
| **Concurrently** | Multi-process management |

---

## 📁 Folder Structure

### Backend Structure
```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis configuration
│   │   └── indexes.js         # Database indexes
│   ├── constants/
│   │   └── enums.js           # Shared enumerations
│   ├── middleware/
│   │   ├── auth.middleware.js        # JWT verification
│   │   ├── errorHandler.middleware.js # Error handling
│   │   ├── rateLimit.middleware.js    # Rate limiting
│   │   └── validation.middleware.js   # Input validation
│   ├── models/
│   │   ├── User.js, Client.js, Domain.js
│   │   ├── Invoice.js, Transaction.js, Order.js
│   │   ├── Service.js, HostingService.js
│   │   ├── Infrastructure.js, Server.js
│   │   ├── Product.js, ActivityLog.js
│   │   └── ...
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Authentication logic
│   │   ├── domains/       # Domain management
│   │   ├── hosting/       # Hosting services
│   │   ├── payments/      # Payment processing
│   │   ├── invoices/      # Invoice management
│   │   ├── wallet/        # Wallet operations
│   │   ├── clients/       # Client management
│   │   ├── cart/          # Shopping cart
│   │   ├── admin/         # Admin operations
│   │   └── aws/           # AWS integration
│   ├── services/
│   │   ├── email.service.js      # Email delivery
│   │   ├── godaddy.service.js    # Domain API
│   │   ├── razorpay.service.js   # Razorpay payments
│   │   ├── stripe.service.js     # Stripe payments
│   │   └── invoice.service.js    # Invoice generation
│   ├── queues/
│   │   ├── domain.queue.js       # Domain job queue
│   │   ├── hosting.queue.js      # Hosting job queue
│   │   ├── dynamicHosting.queue.js
│   │   └── infra.queue.js        # Infrastructure queue
│   ├── workers/          # Background job processors
│   │   ├── domainRegistration.worker.js
│   │   ├── domainRenewal.worker.js
│   │   ├── domainTransfer.worker.js
│   │   ├── infraProvision.worker.js
│   │   ├── emailNotification.worker.js
│   │   └── ...
│   ├── cron/             # Scheduled tasks
│   │   ├── domainExpiry.cron.js
│   │   ├── autoRenew.cron.js
│   │   ├── paymentReminders.cron.js
│   │   ├── serviceSuspension.cron.js
│   │   └── ...
│   ├── utils/
│   │   ├── logger.js      # Logging utility
│   │   ├── response.js    # Response formatting
│   │   ├── encryption.js  # Data encryption
│   │   └── helpers.js     # Helper functions
│   ├── templates/
│   │   └── emails/        # Email templates
│   └── constants/
│       └── enums.js       # Shared enums
├── scripts/
│   ├── seed.js            # Database seeding
│   ├── create-indexes.js  # Create DB indexes
│   └── rebuild-indexes.js # Rebuild indexes
├── storage/
│   └── invoices/          # Invoice file storage
└── package.json

```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.jsx, main.jsx  # App entry point
│   ├── config/
│   │   └── api.js         # API configuration
│   ├── store/             # Zustand state store
│   ├── services/
│   │   ├── authService.js
│   │   ├── apiService.js
│   │   └── ...
│   ├── layouts/
│   │   ├── DashboardLayout.jsx
│   │   └── MainLayout.jsx
│   ├── pages/
│   │   ├── Home.jsx, Cart.jsx, Checkout.jsx
│   │   ├── DomainSearch.jsx
│   │   ├── auth/         # Auth pages
│   │   └── dashboard/    # Dashboard pages
│   ├── components/
│   │   ├── layout/       # Layout components
│   │   ├── common/       # Reusable components
│   │   ├── forms/        # Form components
│   │   └── ...
│   ├── assets/           # Images, icons
│   └── index.css, App.css
├── vite.config.js        # Vite configuration
├── eslint.config.js      # ESLint rules
└── package.json

```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **MongoDB** (local or Atlas cloud)
- **Redis** (local or cloud instance)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/saasify.git
cd SaaSify
```

### 2. Install all Dependencies
```bash
npm run install:all
```
This installs dependencies for root, backend, and frontend.

### 3. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create a `.env` file:
```bash
cp .env.example .env
```

Configure your `.env` file with appropriate values (see [Environment Variables](#-environment-variables) section).

Create database indexes:
```bash
npm run db:indexes
```

(Optional) Seed sample data:
```bash
npm run db:seed
```

### 4. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Create a `.env` file:
```bash
cp .env.example .env
```

Configure your API URL in `.env`:
```
VITE_API_URL=http://localhost:5000/api
RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 5. Run the Application

#### Option A: Development Mode (Full Stack)
From the root directory:
```bash
npm run dev
```
This starts both frontend and backend concurrently.

#### Option B: Development Mode (Full Stack + Workers + Cron)
```bash
npm run dev:full
```
Starts API, workers, cron jobs, and frontend.

#### Option C: Individual Services

**Backend API:**
```bash
cd backend
npm run dev
```
API runs on `http://localhost:5000`

**Background Workers:**
```bash
cd backend
npm run worker
```

**Cron Jobs:**
```bash
cd backend
npm run cron
```

**Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| **Node Environment** |
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | API server port | `5000` |
| **Database** |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/saasify` |
| `MONGO_MAX_POOL_SIZE` | Max connection pool size | `10` |
| `MONGO_MIN_POOL_SIZE` | Min connection pool size | `2` |
| **Redis** |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password (if any) | `` |
| `REDIS_DB` | Redis database number | `0` |
| `REDIS_TLS` | Enable TLS for Redis | `false` |
| **JWT Authentication** |
| `JWT_SECRET` | Secret key for JWT signing | `your-super-secret-key` |
| `JWT_EXPIRES_IN` | Token expiration time | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `your-refresh-secret` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| **Cookies** |
| `COOKIE_SECRET` | Session cookie secret | `your-cookie-secret` |
| `SESSION_SECRET` | Session secret | `your-session-secret` |
| **CORS** |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:5173` |
| **Frontend** |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |
| **Email Service** |
| `EMAIL_PROVIDER` | Email provider (sendgrid/smtp) | `smtp` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP password | `your-app-password` |
| `SMTP_SECURE` | Use TLS? | `false` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxxx` |
| `EMAIL_FROM` | Sender email address | `noreply@saasify.com` |
| `EMAIL_FROM_NAME` | Sender display name | `SaaSify Support` |
| `COMPANY_NAME` | Your company name | `SaaSify` |
| `SUPPORT_EMAIL` | Support email | `support@saasify.com` |
| **GoDaddy API** |
| `GODADDY_API_KEY` | GoDaddy API key | `your-api-key` |
| `GODADDY_API_SECRET` | GoDaddy API secret | `your-api-secret` |
| `GODADDY_ENV` | Environment (OTE/production) | `OTE` |
| **Razorpay** |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_xxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `your_secret_key` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Secret | `your_webhook_secret` |
| **Stripe** |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | `sk_test_xxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | `pk_test_xxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | `whsec_xxxxx` |
| **AWS Services** |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAXXXXXXX` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `xxxxxxxxxxxxx` |
| **Rate Limiting** |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `RATE_LIMIT_DOMAIN_SEARCH` | Domain search limit | `10` |
| **Logging** |
| `LOG_LEVEL` | Log level (info/debug/error) | `info` |
| `LOG_MAX_SIZE` | Max log file size | `10m` |
| `LOG_MAX_FILES` | Log retention | `7d` |
| **Encryption** |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM | `your-64-char-hex-string` |
| `ENCRYPTION_ALGORITHM` | Encryption algorithm | `aes-256-gcm` |
| **Admin Credentials** |
| `ADMIN_EMAIL` | Default admin email | `admin@saasify.com` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@12345` |
| **2FA** |
| `TWO_FACTOR_APP_NAME` | 2FA app name for TOTP | `SaaSify` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `RAZORPAY_KEY_ID` | Razorpay Public Key | `rzp_test_xxxxx` |

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "statusCode": 200
}
```

### Core API Endpoints

#### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/register` | User registration | ❌ |
| `POST` | `/login` | User login | ❌ |
| `POST` | `/refresh-token` | Refresh JWT token | ❌ |
| `POST` | `/logout` | User logout | ✅ |
| `POST` | `/verify-email` | Verify email address | ❌ |
| `POST` | `/resend-verification` | Resend verification email | ❌ |
| `POST` | `/forgot-password` | Request password reset | ❌ |
| `POST` | `/reset-password` | Reset password via token | ❌ |
| `POST` | `/enable-2fa` | Enable two-factor authentication | ✅ |
| `POST` | `/verify-2fa` | Verify 2FA token | ❌ |
| `POST` | `/disable-2fa` | Disable 2FA | ✅ |

#### 👤 Clients (`/api/clients`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/me` | Get user profile | ✅ |
| `PATCH` | `/me` | Update user profile | ✅ |
| `GET` | `/me/wallet` | Get wallet balance | ✅ |
| `POST` | `/me/wallet/add` | Add wallet funds | ✅ |
| `GET` | `/me/activity` | Get activity logs | ✅ |

#### 🌐 Domains (`/api/domains`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/search` | Search domains | ⚠️ Optional |
| `GET` | `/availability/:domain` | Check domain availability | ⚠️ Optional |
| `GET` | `/tlds` | Get supported TLDs | ✅ |
| `GET` | `/pricing/:tld` | Get TLD pricing | ✅ |
| `POST` | `/register` | Register a domain | ✅ |
| `GET` | `/my-domains` | List user's domains | ✅ |
| `GET` | `/:id` | Get domain details | ✅ |
| `POST` | `/transfer` | Initiate domain transfer | ✅ |
| `POST` | `/renew/:id` | Renew a domain | ✅ |
| `PUT` | `/dns/:domain` | Update DNS records | ✅ |
| `GET` | `/dns/:domain` | Get DNS records | ✅ |
| `DELETE` | `/dns/:domain/:type/:name` | Delete DNS record | ✅ |
| `PATCH` | `/contacts/:domain` | Update domain contacts | ✅ |
| `POST` | `/lock/:domain` | Lock domain | ✅ |
| `PUT` | `/forwarding/:domain` | Set email forwarding | ✅ |

#### 💳 Payments (`/api/payments`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/razorpay/create-order` | Create Razorpay order | ✅ |
| `POST` | `/razorpay/verify` | Verify Razorpay payment | ✅ |
| `POST` | `/stripe/create-intent` | Create Stripe payment intent | ✅ |
| `POST` | `/stripe/verify` | Verify Stripe payment | ✅ |
| `GET` | `/transaction-history` | Get payment history | ✅ |

#### 🛒 Cart (`/api/cart`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Get cart items | ✅ |
| `POST` | `/add` | Add item to cart | ✅ |
| `PATCH` | `/:itemId` | Update cart item | ✅ |
| `DELETE` | `/:itemId` | Remove from cart | ✅ |
| `DELETE` | `/clear` | Clear entire cart | ✅ |
| `POST` | `/coupon` | Apply coupon code | ✅ |
| `POST` | `/checkout` | Proceed to checkout | ✅ |

#### 📄 Invoices (`/api/invoices`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List invoices | ✅ |
| `GET` | `/:id` | Get invoice details | ✅ |
| `GET` | `/:id/pdf` | Download invoice PDF | ✅ |
| `POST` | `/:id/pay` | Pay invoice | ✅ |
| `GET` | `/stats` | Invoice statistics | ✅ |

#### 💰 Wallet (`/api/wallet`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/balance` | Get wallet balance | ✅ |
| `GET` | `/transactions` | Get transactions | ✅ |
| `POST` | `/add-funds` | Add funds via payment | ✅ |
| `POST` | `/pay-invoice` | Pay invoice from wallet | ✅ |

#### 🏠 Hosting (`/api/hosting`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/dynamic/create` | Create dynamic hosting | ✅ |
| `GET` | `/dynamic/` | List hosting services | ✅ |
| `GET` | `/dynamic/:id` | Get hosting details | ✅ |
| `GET` | `/dynamic/:id/ssh` | Get SSH credentials | ✅ |
| `GET` | `/dynamic/:id/database` | Get database info | ✅ |
| `POST` | `/static/create` | Create static hosting | ✅ |
| `GET` | `/static/` | List static sites | ✅ |
| `POST` | `/dns/zones` | Create hosted zone | ✅ |
| `GET` | `/dns/records/:domainId` | Get DNS records | ✅ |
| `POST` | `/dns/records/:domainId` | Create DNS record | ✅ |

#### 👨‍💼 Admin (`/api/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/users` | List all users | ✅ Admin |
| `GET` | `/users/:id` | Get user details | ✅ Admin |
| `PATCH` | `/users/:id` | Update user | ✅ Admin |
| `DELETE` | `/users/:id` | Delete user | ✅ Admin |
| `POST` | `/users/:id/suspend` | Suspend user | ✅ Admin |
| `POST` | `/clients/:id/credit` | Add client credit | ✅ Admin |
| `GET` | `/audit-logs` | Get audit logs | ✅ Admin |
| `GET` | `/stats` | Dashboard statistics | ✅ Admin |

---

## 💡 Usage

### 1. Domain Search & Registration

**Search for domains:**
```bash
curl -X GET "http://localhost:5000/api/domains/search?query=example&extensions=com,net" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Register a domain:**
```bash
curl -X POST "http://localhost:5000/api/domains/register" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "period": 1,
    "registrant": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  }'
```

### 2. Wallet Management

**Check wallet balance:**
```bash
curl -X GET "http://localhost:5000/api/wallet/balance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Add funds:**
```bash
curl -X POST "http://localhost:5000/api/wallet/add-funds" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "gateway": "razorpay"
  }'
```

### 3. Invoice Management

**Get invoices:**
```bash
curl -X GET "http://localhost:5000/api/invoices" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Pay an invoice:**
```bash
curl -X POST "http://localhost:5000/api/invoices/{invoiceId}/pay" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "wallet"
  }'
```

### 4. DNS Management

**Get DNS records:**
```bash
curl -X GET "http://localhost:5000/api/hosting/dns/records/{domainId}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Add DNS record:**
```bash
curl -X POST "http://localhost:5000/api/hosting/dns/records/{domainId}" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "@",
    "type": "A",
    "value": "192.168.1.1",
    "ttl": 3600
  }'
```

### 5. Admin Operations

**Get dashboard stats:**
```bash
curl -X GET "http://localhost:5000/api/admin/stats" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Suspend a user:**
```bash
curl -X POST "http://localhost:5000/api/admin/users/{userId}/suspend" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Terms violation"
  }'
```

---

## 🧪 Testing

### Unit Tests
```bash
cd backend
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### API Testing with Postman
A Postman collection is provided:
- Import `SaaSify_API_Collection.postman_collection.json`
- Import `SaaSify_Environment.postman_environment.json`
- Configure environment variables
- Run requests against your API

---

## 🚀 Deployment

### Prerequisites
- Hosting provider (AWS, Heroku, DigitalOcean, etc.)
- Environment variables properly configured
- MongoDB Atlas or self-hosted MongoDB
- Redis instance
- Domain name

### Deployment Steps

#### 1. Backend Deployment

**Build for Production:**
```bash
cd backend
npm install
npm run build  # If applicable
```

**Environment Setup:**
Ensure all production `.env` variables are set:
```
NODE_ENV=production
PORT=5000
MONGO_URI=<production_mongodb_uri>
REDIS_HOST=<production_redis_host>
JWT_SECRET=<strong_random_key>
...
```

**Database Setup:**
```bash
npm run db:indexes  # Create indexes
```

**Start Server:**
```bash
npm start
```

#### 2. Frontend Deployment

**Build for Production:**
```bash
cd frontend
npm install
npm run build
```

**Deploy Static Files:**
- Upload contents of `dist/` folder to:
  - Netlify, Vercel, AWS S3 + CloudFront, or
  - Your web server's static directory

**Environment Configuration:**
```
VITE_API_URL=https://api.yourdomain.com
RAZORPAY_KEY_ID=your_production_key
```

#### 3. Background Services

**Deploy Workers (for domain registration, renewals, etc.):**
```bash
cd backend
npm run worker
```

**Deploy Cron Jobs (for scheduled tasks):**
```bash
cd backend
npm run cron
```

#### 4. Docker Deployment (Optional)

**Create Backend Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

**Create Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      MONGO_URI: mongodb://mongodb:27017/saasify
      REDIS_HOST: redis
    depends_on:
      - mongodb
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

Run with Docker:
```bash
docker-compose up -d
```

#### 5. SSL/HTTPS Setup

Use Let's Encrypt:
```bash
# With Certbot
sudo certbot certonly --standalone -d yourdomain.com
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### 1. Fork the Repository
```bash
git clone https://github.com/yourusername/saasify.git
cd SaaSify
git checkout -b feature/your-feature-name
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature
```

### 3. Make Changes
- Follow the existing code style
- Write clean, maintainable code
- Add comments for complex logic
- Use meaningful commit messages

### 4. Test Your Changes
```bash
# Backend tests
cd backend && npm test

# Manual testing
npm run dev:full
```

### 5. Commit & Push
```bash
git add .
git commit -m "Add feature: brief description"
git push origin feature/your-feature
```

### 6. Create a Pull Request
- Describe changes clearly
- Link related issues
- Request review from maintainers

### Code Style Guidelines
- **Naming:** camelCase for variables/functions, PascalCase for classes/components
- **Comments:** JSDoc for functions, inline comments for logic
- **Environment:** Use .env.example as template
- **Error Handling:** Try-catch blocks with proper logging
- **Validation:** Joi schemas for API input validation

---

## 📸 Screenshots & Demos

### Landing Page
- Domain search hero section
- Features showcase
- Pricing display
- Call-to-action buttons

### User Dashboard
- Domain overview widget
- Recent activities
- Wallet balance
- Quick actions

### Domain Management
- List all owned domains
- Domain details panel
- DNS management interface
- Renewal status tracking

### Billing Interface
- Invoice list with filters
- Payment history
- Wallet management
- Payment gateway options

---

## 📜 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute copies
- ✅ Include in proprietary projects

With the only requirement:
- ⚠️ Include license and copyright notice

---

## 🆘 Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh

# Verify connection string
echo $MONGO_URI
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping
# Should respond: PONG
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### JWT Token Errors
```
Error: Invalid token
# Generate new encryption key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Update JWT_SECRET in .env
```

### Email Not Sending
- Verify SMTP credentials
- Enable "Less secure apps" for Gmail
- Use app-specific passwords
- Check SendGrid API key if using SendGrid

### Payment Gateway Issues
- Verify API keys are correct
- Check webhook secrets
- Ensure test mode is enabled for development
- Review payment gateway logs

---

## 🎯 Roadmap

### v2.0 (Q2 2025)
- [ ] Multi-currency support
- [ ] Advanced analytics dashboard
- [ ] API v2 with GraphQL option
- [ ] Mobile app (React Native)
- [ ] Advanced domain analytics

### v3.0 (Q4 2025)
- [ ] Machine learning for pricing optimization
- [ ] AI-powered support chatbot
- [ ] Marketplace for domain resellers
- [ ] White-label solutions
- [ ] Advanced security features

---

## 💬 Support & Community

- **Documentation:** Check `technicaldoc.md` for technical details
- **Issues:** Report bugs on GitHub Issues
- **Discussions:** Join community discussions
- **Email:** support@saasify.com

---

## 🙏 Acknowledgments

Built with modern technologies and inspired by industry standards like WHMCS.

**Special Thanks To:**
- Express.js community
- MongoDB & Mongoose teams
- AWS for comprehensive cloud services
- GoDaddy for domain APIs
- React community

---

## 📞 Contact

- **Email:** support@saasify.com
- **Website:** https://saasify.com
- **GitHub:** https://github.com/yourusername/saasify

---

**Happy coding! 🚀 Feel free to star ⭐ this repository if it helps you!**
