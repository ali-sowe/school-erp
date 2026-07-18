import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TERM_MESSAGES } from "../../constants/messages/term/term.message.js";
import { AppError } from "../app-error.helper.js";
import * as termRepository from "../../repositories/term/term.repository.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";

export async function ensureTermDoesNotExist(academicYearId, name) {
    const existing = await termRepository.findByNameInYear(academicYearId, name);

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

export async function findAcademicYearOrThrow(academicYearId) {
    const academicYear = await academicYearRepository.findById(academicYearId);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TERM_MESSAGES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
}
