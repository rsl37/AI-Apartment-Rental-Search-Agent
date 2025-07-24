import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { EncryptionService } from '../utils/encryptionService';

interface AuditLogData {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  details?: any;
  sensitive?: boolean;
}

export class AuditLogger {
  /**
   * Log security-related actions
   */
  static logSecurityEvent(data: AuditLogData) {
    const logEntry = {
      type: 'SECURITY_EVENT',
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      ip: data.ip,
      userAgent: data.userAgent,
      timestamp: data.timestamp,
      success: data.success,
      details: data.sensitive ? EncryptionService.maskSensitiveData(data.details) : data.details
    };

    if (data.success) {
      logger.info('Security event', logEntry);
    } else {
      logger.warn('Security event failed', logEntry);
    }
  }

  /**
   * Log authentication attempts
   */
  static logAuthAttempt(req: Request, success: boolean, details?: any) {
    this.logSecurityEvent({
      action: 'AUTHENTICATION_ATTEMPT',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      success,
      details,
      sensitive: true
    });
  }

  /**
   * Log authorization failures
   */
  static logAuthorizationFailure(req: Request, requiredRole?: string) {
    this.logSecurityEvent({
      userId: (req as any).user?.id,
      action: 'AUTHORIZATION_FAILURE',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      success: false,
      details: { requiredRole, path: req.path, method: req.method }
    });
  }

  /**
   * Log data access
   */
  static logDataAccess(req: Request, resource: string, resourceId?: string, success: boolean = true) {
    this.logSecurityEvent({
      userId: (req as any).user?.id,
      action: 'DATA_ACCESS',
      resource,
      resourceId,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      success
    });
  }

  /**
   * Log data modification
   */
  static logDataModification(req: Request, resource: string, resourceId?: string, success: boolean = true) {
    this.logSecurityEvent({
      userId: (req as any).user?.id,
      action: 'DATA_MODIFICATION',
      resource,
      resourceId,
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      success,
      details: { method: req.method, path: req.path }
    });
  }

  /**
   * Log suspicious activities
   */
  static logSuspiciousActivity(req: Request, reason: string, details?: any) {
    this.logSecurityEvent({
      userId: (req as any).user?.id,
      action: 'SUSPICIOUS_ACTIVITY',
      ip: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      timestamp: new Date(),
      success: false,
      details: { reason, ...details }
    });
  }
}

/**
 * Middleware to automatically log API requests
 */
export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - start;
    const success = res.statusCode < 400;

    // Log based on HTTP method and status
    if (req.method !== 'GET' || !success) {
      AuditLogger.logSecurityEvent({
        userId: (req as any).user?.id,
        action: `${req.method}_REQUEST`,
        resource: req.route?.path || req.path,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        timestamp: new Date(),
        success,
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          query: req.query,
          params: req.params
        }
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

export default AuditLogger;