import * as examResultRepository from "../../repositories/exam/exam-result.repository.js";
import * as examSubjectRepository from "../../repositories/exam/exam-subject.repository.js";
import * as enrollmentRepository from "../../repositories/student/enrollment.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXAM_RESULT_MESSAGES } from "../../constants/messages/exam/exam-result.message.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";
import { transaction } from "../../database/transaction.js";
import { findOwnedExamOrThrow } from "../../helpers/exam/exam.helper.js";
import { findOwnedStudentOrThrow } from "../../helpers/student/student.helper.js";
import {
    validateNoDuplicateStudentsInBatch,
    validateScore,
    findOwnedExamResultOrThrow
} from "../../helpers/exam/exam-result.helper.js";

// Records (or corrects) a whole subject's scores for an exam in one atomic
// batch — same all-or-nothing shape as attendance.service.js's markAttendance.
// Existing rows for a student/subject/exam are updated in place rather than
// duplicated (uq_exam_results is unique per exam+subject+student).
export async function recordResults(examId, data, schoolId, userId = null) {
    const exam = await findOwnedExamOrThrow(examId, schoolId);

    if (exam.status !== "ONGOING") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_RESULT_MESSAGES.EXAM_NOT_ONGOING);
    }

    const examSubject = await examSubjectRepository.findMapping(examId, data.subject_id);
    if (!examSubject) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_RESULT_MESSAGES.SUBJECT_NOT_IN_EXAM);
    }

    validateNoDuplicateStudentsInBatch(data.entries);

    // Only students actually on this exam's class roster for the exam's
    // academic year can have results recorded — same guard attendance uses.
    const roster = await enrollmentRepository.findRoster(exam.class_id, exam.academic_year_id, 'ACTIVE');
    const rosterStudentIds = new Set(roster.map((entry) => entry.id));

    const notEnrolled = data.entries
        .map((entry) => entry.student_id)
        .filter((studentId) => !rosterStudentIds.has(studentId));

    if (notEnrolled.length > 0) {
        throw new AppError(
            HTTP_STATUS.BAD_REQUEST,
            EXAM_RESULT_MESSAGES.STUDENTS_NOT_ENROLLED,
            notEnrolled.map((studentId) => `Student ${studentId} is not enrolled in this exam's class for this academic year.`)
        );
    }

    for (const entry of data.entries) {
        validateScore(entry.score, Number(examSubject.max_score));
    }

    const auditEntries = await transaction(async (connection) => {
        const results = [];

        for (const entry of data.entries) {
            const existing = await examResultRepository.findByStudentSubjectExam(entry.student_id, data.subject_id, examId);

            if (existing) {
                const newRemarks = entry.remarks !== undefined ? entry.remarks : existing.remarks;
                // existing.score comes back as a string (DECIMAL column, no
                // decimalNumbers config) — normalize before diffing, or a
                // resubmission of the same score always looks "changed".
                const normalizedExisting = { ...existing, score: Number(existing.score) };
                const changes = getChangedFields(normalizedExisting, { ...normalizedExisting, score: entry.score, remarks: newRemarks });

                if (Object.keys(changes.oldValues).length === 0) {
                    continue;
                }

                await examResultRepository.update(existing.id, { score: entry.score, remarks: entry.remarks }, connection);

                results.push({
                    action: 'UPDATED',
                    entityId: existing.id,
                    oldValues: changes.oldValues,
                    newValues: changes.newValues
                });
            } else {
                const id = await examResultRepository.create(
                    {
                        school_id: schoolId,
                        exam_id: examId,
                        subject_id: data.subject_id,
                        student_id: entry.student_id,
                        score: entry.score,
                        max_score: examSubject.max_score,
                        remarks: entry.remarks ?? null,
                        recorded_by: userId
                    },
                    connection
                );

                results.push({
                    action: 'CREATED',
                    entityId: id,
                    newValues: { score: entry.score, remarks: entry.remarks ?? null }
                });
            }
        }

        return results;
    });

    // Audit logging happens after the transaction commits, same as every
    // other service in this codebase.
    for (const entry of auditEntries) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "ExamResult",
            entityId: entry.entityId,
            action: entry.action,
            oldValues: entry.oldValues ?? null,
            newValues: entry.newValues,
            reason: entry.action === 'CREATED' ? "Exam result recorded" : "Exam result corrected",
            performedBy: userId
        });
    }

    return await examResultRepository.findForExam(examId, data.subject_id);
}

export async function getResultsForExam(examId, subjectId, schoolId) {
    await findOwnedExamOrThrow(examId, schoolId);
    return await examResultRepository.findForExam(examId, subjectId ?? null);
}

export async function getStudentResults(studentId, filters, schoolId) {
    await findOwnedStudentOrThrow(studentId, schoolId);
    return await examResultRepository.findForStudent(studentId, filters);
}

// Corrects a single already-recorded entry. Only allowed while the exam is
// ONGOING, matching attendance's "correct while it's still live" philosophy
// — a COMPLETED exam must be reopened first (exam.service.js's reopenExam),
// so every post-finalization correction leaves an audit trail on the exam
// itself, not just the individual result.
export async function updateExamResult(id, data, schoolId, userId = null) {
    const result = await findOwnedExamResultOrThrow(id, schoolId);
    const exam = await findOwnedExamOrThrow(result.exam_id, schoolId);

    if (exam.status !== "ONGOING") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_RESULT_MESSAGES.CANNOT_EDIT_UNLESS_ONGOING);
    }

    if (data.score !== undefined) {
        validateScore(data.score, Number(result.max_score));
    }

    // Same string-vs-number normalization as recordResults, above.
    const normalizedResult = { ...result, score: Number(result.score) };
    const changes = getChangedFields(normalizedResult, { ...normalizedResult, ...data });

    if (Object.keys(changes.oldValues).length === 0) {
        return result;
    }

    await examResultRepository.update(id, data);
    const updatedResult = await examResultRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ExamResult",
        entityId: id,
        action: "UPDATED",
        oldValues: changes.oldValues,
        newValues: changes.newValues,
        reason: "Exam result corrected",
        performedBy: userId
    });

    return updatedResult;
}

// Per-subject stats for an exam — mirrors attendance's class summary.
export async function getExamSummary(examId, schoolId) {
    await findOwnedExamOrThrow(examId, schoolId);

    const stats = await examResultRepository.getSubjectStats(examId);

    return stats.map((row) => ({
        subject_id: row.subject_id,
        result_count: Number(row.result_count),
        average_score: row.average_score !== null ? Number(row.average_score) : null,
        lowest_score: row.lowest_score !== null ? Number(row.lowest_score) : null,
        highest_score: row.highest_score !== null ? Number(row.highest_score) : null
    }));
}
