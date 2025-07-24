import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationCreateInput, NotificationUpdateInput } from '../models/Notification';
import { sendSMS } from '../utils/smsUtils';
import logger from '../config/logger';

const prisma = new PrismaClient();

export class NotificationsController {
  // Get notifications for a user
  async getUserNotifications(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, type, status } = req.query;

      const filters: any = { userId };
      if (type) filters.type = type;
      if (status) filters.status = status;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: filters,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.notification.count({ where: filters }),
      ]);

      res.json({
        notifications,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send notification
  async sendNotification(req: Request, res: Response) {
    try {
      const data: NotificationCreateInput = req.body;

      const notification = await prisma.notification.create({
        data,
      });

      // Send based on type
      if (data.type === 'sms') {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
        });

        if (user?.isVerified) {
          await sendSMS(user.phoneNumber, data.message);
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: 'sent', sentAt: new Date() },
          });
        }
      }

      res.status(201).json(notification);
    } catch (error) {
      logger.error('Error sending notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Mark notification as read
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.notification.update({
        where: { id },
        data: { status: 'delivered', deliveredAt: new Date() },
      });

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get notification stats
  async getStats(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const stats = await prisma.notification.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      });

      const total = await prisma.notification.count({ where: { userId } });

      const formattedStats: any = {
        total,
        pending: stats.find(s => s.status === 'pending')?._count.status || 0,
        sent: stats.find(s => s.status === 'sent')?._count.status || 0,
        delivered: stats.find(s => s.status === 'delivered')?._count.status || 0,
        failed: stats.find(s => s.status === 'failed')?._count.status || 0,
      };

      formattedStats.deliveryRate = total > 0 
        ? (formattedStats.delivered / total) * 100 
        : 0;

      res.json(formattedStats);
    } catch (error) {
      logger.error('Error fetching notification stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new NotificationsController();