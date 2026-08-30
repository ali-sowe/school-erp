import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ATTENDANCE_MESSAGES } from "../../constants/messages/attendance/attendance.message.js";
import { AppError } from "../app-error.helper.js";
import * as attendanceRepository from "../../repositories/attendance/attendance.repository.js";

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

// Same tenant-ownership pattern used throughout (student.helper.js,
// enrollment.helper.js): every read of a specific attendance record is
// checked here so no caller can leak another school's record by guessing an id.
export async function findOwnedAttendanceRecordOrThrow(id, schoolId) {
    const record = await attendanceRepository.findById(id);

    if (!record || record.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ATTENDANCE_MESSAGES.NOT_FOUND);
    }

    return record;
}

// `date` arrives already coerced to a native Date object by
// Joi.date().iso() in the validation middleware (same as start_date/end_date
// elsewhere — see academic-year.validation.js) — compared here as a Date
// against "now", the same simple comparison activateAcademicYear/activateTerm
// already use for their own "not in the future" checks.
export function validateAttendanceDate(date) {
    if (new Date(date) > new Date()) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ATTENDANCE_MESSAGES.FUTURE_DATE_NOT_ALLOWED);
    }
}

// from/to here come from query-string filters (?from=&to=), not Joi-coerced
// body fields, so they're compared as plain ISO ("YYYY-MM-DD") strings —
// which sort correctly lexicographically.
export function validateDateRange(from, to) {
    if (from && to && from > to) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ATTENDANCE_MESSAGES.INVALID_DATE_RANGE);
    }
}

// markAttendance processes data.entries one at a time inside the
// transaction, so two entries for the same student would silently run as
// two sequential updates (the second just overwriting the first) rather
// than failing loudly — that's a client bug (duplicate rows in the
// roster payload) worth rejecting up front instead of masking it.
export function validateNoDuplicateEntries(entries) {
    const seen = new Set();
    const duplicates = new Set();

    for (const entry of entries) {
        if (seen.has(entry.student_id)) {
            duplicates.add(entry.student_id);
        }
        seen.add(entry.student_id);
    }

    if (duplicates.size > 0) {
        throw new AppError(
            HTTP_STATUS.BAD_REQUEST,
            ATTENDANCE_MESSAGES.DUPLICATE_STUDENT_ENTRIES,
            [...duplicates].map((studentId) => `Student ${studentId} appears more than once in the entries list.`)
        );
    }
}
