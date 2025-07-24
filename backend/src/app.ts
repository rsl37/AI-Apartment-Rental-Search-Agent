import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { errorHandler, notFound } from './middlewares/errorHandler';
import logger from './config/logger';

// Import routes
import apartmentsRoutes from './routes/apartmentsRoutes';
import usersRoutes from './routes/usersRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import reportsRoutes from './routes/reportsRoutes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/apartments', apartmentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'AI Apartment Rental Agent API',
    version: '1.0.0',
    description: 'REST API for the AI Apartment Rental Agent application',
    endpoints: {
      apartments: '/api/apartments',
      users: '/api/users',
      notifications: '/api/notifications',
      reports: '/api/reports',
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;