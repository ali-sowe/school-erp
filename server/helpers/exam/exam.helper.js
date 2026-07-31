import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXAM_MESSAGES } from "../../constants/messages/exam/exam.message.js";
import { AppError } from "../app-error.helper.js";
import * as examRepository from "../../repositories/exam/exam.repository.js";
import * as subjectRepository from "../../repositories/subject/subject.repository.js";
import * as termRepository from "../../repositories/term/term.repository.js";

export async function ensureExamDoesNotExist(classId, academicYearId, name) {
    const existing = await examRepository.findByNameInScope(classId, academicYearId, name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, EXAM_MESSAGES.DUPLICATE_NAME);
    }
}

export function validateDateRange(startDate, endDate) {
    if (startDate > endDate) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.INVALID_DATE_RANGE);
    }
}

// Same tenant-ownership check used throughout the codebase.
export async function findOwnedExamOrThrow(examId, schoolId) {
    const exam = await examRepository.findById(examId);

    if (!exam || exam.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXAM_MESSAGES.NOT_FOUND);
    }

    return exam;
}

export async function findOwnedSubjectOrThrow(subjectId, schoolId) {
    const subject = await subjectRepository.findById(subjectId);

    if (!subject || subject.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXAM_MESSAGES.SUBJECT_NOT_FOUND);
    }

    return subject;
}

// A term belongs to a specific academic year (see term.repository.js) — an
// exam's term must match its own academic_year_id, or "Term 1" from one
// year could silently attach itself to a different year's exam.
export async function findOwnedTermInAcademicYearOrThrow(termId, academicYearId, schoolId) {
    const term = await termRepository.findById(termId);

    if (!term || term.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXAM_MESSAGES.TERM_NOT_FOUND);
    }

    if (term.academic_year_id !== academicYearId) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.TERM_NOT_IN_ACADEMIC_YEAR);
    }

    return term;
}
