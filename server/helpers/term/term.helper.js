import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TERM_MESSAGES } from "../../constants/messages/term/term.message.js";
import { AppError } from "../app-error.helper.js";
import * as termRepository from "../../repositories/term/term.repository.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";

export async function ensureTermDoesNotExist(schoolId, academicYearId, name) {
    const existing = await termRepository.findByNameInYear(schoolId, academicYearId, name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, TERM_MESSAGES.DUPLICATE_NAME);
    }
}

export function validateTermDates(startDate, endDate) {
    if (startDate >= endDate) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.INVALID_DATE_RANGE);
    }
}

// A term is one part of an academic year, so it can never be scheduled
// outside the boundaries of the year that contains it (Gambian context doc:
// terms are a subdivision of the academic year, not an independent concept).
export async function ensureTermFitsWithinAcademicYear(academicYear, startDate, endDate) {
    const termStart = new Date(startDate);
    const termEnd = new Date(endDate);
    const yearStart = new Date(academicYear.start_date);
    const yearEnd = new Date(academicYear.end_date);

    if (termStart < yearStart || termEnd > yearEnd) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.OUTSIDE_ACADEMIC_YEAR);
    }
}

// Verifies the academic year exists AND belongs to the requesting school —
// same tenant-ownership check as academic-year.service.js's
// findOwnedAcademicYearOrThrow, so a term can never be attached to (or leak
// the existence of) another school's academic year.
export async function findOwnedAcademicYearOrThrow(academicYearId, schoolId) {
    const academicYear = await academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TERM_MESSAGES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
}
