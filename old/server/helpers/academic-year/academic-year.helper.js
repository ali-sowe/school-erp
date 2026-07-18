import { HTTP_STATUS } from "../../constants/httpstatus.js";
import { ACADEMIC_YEAR_MESSAGES } from "../../constants/messages/academic-year/academic-year.message.js";
import { AppError } from "../app-error.helper.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";

export async function ensureAcademicYearDoesNotExist(name) {
    // Query database
    const existing = await academicYearRepository.findByName(name);

    // Throw error if found
    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, ACADEMIC_YEAR_MESSAGES.DUPLICATE_NAME);
    }
}

export function validateAcademicYearDates(startDate, endDate) {
    if (startDate >= endDate) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.INVALID_DATE_RANGE)
    }
}