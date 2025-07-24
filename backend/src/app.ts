import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { securityHeaders } from './middlewares/securityMiddleware';
import { auditMiddleware } from './middlewares/auditMiddleware';
import logger from './config/logger';

// Import routes
import apartmentsRoutes from './routes/apartmentsRoutes';
import usersRoutes from './routes/usersRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle this in our custom middleware
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Custom security headers
app.use(securityHeaders);

// CORS configuration with enhanced security
app.use(cors({
  ...config.cors,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
}));

// Enhanced rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth attempts
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for API calls
  message: {
    error: 'API rate limit exceeded, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/verify', authLimiter);
app.use('/api/users/login', authLimiter);

// Request parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100
}));

// Audit logging middleware
app.use(auditMiddleware);

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
    skip: (req) => {
      // Skip logging for health checks and static files
      return req.url === '/health' || req.url.startsWith('/uploads/');
    }
  }));
}

// Health check endpoint with enhanced information
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    security: {
      headersEnabled: true,
      rateLimitEnabled: true,
      auditingEnabled: true
    }
  });
});

// API routes with rate limiting
app.use('/api/apartments', apiLimiter, apartmentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/reports', apiLimiter, reportsRoutes);
app.use('/api/auth', authLimiter, authRoutes);

// Serve static files from uploads directory with security headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Apartment Rental Agent API',
    version: '1.0.0',
    description: 'REST API for the AI Apartment Rental Agent application',
    security: {
      authentication: 'JWT Bearer Token',
      rateLimit: `${config.rateLimit.max} requests per ${config.rateLimit.windowMs/1000/60} minutes`,
      encryption: 'AES-256 for sensitive data',
      headers: 'Security headers enabled'
    },
    endpoints: {
      apartments: '/api/apartments',
      users: '/api/users',
      notifications: '/api/notifications',
      reports: '/api/reports',
      auth: '/api/auth',
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;