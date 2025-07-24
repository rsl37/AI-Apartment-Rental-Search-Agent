import { Router } from 'express';
import usersController from '../controllers/usersController';

const router = Router();

// POST /api/users/register - Register phone number
router.post('/register', usersController.registerUser.bind(usersController));

// POST /api/users/verify - Verify phone number
router.post('/verify', usersController.verifyUser.bind(usersController));

// POST /api/users/resend-verification - Resend verification code
router.post('/resend-verification', usersController.resendVerification.bind(usersController));

// GET /api/users - Get all users (admin)
router.get('/', usersController.getAllUsers.bind(usersController));

// GET /api/users/:id - Get user profile
router.get('/:id', usersController.getUserProfile.bind(usersController));

// PUT /api/users/:id/preferences - Update alert preferences
router.put('/:id/preferences', usersController.updateAlertPreferences.bind(usersController));

// POST /api/users/:userId/saved-apartments - Save apartment
router.post('/:userId/saved-apartments', usersController.saveApartment.bind(usersController));

// DELETE /api/users/:userId/saved-apartments/:apartmentId - Remove saved apartment
router.delete('/:userId/saved-apartments/:apartmentId', usersController.removeSavedApartment.bind(usersController));

// POST /api/users/:phoneNumber/unsubscribe - Unsubscribe user
router.post('/:phoneNumber/unsubscribe', usersController.unsubscribeUser.bind(usersController));

export default router;