import * as notificationService from "../../services/notification/notification.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { NOTIFICATION_MESSAGES } from "../../constants/messages/notification/notification.message.js";

// GET /api/notifications?is_read=&limit=&before_id=
export const getNotifications = asyncHandler(
    async (req, res) => {
        const notifications = await notificationService.getNotificationsForUser(req.user.userId, {
            isRead: req.query.is_read === undefined ? undefined : req.query.is_read === 'true',
            limit: req.query.limit ? Number(req.query.limit) : undefined,
            beforeId: req.query.before_id ? Number(req.query.before_id) : undefined
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: NOTIFICATION_MESSAGES.FETCHED_ALL,
            data: notifications
        });
    }
);

// GET /api/notifications/unread-count
export const getUnreadCount = asyncHandler(
    async (req, res) => {
        const count = await notificationService.getUnreadCount(req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: NOTIFICATION_MESSAGES.UNREAD_COUNT_FETCHED,
            data: { count }
        });
    }
);

// PATCH /api/notifications/:id/read
export const markAsRead = asyncHandler(
    async (req, res) => {
        const notification = await notificationService.markAsRead(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: NOTIFICATION_MESSAGES.MARKED_AS_READ,
            data: notification
        });
    }
);

// PATCH /api/notifications/read-all
export const markAllAsRead = asyncHandler(
    async (req, res) => {
        await notificationService.markAllAsRead(req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: NOTIFICATION_MESSAGES.ALL_MARKED_AS_READ,
            data: null
        });
    }
);
