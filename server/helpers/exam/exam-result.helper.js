import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXAM_RESULT_MESSAGES } from "../../constants/messages/exam/exam-result.message.js";
import { AppError } from "../app-error.helper.js";
import * as examResultRepository from "../../repositories/exam/exam-result.repository.js";

export function validateNoDuplicateStudentsInBatch(entries) {
    const seen = new Set();

    for (const entry of entries) {
        if (seen.has(entry.student_id)) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_RESULT_MESSAGES.DUPLICATE_STUDENT_IN_BATCH);
        }
        seen.add(entry.student_id);
    }
}

export function validateScore(score, maxScore) {
    if (score < 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_RESULT_MESSAGES.INVALID_SCORE);
    }

    if (score > maxScore) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_RESULT_MESSAGES.SCORE_EXCEEDS_MAX);
    }
}

// Same tenant-ownership check used throughout the codebase.
export async function findOwnedExamResultOrThrow(id, schoolId) {
    const result = await examResultRepository.findById(id);

    if (!result || result.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXAM_RESULT_MESSAGES.NOT_FOUND);
    }

    return result;
}
