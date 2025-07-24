import { Request, Response, NextFunction } from 'express';
import { Permission, UserRole, RBACService } from '../utils/rbacService';
import { AuditLogger } from './auditMiddleware';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    phoneNumber: string;
    role?: UserRole;
  };
}

/**
 * Middleware to check if user has required permissions
 */
export const requirePermission = (permission: Permission | Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      AuditLogger.logAuthorizationFailure(req);
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || UserRole.USER;
    
    if (!RBACService.canAccess(userRole, permission)) {
      AuditLogger.logAuthorizationFailure(req, Array.isArray(permission) ? permission.join(',') : permission);
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: Array.isArray(permission) ? permission : [permission]
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (role: UserRole | UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      AuditLogger.logAuthorizationFailure(req);
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || UserRole.USER;
    const requiredRoles = Array.isArray(role) ? role : [role];
    
    if (!requiredRoles.includes(userRole)) {
      AuditLogger.logAuthorizationFailure(req, requiredRoles.join(','));
      return res.status(403).json({ 
        error: 'Insufficient role',
        required: requiredRoles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to check if user can access specific user data
 */
export const requireUserAccess = (userIdParam: string = 'userId') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      AuditLogger.logAuthorizationFailure(req);
      return res.status(401).json({ error: 'Authentication required' });
    }

    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user.id;
    const userRole = req.user.role || UserRole.USER;

    if (!RBACService.canAccessUserData(currentUserId, targetUserId, userRole)) {
      AuditLogger.logAuthorizationFailure(req, `access_user_${targetUserId}`);
      return res.status(403).json({ 
        error: 'Cannot access other user\'s data' 
      });
    }

    next();
  };
};

/**
 * Admin-only middleware
 */
export const adminOnly = requireRole(UserRole.ADMIN);

/**
 * Moderator or Admin middleware
 */
export const moderatorOrAdmin = requireRole([UserRole.MODERATOR, UserRole.ADMIN]);

export default {
  requirePermission,
  requireRole,
  requireUserAccess,
  adminOnly,
  moderatorOrAdmin
};