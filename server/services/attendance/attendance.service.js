import * as attendanceRepository from "../../repositories/attendance/attendance.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ATTENDANCE_MESSAGES } from "../../constants/messages/attendance/attendance.message.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";
import { transaction } from "../../database/transaction.js";
import {
    findOwnedAttendanceRecordOrThrow,
    validateAttendanceDate,
    validateDateRange
} from "../../helpers/attendance/attendance.helper.js";
import { findOwnedStudentOrThrow } from "../../helpers/student/student.helper.js";
import {
    findOwnedClassOrThrow,
    resolveAcademicYearId
} from "../../helpers/student/enrollment.helper.js";
import * as enrollmentRepository from "../../repositories/student/enrollment.repository.js";

// Marks (or corrects) attendance for every student listed, for one class on
// one day, as a single atomic operation — either the whole day's roster is
// recorded or none of it is, so a mid-batch failure can never leave a class
// half-marked. Existing records for that student/date are updated in place
// (attendance_date is unique per student) rather than duplicated.
export async function markAttendance(classId, data, schoolId, userId = null) {
    const classRecord = await findOwnedClassOrThrow(classId, schoolId);

    if (classRecord.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ATTENDANCE_MESSAGES.CLASS_ARCHIVED);
    }

    validateAttendanceDate(data.date);

    const academicYearId = await resolveAcademicYearId(data.academic_year_id, schoolId);

    // Only students actively enrolled in this class for the resolved
    // academic year can be marked — this also protects against marking
    // attendance for a student who was withdrawn/transferred out.
    const roster = await enrollmentRepository.findRoster(classId, academicYearId, 'ACTIVE');
    const rosterStudentIds = new Set(roster.map((entry) => entry.id));

    const notEnrolled = data.entries
        .map((entry) => entry.student_id)
        .filter((studentId) => !rosterStudentIds.has(studentId));

    if (notEnrolled.length > 0) {
        throw new AppError(
            HTTP_STATUS.BAD_REQUEST,
            ATTENDANCE_MESSAGES.STUDENTS_NOT_ENROLLED,
            notEnrolled.map((studentId) => `Student ${studentId} is not enrolled in this class for the resolved academic year.`)
        );
    }

    const auditEntries = await transaction(async (connection) => {
        const results = [];

        for (const entry of data.entries) {
            const existing = await attendanceRepository.findByStudentAndDate(entry.student_id, data.date);

            if (existing) {
                const newRemarks = entry.remarks !== undefined ? entry.remarks : existing.remarks;
                const changes = getChangedFields(existing, { ...existing, status: entry.status, remarks: newRemarks });

                if (Object.keys(changes.oldValues).length === 0) {
                    continue;
                }

                await attendanceRepository.update(existing.id, { status: entry.status, remarks: entry.remarks }, connection);

                results.push({
                    action: 'UPDATED',
                    entityId: existing.id,
                    studentId: entry.student_id,
                    oldValues: changes.oldValues,
                    newValues: changes.newValues
                });
            } else {
                const id = await attendanceRepository.create(
                    {
                        school_id: schoolId,
                        student_id: entry.student_id,
                        class_id: classId,
                        academic_year_id: academicYearId,
                        attendance_date: data.date,
                        status: entry.status,
                        remarks: entry.remarks ?? null,
                        recorded_by: userId
                    },
                    connection
                );

                results.push({
                    action: 'CREATED',
                    entityId: id,
                    studentId: entry.student_id,
                    newValues: { status: entry.status, remarks: entry.remarks ?? null }
                });
            }
        }

        return results;
    });

    // Audit logging happens after the transaction commits, same as every
    // other service in this codebase (student.service.js, enrollment.service.js) —
    // the data write is the atomic unit; audit is a best-effort record of it.
    for (const entry of auditEntries) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Attendance",
            entityId: entry.entityId,
            action: entry.action,
            oldValues: entry.oldValues ?? null,
            newValues: entry.newValues,
            reason: entry.action === 'CREATED' ? "Attendance recorded" : "Attendance corrected",
            performedBy: userId
        });
    }

    return await attendanceRepository.findRosterWithAttendance(classId, academicYearId, data.date);
}

// Full class roster for a given day, joined with whatever attendance has
// been recorded so far — students not yet marked come back with a null
// status rather than being left off the list.
export async function getClassAttendanceForDate(classId, date, academicYearId, schoolId) {
    await findOwnedClassOrThrow(classId, schoolId);
    const resolvedAcademicYearId = await resolveAcademicYearId(academicYearId, schoolId);

    return await attendanceRepository.findRosterWithAttendance(classId, resolvedAcademicYearId, date);
}

export async function getStudentAttendanceHistory(studentId, { from, to } = {}, schoolId) {
    await findOwnedStudentOrThrow(studentId, schoolId);
    validateDateRange(from, to);

    return await attendanceRepository.findForStudent(studentId, { from, to });
}

// Corrects a single already-recorded entry (e.g. a teacher marked the wrong
// status). Only status/remarks are editable here — student_id, class_id,
// and attendance_date are the record's identity and aren't meant to change
// after the fact; re-marking under a different class/day is a new entry.
export async function updateAttendanceRecord(id, data, schoolId, userId = null) {
    const record = await findOwnedAttendanceRecordOrThrow(id, schoolId);

    const changes = getChangedFields(record, { ...record, ...data });

    if (Object.keys(changes.oldValues).length === 0) {
        return record;
    }

    await attendanceRepository.update(id, data);
    const updatedRecord = await attendanceRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Attendance",
        entityId: id,
        action: "UPDATED",
        oldValues: changes.oldValues,
        newValues: changes.newValues,
        reason: "Attendance corrected",
        performedBy: userId
    });

    return updatedRecord;
}

// Per-status totals for a class over a date range, for the kind of summary
// report school leadership/parents need (Gambian Education System Context doc).
export async function getClassAttendanceSummary(classId, { from, to } = {}, schoolId) {
    await findOwnedClassOrThrow(classId, schoolId);
    validateDateRange(from, to);

    const rows = await attendanceRepository.getClassSummary(classId, { from, to });

    const summary = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    let total = 0;

    for (const row of rows) {
        summary[row.status] = Number(row.total);
        total += Number(row.total);
    }

    return { ...summary, TOTAL: total };
}
