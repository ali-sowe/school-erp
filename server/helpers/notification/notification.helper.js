import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { NOTIFICATION_MESSAGES } from "../../constants/messages/notification/notification.message.js";
import { AppError } from "../app-error.helper.js";
import * as notificationRepository from "../../repositories/notification/notification.repository.js";

// A notification belongs to exactly one recipient — checked against both
// school and user_id, not just school, so one user can never read or mark
// another user's notification just by guessing an id (same tenant-ownership
// pattern as findOwnedStudentOrThrow etc., narrowed one level further since
// this resource is personal, not school-wide).
export async function findOwnedNotificationOrThrow(id, schoolId, userId) {
    const notification = await notificationRepository.findById(id);

    if (!notification || notification.school_id !== schoolId || notification.user_id !== userId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, NOTIFICATION_MESSAGES.NOT_FOUND);
    }

    return notification;
}
