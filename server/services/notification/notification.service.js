import * as notificationRepository from "../../repositories/notification/notification.repository.js";
import { findOwnedNotificationOrThrow } from "../../helpers/notification/notification.helper.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { NOTIFICATION_MESSAGES } from "../../constants/messages/notification/notification.message.js";
import { emitToUser } from "../../helpers/realtime/realtime.helper.js";

// The one function every other module calls to notify someone — persists
// one row per recipient, then pushes it live to whoever's connected.
// Persisting first means a recipient who's offline still finds it in their
// inbox later; the socket push is a convenience on top, not the source of
// truth (same order sendMessage/createAnnouncement already use for their
// own realtime events).
//
// type is a short machine tag ('MESSAGE', 'ANNOUNCEMENT', ...) so the
// frontend can pick an icon/route without parsing the title. related_entity_*
// lets the frontend link straight to what triggered it (e.g. the
// conversation or announcement) without a schema change per module.
export async function notifyUsers(userIds, { schoolId, type, title, body, relatedEntityType, relatedEntityId, triggeredBy } = {}) {
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
        return [];
    }

    const notifications = [];

    for (const userId of uniqueUserIds) {
        const id = await notificationRepository.create({
            school_id: schoolId,
            user_id: userId,
            type,
            title,
            body: body ?? null,
            related_entity_type: relatedEntityType ?? null,
            related_entity_id: relatedEntityId ?? null,
            triggered_by: triggeredBy ?? null
        });

        const notification = await notificationRepository.findById(id);
        notifications.push(notification);

        // emitToUsers (used elsewhere for a genuinely shared payload, e.g. a
        // chat message every participant should see) would send this exact
        // same array — including every other recipient's notification id,
        // user_id, and content — to each of them. These rows are private
        // per recipient, so each user gets only their own via emitToUser.
        emitToUser(userId, 'notification:new', [notification]);
    }

    return notifications;
}

export async function getNotificationsForUser(userId, filters) {
    return await notificationRepository.findForUser(userId, filters);
}

export async function getUnreadCount(userId) {
    return await notificationRepository.countUnreadForUser(userId);
}

export async function markAsRead(id, schoolId, userId) {
    const notification = await findOwnedNotificationOrThrow(id, schoolId, userId);

    if (notification.is_read) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, NOTIFICATION_MESSAGES.ALREADY_READ);
    }

    await notificationRepository.markAsRead(id);

    return await notificationRepository.findById(id);
}

export async function markAllAsRead(userId) {
    await notificationRepository.markAllAsReadForUser(userId);
}
