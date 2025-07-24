import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserCreateInput, UserUpdateInput, AlertPreferences } from '../models/User';
import { sendSMS } from '../utils/smsUtils';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class UsersController {
  // Register user phone number
  async registerUser(req: Request, res: Response) {
    try {
      const { phoneNumber, alertPrefs }: UserCreateInput = req.body;

      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (user) {
        if (user.isVerified) {
          return res.status(409).json({ error: 'Phone number already registered and verified' });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            phoneNumber,
            alertPrefs: alertPrefs || {},
          },
        });
      }

      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Update user with verification code
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode },
      });

      // Send SMS verification
      const message = `Your AI Apartment Rental Agent verification code is: ${verificationCode}`;
      await sendSMS(phoneNumber, message);

      logger.info(`Verification code sent to ${phoneNumber}`);

      res.json({
        message: 'Verification code sent successfully',
        userId: user.id,
      });
    } catch (error) {
      logger.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verify user phone number
  async verifyUser(req: Request, res: Response) {
    try {
      const { phoneNumber, verificationCode } = req.body;

      const user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.verificationCode !== verificationCode) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Mark user as verified and clear verification code
      const verifiedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationCode: null,
        },
      });

      // Send welcome SMS
      const welcomeMessage = 'Welcome to AI Apartment Rental Agent! You will now receive daily updates about new apartment listings.';
      await sendSMS(phoneNumber, welcomeMessage);

      res.json({
        message: 'Phone number verified successfully',
        user: {
          id: verifiedUser.id,
          phoneNumber: verifiedUser.phoneNumber,
          isVerified: verifiedUser.isVerified,
          alertPrefs: verifiedUser.alertPrefs,
        },
      });
    } catch (error) {
      logger.error('Error verifying user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Resend verification code
  async resendVerification(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.body;

      const user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ error: 'User already verified' });
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Update user with new verification code
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode },
      });

      // Send SMS verification
      const message = `Your AI Apartment Rental Agent verification code is: ${verificationCode}`;
      await sendSMS(phoneNumber, message);

      res.json({ message: 'Verification code resent successfully' });
    } catch (error) {
      logger.error('Error resending verification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user profile
  async getUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          savedApartments: {
            include: { apartment: true },
            orderBy: { createdAt: 'desc' },
          },
          notifications: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
        alertPrefs: user.alertPrefs,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        savedApartmentsCount: user.savedApartments.length,
        notificationsCount: user.notifications.length,
        recentNotifications: user.notifications,
        savedApartments: user.savedApartments.map(saved => ({
          ...saved,
          apartment: {
            ...saved.apartment,
            price: saved.apartment.price / 100,
          },
        })),
      });
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update user alert preferences
  async updateAlertPreferences(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { alertPrefs }: { alertPrefs: AlertPreferences } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { alertPrefs },
      });

      res.json({
        message: 'Alert preferences updated successfully',
        alertPrefs: user.alertPrefs,
      });
    } catch (error) {
      logger.error('Error updating alert preferences:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Save apartment for user
  async saveApartment(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { apartmentId, notes, priority, status } = req.body;

      const savedApartment = await prisma.savedApartment.upsert({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId,
          },
        },
        update: {
          notes,
          priority,
          status,
        },
        create: {
          userId,
          apartmentId,
          notes,
          priority: priority || 'medium',
          status: status || 'interested',
        },
        include: {
          apartment: true,
        },
      });

      res.json({
        message: 'Apartment saved successfully',
        savedApartment: {
          ...savedApartment,
          apartment: {
            ...savedApartment.apartment,
            price: savedApartment.apartment.price / 100,
          },
        },
      });
    } catch (error) {
      logger.error('Error saving apartment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Remove saved apartment
  async removeSavedApartment(req: Request, res: Response) {
    try {
      const { userId, apartmentId } = req.params;

      await prisma.savedApartment.delete({
        where: {
          userId_apartmentId: {
            userId,
            apartmentId,
          },
        },
      });

      res.json({ message: 'Apartment removed from saved list' });
    } catch (error) {
      logger.error('Error removing saved apartment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all users (admin endpoint)
  async getAllUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, verified } = req.query;

      const filters: any = {};
      if (verified !== undefined) {
        filters.isVerified = verified === 'true';
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: filters,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                savedApartments: true,
                notifications: true,
              },
            },
          },
        }),
        prisma.user.count({ where: filters }),
      ]);

      res.json({
        users,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Unsubscribe user
  async unsubscribeUser(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.params;

      const user = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update alert preferences to disable all notifications
      await prisma.user.update({
        where: { id: user.id },
        data: {
          alertPrefs: {
            enableSMS: false,
            enableEmail: false,
            enablePush: false,
            dailyDigest: false,
            instantAlerts: false,
            priceDropAlerts: false,
            newListingAlerts: false,
          },
        },
      });

      // Send confirmation SMS
      const message = 'You have been unsubscribed from AI Apartment Rental Agent alerts. Text SUBSCRIBE to re-enable.';
      await sendSMS(phoneNumber, message);

      res.json({ message: 'User unsubscribed successfully' });
    } catch (error) {
      logger.error('Error unsubscribing user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new UsersController();