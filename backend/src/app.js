import { errorHandler, notFound } from './middleware/errorHandler.middleware.js';

import adminRoutes from './modules/admin/admin.routes.js';
import { apiLimiterMiddleware as apiLimiter } from './middleware/rateLimit.middleware.js';
// Import Routes
import authRoutes from './modules/auth/auth.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import clientRoutes from './modules/clients/client.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dnsRoutes from './modules/hosting/dns.routes.js';
import domainRoutes from './modules/domains/domain.routes.js';
import dynamicHostingRoutes from './modules/hosting/dynamic-hosting.routes.js';
import express from 'express';
import helmet from 'helmet';
import invoiceRoutes from './modules/invoices/invoice.routes.js';
import logger from './utils/logger.js';
import morgan from 'morgan';
import paymentRoutes from './modules/payments/payment.routes.js';
import staticHostingRoutes from './modules/hosting/static-hosting.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';

const app = express();

// Trust proxy (for production behind Nginx)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}));

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health Check (no rate limit)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/hosting/dns', dnsRoutes);
app.use('/api/hosting/static', staticHostingRoutes);
app.use('/api/hosting/dynamic', dynamicHostingRoutes);
app.use('/api/hosting/static', staticHostingRoutes);

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SaaSify Hosting Platform API v1.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      clients: '/api/clients',
      admin: '/api/admin',
      domains: '/api/domains',
      cart: '/api/cart',
      invoices: '/api/invoices',
      payments: '/api/payments',
      wallet: '/api/wallet',
      hosting: {
        dns: '/api/hosting/dns',
        static: '/api/hosting/static',
        dynamic: '/api/hosting/dynamic',
      },
    },
  });
});

// 404 Handler
app.use(notFound);

// Error Handler (must be last)
app.use(errorHandler);

export default app;
