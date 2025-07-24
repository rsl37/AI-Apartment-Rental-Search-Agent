import { Router } from 'express';
import notificationsController from '../controllers/notificationsController';

const router = Router();

// GET /api/notifications/users/:userId - Get user notifications
router.get('/users/:userId', notificationsController.getUserNotifications.bind(notificationsController));

// GET /api/notifications/users/:userId/stats - Get notification stats
router.get('/users/:userId/stats', notificationsController.getStats.bind(notificationsController));

// POST /api/notifications - Send notification
router.post('/', notificationsController.sendNotification.bind(notificationsController));

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', notificationsController.markAsRead.bind(notificationsController));

export default router;