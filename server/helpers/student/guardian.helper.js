import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { GUARDIAN_MESSAGES } from "../../constants/messages/student/guardian.message.js";
import { AppError } from "../app-error.helper.js";
import * as guardianRepository from "../../repositories/student/guardian.repository.js";

export async function findOwnedGuardianOrThrow(guardianId, schoolId) {
    const guardian = await guardianRepository.findById(guardianId);

    if (!guardian || guardian.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, GUARDIAN_MESSAGES.NOT_FOUND);
    }

    return guardian;
}
