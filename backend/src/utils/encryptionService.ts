import CryptoJS from 'crypto-js';
import { config } from '../config/env';

// Encryption key from environment or default (should be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || config.jwt.secret.padEnd(32, '0').substring(0, 32);

export class EncryptionService {
  /**
   * Encrypt sensitive data using AES-256
   */
  static encrypt(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    try {
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== 'string') {
      return encryptedText;
    }
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  static hash(text: string): string {
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    return CryptoJS.SHA256(text).toString();
  }

  /**
   * Encrypt phone numbers
   */
  static encryptPhoneNumber(phoneNumber: string): string {
    return this.encrypt(phoneNumber);
  }

  /**
   * Decrypt phone numbers
   */
  static decryptPhoneNumber(encryptedPhoneNumber: string): string {
    return this.decrypt(encryptedPhoneNumber);
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: any): any {
    if (typeof data === 'string') {
      // Mask phone numbers
      if (/^\+?[1-9]\d{1,14}$/.test(data)) {
        return data.substring(0, 3) + '***' + data.substring(data.length - 2);
      }
      // Mask email addresses
      if (data.includes('@')) {
        const [local, domain] = data.split('@');
        return local.substring(0, 2) + '***@' + domain;
      }
      return data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const masked = { ...data };
      const sensitiveFields = ['phoneNumber', 'email', 'password', 'token', 'secret'];
      
      for (const field of sensitiveFields) {
        if (masked[field]) {
          masked[field] = this.maskSensitiveData(masked[field]);
        }
      }
      
      return masked;
    }
    
    return data;
  }
}

export default EncryptionService;