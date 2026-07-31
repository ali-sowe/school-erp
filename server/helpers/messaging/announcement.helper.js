import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ANNOUNCEMENT_MESSAGES } from "../../constants/messages/messaging/announcement.message.js";
import { AppError } from "../app-error.helper.js";
import * as announcementRepository from "../../repositories/messaging/announcement.repository.js";
import { findOwnedGradeLevelOrThrow } from "../class/class.helper.js";
import { findOwnedClassOrThrow } from "../student/enrollment.helper.js";

const VALID_AUDIENCE_TYPES = ['SCHOOL', 'GRADE_LEVEL', 'CLASS'];

// Confirms audience_type/audience_id are internally consistent AND that the
// referenced grade level or class actually belongs to this school — the
// same ownership guarantee every other module gives its own related
// entities, applied here to "who this announcement is for."
export async function validateAudience(audienceType, audienceId, schoolId) {
    if (!VALID_AUDIENCE_TYPES.includes(audienceType)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ANNOUNCEMENT_MESSAGES.INVALID_AUDIENCE_TYPE);
    }

    if (audienceType === 'SCHOOL') {
        if (audienceId) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, ANNOUNCEMENT_MESSAGES.AUDIENCE_ID_NOT_ALLOWED);
        }
        return;
    }

    if (!audienceId) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ANNOUNCEMENT_MESSAGES.AUDIENCE_ID_REQUIRED);
    }

    if (audienceType === 'GRADE_LEVEL') {
        await findOwnedGradeLevelOrThrow(audienceId, schoolId);
        return;
    }

    // audienceType === 'CLASS'
    await findOwnedClassOrThrow(audienceId, schoolId);
}

export async function findOwnedAnnouncementOrThrow(id, schoolId) {
    const announcement = await announcementRepository.findById(id);

    if (!announcement || announcement.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ANNOUNCEMENT_MESSAGES.NOT_FOUND);
    }

    return announcement;
}
