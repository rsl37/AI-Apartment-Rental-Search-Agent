import twilio from 'twilio';
import { config } from '../config/env';
import logger from '../config/logger';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export const sendSMS = async (to: string, message: string): Promise<boolean> => {
  try {
    if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
      logger.warn('Twilio not configured, SMS not sent');
      return false;
    }

    const result = await client.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: to,
    });

    logger.info(`SMS sent successfully to ${to}, SID: ${result.sid}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send SMS to ${to}:`, error);
    return false;
  }
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  return phoneNumber; // Return as-is if already formatted
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatPhoneNumber(phoneNumber);
  const phoneRegex = /^\+1[0-9]{10}$/;
  return phoneRegex.test(formatted);
};