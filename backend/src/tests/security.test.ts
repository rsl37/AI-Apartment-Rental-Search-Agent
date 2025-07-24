import { EncryptionService } from '../utils/encryptionService';
import { MFAService } from '../utils/mfaService';
import { RBACService, UserRole, Permission } from '../utils/rbacService';

describe('Security Features', () => {
  describe('EncryptionService', () => {
    test('should encrypt and decrypt data correctly', () => {
      const testData = 'sensitive information';
      const encrypted = EncryptionService.encrypt(testData);
      const decrypted = EncryptionService.decrypt(encrypted);
      
      expect(encrypted).not.toBe(testData);
      expect(decrypted).toBe(testData);
    });

    test('should mask sensitive data in logs', () => {
      const userData = {
        phoneNumber: '+1234567890',
        email: 'user@example.com',
        name: 'John Doe'
      };
      
      const masked = EncryptionService.maskSensitiveData(userData);
      expect(masked.phoneNumber).toBe('+12***90');
      expect(masked.email).toBe('us***@example.com');
      expect(masked.name).toBe('John Doe');
    });

    test('should hash data consistently', () => {
      const testData = 'password123';
      const hash1 = EncryptionService.hash(testData);
      const hash2 = EncryptionService.hash(testData);
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(testData);
    });
  });

  describe('MFAService', () => {
    test('should generate valid MFA setup', async () => {
      const userId = 'test-user-123';
      const mfaSetup = await MFAService.generateSecret(userId);
      
      expect(mfaSetup.secret).toBeDefined();
      expect(mfaSetup.qrCodeUrl).toContain('data:image/png;base64,');
      expect(mfaSetup.backupCodes).toHaveLength(10);
      expect(mfaSetup.backupCodes[0]).toMatch(/^[A-Z0-9]{8}$/);
    });

    test('should verify TOTP tokens correctly', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      
      // Generate a token for the current time
      const token = MFAService.generateTestToken(secret);
      
      // Verify the token
      const isValid = MFAService.verifyToken(secret, token);
      expect(isValid).toBe(true);
    });

    test('should encrypt and decrypt backup codes', () => {
      const backupCodes = ['ABCD1234', 'EFGH5678', 'IJKL9012'];
      const encrypted = MFAService.encryptBackupCodes(backupCodes);
      
      expect(encrypted).toHaveLength(3);
      expect(encrypted[0]).not.toBe(backupCodes[0]);
      
      // Verify we can decrypt them back
      const decrypted = encrypted.map(code => EncryptionService.decrypt(code));
      expect(decrypted).toEqual(backupCodes);
    });
  });

  describe('RBACService', () => {
    test('should correctly assign permissions to roles', () => {
      // Test USER role permissions
      expect(RBACService.hasPermission(UserRole.USER, Permission.READ_OWN_PROFILE)).toBe(true);
      expect(RBACService.hasPermission(UserRole.USER, Permission.DELETE_APARTMENTS)).toBe(false);
      
      // Test ADMIN role permissions
      expect(RBACService.hasPermission(UserRole.ADMIN, Permission.READ_OWN_PROFILE)).toBe(true);
      expect(RBACService.hasPermission(UserRole.ADMIN, Permission.DELETE_APARTMENTS)).toBe(true);
      expect(RBACService.hasPermission(UserRole.ADMIN, Permission.MANAGE_SYSTEM)).toBe(true);
    });

    test('should allow users to access their own data', () => {
      const userId = 'user-123';
      const canAccess = RBACService.canAccessUserData(userId, userId, UserRole.USER);
      expect(canAccess).toBe(true);
    });

    test('should prevent users from accessing other users data', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const canAccess = RBACService.canAccessUserData(userId1, userId2, UserRole.USER);
      expect(canAccess).toBe(false);
    });

    test('should allow admins to access any user data', () => {
      const adminId = 'admin-123';
      const userId = 'user-456';
      const canAccess = RBACService.canAccessUserData(adminId, userId, UserRole.ADMIN);
      expect(canAccess).toBe(true);
    });

    test('should correctly check multiple permissions', () => {
      const permissions = [Permission.READ_APARTMENTS, Permission.CREATE_APARTMENTS];
      
      expect(RBACService.canAccess(UserRole.USER, permissions)).toBe(true); // Has READ_APARTMENTS
      expect(RBACService.canAccess(UserRole.MODERATOR, permissions)).toBe(true); // Has both
    });
  });
});