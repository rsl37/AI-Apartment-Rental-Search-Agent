import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { EncryptionService } from './encryptionService';

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerification {
  isValid: boolean;
  usedBackupCode?: boolean;
}

export class MFAService {
  private static readonly APP_NAME = 'AI Apartment Rental Agent';
  
  /**
   * Generate a new MFA secret for a user
   */
  static async generateSecret(userIdentifier: string): Promise<MFASetup> {
    const secret = speakeasy.generateSecret({
      name: userIdentifier,
      issuer: this.APP_NAME,
      length: 32
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify MFA token
   */
  static verifyToken(secret: string, token: string, window: number = 2): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window // Allow tokens from 2 steps before and after current time
    });
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(encryptedBackupCodes: string[], providedCode: string): { isValid: boolean; remainingCodes: string[] } {
    try {
      // Decrypt backup codes
      const backupCodes = encryptedBackupCodes.map(code => EncryptionService.decrypt(code));
      
      // Check if provided code exists
      const codeIndex = backupCodes.indexOf(providedCode);
      
      if (codeIndex === -1) {
        return { isValid: false, remainingCodes: encryptedBackupCodes };
      }

      // Remove used backup code
      const updatedCodes = [...backupCodes];
      updatedCodes.splice(codeIndex, 1);

      // Encrypt remaining codes
      const encryptedRemainingCodes = updatedCodes.map(code => EncryptionService.encrypt(code));

      return { isValid: true, remainingCodes: encryptedRemainingCodes };
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return { isValid: false, remainingCodes: encryptedBackupCodes };
    }
  }

  /**
   * Generate backup codes
   */
  private static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Encrypt and store backup codes
   */
  static encryptBackupCodes(backupCodes: string[]): string[] {
    return backupCodes.map(code => EncryptionService.encrypt(code));
  }

  /**
   * Generate new backup codes (for when user runs out)
   */
  static generateNewBackupCodes(): string[] {
    return this.generateBackupCodes();
  }

  /**
   * Check if MFA is required based on risk assessment
   */
  static shouldRequireMFA(req: any): boolean {
    // Implement risk-based MFA logic
    const suspiciousIndicators = [
      // New IP address
      !this.isKnownIP(req.ip),
      // New user agent
      !this.isKnownUserAgent(req.get('User-Agent')),
      // Login from different country/region
      // Note: This would require IP geolocation service
    ];

    // Require MFA if any suspicious indicators are present
    return suspiciousIndicators.some(indicator => indicator);
  }

  /**
   * Check if IP is known (simplified implementation)
   */
  private static isKnownIP(ip: string): boolean {
    // In production, this would check against a database of known IPs for the user
    // For now, return false to always require MFA
    return false;
  }

  /**
   * Check if user agent is known (simplified implementation)
   */
  private static isKnownUserAgent(userAgent: string): boolean {
    // In production, this would check against known user agents for the user
    // For now, return false to always require MFA
    return false;
  }

  /**
   * Generate time-based token for testing
   */
  static generateTestToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32'
    });
  }
}

export default MFAService;