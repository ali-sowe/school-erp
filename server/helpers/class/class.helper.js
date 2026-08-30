import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CLASS_MESSAGES } from "../../constants/messages/class/class.message.js";
import { AppError } from "../app-error.helper.js";
import * as classRepository from "../../repositories/class/class.repository.js";
import * as gradeLevelRepository from "../../repositories/grade-level/grade-level.repository.js";
import * as subjectRepository from "../../repositories/subject/subject.repository.js";

export async function ensureClassDoesNotExist(gradeLevelId, name) {
    const existing = await classRepository.findByNameInGradeLevel(gradeLevelId, name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, CLASS_MESSAGES.DUPLICATE_NAME);
    }
}

// Verifies the grade level exists AND belongs to the requesting school —
// same tenant-ownership check as term.helper.js's findOwnedAcademicYearOrThrow,
// so a class can never be attached to (or leak the existence of) another
// school's grade level.
export async function findOwnedGradeLevelOrThrow(gradeLevelId, schoolId) {
    const gradeLevel = await gradeLevelRepository.findById(gradeLevelId);

    if (!gradeLevel || gradeLevel.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CLASS_MESSAGES.GRADE_LEVEL_NOT_FOUND);
    }

    return gradeLevel;
}

// Same tenant-ownership check, for subjects being assigned to a class.
export async function findOwnedSubjectOrThrow(subjectId, schoolId) {
    const subject = await subjectRepository.findById(subjectId);

    if (!subject || subject.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CLASS_MESSAGES.SUBJECT_NOT_FOUND);
    }

    return subject;
}
