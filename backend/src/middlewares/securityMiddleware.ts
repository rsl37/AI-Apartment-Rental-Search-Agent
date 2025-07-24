import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import logger from '../config/logger';

// Enhanced security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // HSTS header for HTTPS enforcement
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );
  
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Input validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', { 
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      errors: errors.array()
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg
      }))
    });
  }
  next();
};

// Common validation rules
export const phoneValidation = () => [
  body('phoneNumber')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
    .escape()
];

export const emailValidation = () => [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format')
    .escape()
];

export const passwordValidation = () => [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

export const idValidation = (paramName: string = 'id') => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`)
];

export const paginationValidation = () => [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const searchValidation = () => [
  query('search')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Search query too long')
    .escape()
];

// Sanitize HTML input
export const sanitizeHtml = () => [
  body('*')
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        // Remove potentially dangerous HTML tags and attributes
        return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                   .replace(/javascript:/gi, '')
                   .replace(/on\w+="[^"]*"/gi, '');
      }
      return value;
    })
];