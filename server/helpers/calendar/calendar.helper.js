import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CALENDAR_MESSAGES } from "../../constants/messages/calendar/calendar.message.js";
import { AppError } from "../app-error.helper.js";
import * as calendarRepository from "../../repositories/calendar/calendar.repository.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";

// Same tenant-ownership pattern used throughout (student.helper.js,
// attendance.helper.js): every read of a specific calendar event is
// checked here so no caller can leak another school's record by guessing
// an id.
export async function findOwnedCalendarEventOrThrow(id, schoolId) {
    const event = await calendarRepository.findById(id);

    if (!event || event.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CALENDAR_MESSAGES.NOT_FOUND);
    }

    return event;
}

// Kept as its own copy here rather than a shared import, same reasoning as
// every other module that needs this check (fee-structure.helper.js,
// enrollment.helper.js, expense.helper.js, term.helper.js, ...) — small
// enough that duplicating it beats the Calendar module reaching into the
// Academic Years module's helpers for something this size.
export async function findOwnedAcademicYearOrThrow(academicYearId, schoolId) {
    const academicYear = await academicYearRepository.findById(academicYearId);

    if (!academicYear || academicYear.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CALENDAR_MESSAGES.NOT_FOUND);
    }

    return academicYear;
}

// start_date/end_date arrive already coerced to Date objects by
// Joi.date().iso() in the validation middleware (same as academic-year.
// validation.js) — a single-day event is start === end, never start > end.
export function validateDateRange(startDate, endDate) {
    if (new Date(startDate) > new Date(endDate)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CALENDAR_MESSAGES.INVALID_DATE_RANGE);
    }
}
