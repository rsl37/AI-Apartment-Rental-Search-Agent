import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../utils/rbacService';
import { AuditLogger } from './auditMiddleware';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phoneNumber: string;
    role?: UserRole;
    mfaEnabled?: boolean;
    mfaVerified?: boolean;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      AuditLogger.logAuthAttempt(req, false, { reason: 'No token provided' });
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    // Check token expiration more strictly
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      AuditLogger.logAuthAttempt(req, false, { reason: 'Token expired' });
      return res.status(401).json({ error: 'Token expired' });
    }

    req.user = decoded;
    AuditLogger.logAuthAttempt(req, true, { userId: decoded.id });
    next();
  } catch (error) {
    AuditLogger.logAuthAttempt(req, false, { 
      reason: 'Invalid token',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (!decoded.exp || decoded.exp >= now) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Invalid token, but continue without auth
    next();
  }
};

export const requireMFAVerification = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // If MFA is enabled but not verified, require MFA verification
  if (req.user.mfaEnabled && !req.user.mfaVerified) {
    AuditLogger.logAuthorizationFailure(req, 'MFA verification required');
    return res.status(403).json({ 
      error: 'MFA verification required',
      mfaRequired: true
    });
  }

  next();
};

export const generateToken = (payload: any, expiresIn?: string): string => {
  const tokenExpiry = expiresIn || '15m'; // Shorter default expiry for security
  
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: tokenExpiry,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: any): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '7d', // Longer expiry for refresh tokens
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};