import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { SUBJECT_MESSAGES } from "../../constants/messages/subject/subject.message.js";
import { AppError } from "../app-error.helper.js";
import * as subjectRepository from "../../repositories/subject/subject.repository.js";

export async function ensureSubjectDoesNotExist(schoolId, name, code) {
    const existingByName = await subjectRepository.findByName(schoolId, name);
    if (existingByName) {
        throw new AppError(HTTP_STATUS.CONFLICT, SUBJECT_MESSAGES.DUPLICATE_NAME);
    }

    const existingByCode = await subjectRepository.findByCode(schoolId, code);
    if (existingByCode) {
        throw new AppError(HTTP_STATUS.CONFLICT, SUBJECT_MESSAGES.DUPLICATE_CODE);
    }
}
