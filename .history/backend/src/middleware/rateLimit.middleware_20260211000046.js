import RedisStore from 'rate-limit-redis';
import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis.js';

// Lazy initialization - limiters created after Redis connects
let apiLimiter, searchLimiter, authLimiter;

// Initialize rate limiters (call after Redis is connected)
export const initRateLimiters = () => {
  apiLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args),
      prefix: 'rl:api:',
    }),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      error: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  searchLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args),
      prefix: 'rl:search:',
    }),
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_DOMAIN_SEARCH) || 10,
    message: {
      success: false,
      error: 'Too many search requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  authLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args),
      prefix: 'rl:auth:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      error: 'Too many login attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Middleware wrappers that use the initialized limiters
// DEVELOPMENT: Rate limiting bypassed
export const apiLimiterMiddleware = (req, res, next) => {
  return next(); // Bypass rate limiting
};

export const searchLimiterMiddleware = (req, res, next) => {
  return next(); // Bypass rate limiting
};

export const authLimiterMiddleware = (req, res, next) => {
  return next(); // Bypass rate limiting
};

// Payment webhook - no limit (verified by signature)
export const noLimit = rateLimit({
  windowMs: 1000,
  max: 1000,
  skip: () => true,
});
