import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { COPY_MESSAGES } from "../../constants/messages/library/copy.message.js";
import { AppError } from "../app-error.helper.js";
import * as copyRepository from "../../repositories/library/copy.repository.js";

export async function findOwnedCopyOrThrow(copyId, schoolId) {
    const copy = await copyRepository.findById(copyId);

    if (!copy || copy.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, COPY_MESSAGES.NOT_FOUND);
    }

    return copy;
}

export async function ensureCopyNumberIsAvailable(schoolId, copyNumber) {
    if (!copyNumber) {
        return;
    }

    const existing = await copyRepository.findByCopyNumber(schoolId, copyNumber);
    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, COPY_MESSAGES.DUPLICATE_COPY_NUMBER);
    }
}
