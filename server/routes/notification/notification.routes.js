import { Router } from 'express';
import * as notificationController from '../../controllers/notification/notification.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

const router = Router();

// Every route here operates on the logged-in user's own inbox only (see
// notification.helper.js#findOwnedNotificationOrThrow) — there's no way to
// list or modify another user's notifications, so no id-scoped ownership
// param is needed beyond req.user.

router.get('/', authenticate, authorize(['notifications.read']), asyncHandler(notificationController.getNotifications));
router.get('/unread-count', authenticate, authorize(['notifications.read']), asyncHandler(notificationController.getUnreadCount));
router.patch('/read-all', authenticate, authorize(['notifications.write']), asyncHandler(notificationController.markAllAsRead));
router.patch('/:id/read', authenticate, authorize(['notifications.write']), asyncHandler(notificationController.markAsRead));

export default router;
