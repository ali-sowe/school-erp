import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { BORROW_MESSAGES } from "../../constants/messages/library/borrow.message.js";
import { AppError } from "../app-error.helper.js";
import * as borrowRepository from "../../repositories/library/borrow.repository.js";

export async function findOwnedBorrowRecordOrThrow(id, schoolId) {
    const record = await borrowRepository.findById(id);

    if (!record || record.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, BORROW_MESSAGES.NOT_FOUND);
    }

    return record;
}

// due_date/borrowed_date arrive already coerced to native Date objects by
// Joi.date() in the validation middleware (see academic-year.validation.js
// for the same pattern) — compared here as Dates, not strings.
export function validateBorrowDates(borrowedDate, dueDate) {
    if (new Date(dueDate) < new Date(borrowedDate)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.DUE_DATE_BEFORE_BORROWED_DATE);
    }
}

// from/to here come from query-string filters (?from=&to=), not Joi-coerced
// body fields, so they're compared as plain ISO ("YYYY-MM-DD") strings,
// which sort correctly lexicographically (same as attendance.helper.js).
export function validateDateRange(from, to) {
    if (from && to && from > to) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.INVALID_DATE_RANGE);
    }
}
