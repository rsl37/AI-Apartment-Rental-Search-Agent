export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export enum Permission {
  // User permissions
  READ_OWN_PROFILE = 'read:own_profile',
  UPDATE_OWN_PROFILE = 'update:own_profile',
  DELETE_OWN_PROFILE = 'delete:own_profile',
  
  // Apartment permissions
  READ_APARTMENTS = 'read:apartments',
  CREATE_APARTMENTS = 'create:apartments',
  UPDATE_APARTMENTS = 'update:apartments',
  DELETE_APARTMENTS = 'delete:apartments',
  EXPORT_APARTMENTS = 'export:apartments',
  
  // Notification permissions
  READ_OWN_NOTIFICATIONS = 'read:own_notifications',
  CREATE_NOTIFICATIONS = 'create:notifications',
  READ_ALL_NOTIFICATIONS = 'read:all_notifications',
  
  // Report permissions
  READ_REPORTS = 'read:reports',
  CREATE_REPORTS = 'create:reports',
  
  // Admin permissions
  READ_ALL_USERS = 'read:all_users',
  UPDATE_ALL_USERS = 'update:all_users',
  DELETE_ALL_USERS = 'delete:all_users',
  MANAGE_ROLES = 'manage:roles',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
  MANAGE_SYSTEM = 'manage:system'
}

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.READ_APARTMENTS,
    Permission.READ_OWN_NOTIFICATIONS,
    Permission.READ_REPORTS
  ],
  [UserRole.MODERATOR]: [],
  [UserRole.ADMIN]: []
};

// Define moderator permissions after USER is defined
RolePermissions[UserRole.MODERATOR] = [
  ...RolePermissions[UserRole.USER],
  Permission.CREATE_APARTMENTS,
  Permission.UPDATE_APARTMENTS,
  Permission.EXPORT_APARTMENTS,
  Permission.CREATE_NOTIFICATIONS,
  Permission.CREATE_REPORTS
];

// Define admin permissions after MODERATOR is defined
RolePermissions[UserRole.ADMIN] = [
  ...RolePermissions[UserRole.MODERATOR],
  Permission.DELETE_APARTMENTS,
  Permission.READ_ALL_NOTIFICATIONS,
  Permission.READ_ALL_USERS,
  Permission.UPDATE_ALL_USERS,
  Permission.DELETE_ALL_USERS,
  Permission.MANAGE_ROLES,
  Permission.VIEW_AUDIT_LOGS,
  Permission.MANAGE_SYSTEM
];

export class RBACService {
  /**
   * Check if a user role has a specific permission
   */
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = RolePermissions[userRole];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a user can access a resource
   */
  static canAccess(userRole: UserRole, permissions: Permission | Permission[]): boolean {
    const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
    return permissionsArray.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(userRole: UserRole): Permission[] {
    return RolePermissions[userRole] || [];
  }

  /**
   * Check if user can access another user's data
   */
  static canAccessUserData(currentUserId: string, targetUserId: string, userRole: UserRole): boolean {
    // Users can always access their own data
    if (currentUserId === targetUserId) {
      return true;
    }
    
    // Admins can access any user's data
    if (userRole === UserRole.ADMIN) {
      return true;
    }
    
    return false;
  }
}

export default RBACService;