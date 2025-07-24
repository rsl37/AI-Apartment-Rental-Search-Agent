import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { EncryptionService } from '../utils/encryptionService';
import { AuditLogger } from './auditMiddleware';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode = 500, message } = err;
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Mask sensitive data in error logging
  const maskedReq = {
    ...req,
    body: EncryptionService.maskSensitiveData(req.body),
    query: EncryptionService.maskSensitiveData(req.query),
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    }
  };

  // Log error with security considerations
  logger.error(`${req.method} ${req.path} - ${statusCode} - ${message}`, {
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    request: {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: maskedReq.body,
      query: maskedReq.query
    },
    user: (req as any).user ? { id: (req as any).user.id } : undefined
  });

  // Log security event for suspicious errors
  if (statusCode === 401 || statusCode === 403) {
    AuditLogger.logSuspiciousActivity(req, 'Authentication/Authorization error', {
      statusCode,
      error: err.name,
      path: req.path
    });
  }

  // Handle specific error types
  if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
    errorCode = 'DATABASE_ERROR';
  }

  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
    errorCode = 'VALIDATION_ERROR';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    errorCode = 'UPLOAD_ERROR';
  }

  // Rate limiting errors
  if (err.message && err.message.includes('Too many requests')) {
    statusCode = 429;
    message = 'Too many requests, please try again later';
    errorCode = 'RATE_LIMIT_EXCEEDED';
    
    AuditLogger.logSuspiciousActivity(req, 'Rate limit exceeded', {
      statusCode,
      path: req.path,
      ip: req.ip
    });
  }

  // Security: Don't leak internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Generic error messages for production
    if (statusCode === 500) {
      message = 'Internal server error';
      errorCode = 'INTERNAL_ERROR';
    }
    
    // Remove stack traces and sensitive information
    delete err.stack;
  }

  // Prepare error response
  const errorResponse: any = {
    error: message,
    code: errorCode,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Add additional info only in development
  if (!isProduction) {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  
  // Log suspicious 404s
  AuditLogger.logSuspiciousActivity(req, '404 Not Found', {
    path: req.originalUrl,
    method: req.method
  });
  
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error classes
export class SecurityError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 403, code: string = 'SECURITY_ERROR') {
    super(message);
    this.name = 'SecurityError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export class ValidationError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.code = code;
    this.isOperational = true;
  }
}

export default {
  errorHandler,
  notFound,
  asyncHandler,
  SecurityError,
  ValidationError
};