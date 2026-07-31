import {
    ensureExamDoesNotExist,
    validateDateRange,
    findOwnedExamOrThrow,
    findOwnedSubjectOrThrow,
    findOwnedTermInAcademicYearOrThrow
} from "../../helpers/exam/exam.helper.js";
import { findOwnedClassOrThrow, resolveAcademicYearId } from "../../helpers/student/enrollment.helper.js";
import * as examRepository from "../../repositories/exam/exam.repository.js";
import * as examSubjectRepository from "../../repositories/exam/exam-subject.repository.js";
import * as examResultRepository from "../../repositories/exam/exam-result.repository.js";
import * as classSubjectRepository from "../../repositories/class/class-subject.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { EXAM_MESSAGES } from "../../constants/messages/exam/exam.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createExam(data, schoolId, userId = null) {
    const classRecord = await findOwnedClassOrThrow(data.class_id, schoolId);
    const academicYearId = await resolveAcademicYearId(data.academic_year_id, schoolId);
    await findOwnedTermInAcademicYearOrThrow(data.term_id, academicYearId, schoolId);

    validateDateRange(data.planned_start_date, data.planned_end_date);
    await ensureExamDoesNotExist(classRecord.id, academicYearId, data.name);

    const id = await examRepository.create(
        { ...data, class_id: classRecord.id, academic_year_id: academicYearId },
        userId
    );

    return await examRepository.findById(id);
}

export async function getExams(schoolId, filters) {
    return await examRepository.findAll(schoolId, filters);
}

export async function getExamById(id, schoolId) {
    return await findOwnedExamOrThrow(id, schoolId);
}

export async function updateExam(id, data, schoolId, userId = null) {
    const exam = await findOwnedExamOrThrow(id, schoolId);

    if (exam.status !== "SCHEDULED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_EDIT_STARTED);
    }

    const newStart = data.planned_start_date ?? exam.planned_start_date;
    const newEnd = data.planned_end_date ?? exam.planned_end_date;
    if (data.planned_start_date || data.planned_end_date) {
        validateDateRange(newStart, newEnd);
    }

    if (data.name && data.name !== exam.name) {
        await ensureExamDoesNotExist(exam.class_id, exam.academic_year_id, data.name);
    }

    await examRepository.update(id, data);

    const updatedExam = await examRepository.findById(id);
    const changes = getChangedFields(exam, updatedExam);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Exam",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Exam details updated",
            performedBy: userId
        });
    }

    return updatedExam;
}

// --- Subject curriculum for this exam ---
// Folded into this service rather than a separate file, same as class.service.js
// folds in class-subject management.

export async function addExamSubject(examId, subjectId, maxScore, schoolId, userId = null) {
    const exam = await findOwnedExamOrThrow(examId, schoolId);

    if (exam.status !== "SCHEDULED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_MODIFY_SUBJECTS_AFTER_START);
    }

    const subject = await findOwnedSubjectOrThrow(subjectId, schoolId);

    // An exam can only examine subjects the class actually studies.
    const classSubjectMapping = await classSubjectRepository.findMapping(exam.class_id, subject.id);
    if (!classSubjectMapping || classSubjectMapping.status !== 'ACTIVE') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.SUBJECT_NOT_TAUGHT_IN_CLASS);
    }

    if (!(maxScore > 0)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.INVALID_MAX_SCORE);
    }

    const existing = await examSubjectRepository.findMapping(examId, subject.id);
    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, EXAM_MESSAGES.SUBJECT_ALREADY_ADDED);
    }

    await examSubjectRepository.create(examId, subject.id, maxScore, userId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Exam",
        entityId: examId,
        action: "SUBJECT_ADDED",
        newValues: { subject_id: subject.id, max_score: maxScore },
        reason: "Subject added to exam",
        performedBy: userId
    });

    return await examSubjectRepository.findSubjectsForExam(examId);
}

export async function removeExamSubject(examId, subjectId, schoolId, userId = null) {
    const exam = await findOwnedExamOrThrow(examId, schoolId);

    if (exam.status !== "SCHEDULED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_MODIFY_SUBJECTS_AFTER_START);
    }

    const existing = await examSubjectRepository.findMapping(examId, subjectId);
    if (!existing) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, EXAM_MESSAGES.SUBJECT_NOT_IN_EXAM);
    }

    const resultCount = await examResultRepository.countForExamSubject(examId, subjectId);
    if (resultCount > 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_REMOVE_SUBJECT_WITH_RESULTS);
    }

    await examSubjectRepository.remove(examId, subjectId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Exam",
        entityId: examId,
        action: "SUBJECT_REMOVED",
        oldValues: { subject_id: subjectId },
        reason: "Subject removed from exam",
        performedBy: userId
    });

    return await examSubjectRepository.findSubjectsForExam(examId);
}

export async function getExamSubjects(examId, schoolId) {
    await findOwnedExamOrThrow(examId, schoolId);
    return await examSubjectRepository.findSubjectsForExam(examId);
}

// --- Lifecycle: SCHEDULED -> ONGOING -> COMPLETED ---
// Same planned-vs-actual, audited transition pattern as academic-year.service.js.

export async function startExam(id, schoolId, userId = null) {
    const exam = await findOwnedExamOrThrow(id, schoolId);

    if (exam.status !== "SCHEDULED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_START_UNSCHEDULED);
    }

    const subjectCount = await examSubjectRepository.countForExam(id);
    if (subjectCount === 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_START_WITHOUT_SUBJECTS);
    }

    const today = new Date().toISOString().split("T")[0];
    await examRepository.setLifecycle(id, { status: "ONGOING", actual_start_date: today });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Exam",
        entityId: id,
        action: "STARTED",
        oldValues: { status: exam.status },
        newValues: { status: "ONGOING" },
        reason: "Exam started",
        performedBy: userId
    });

    return await examRepository.findById(id);
}

export async function completeExam(id, schoolId, userId = null) {
    const exam = await findOwnedExamOrThrow(id, schoolId);

    if (exam.status !== "ONGOING") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_COMPLETE_UNSTARTED);
    }

    const today = new Date().toISOString().split("T")[0];
    await examRepository.setLifecycle(id, { status: "COMPLETED", actual_end_date: today });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Exam",
        entityId: id,
        action: "COMPLETED",
        oldValues: { status: exam.status },
        newValues: { status: "COMPLETED" },
        reason: "Exam completed",
        performedBy: userId
    });

    return await examRepository.findById(id);
}

// Reopening is an authorized override (Calendar Engine doc: "authorized
// overrides require a reason and an audit entry") — e.g. a marking error is
// found after results were finalized.
export async function reopenExam(id, reason, schoolId, userId = null) {
    const exam = await findOwnedExamOrThrow(id, schoolId);

    if (exam.status !== "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.CANNOT_REOPEN_UNCOMPLETED);
    }

    if (!reason) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, EXAM_MESSAGES.REOPEN_REASON_REQUIRED);
    }

    await examRepository.setLifecycle(id, { status: "ONGOING", reason });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Exam",
        entityId: id,
        action: "REOPENED",
        oldValues: { status: exam.status },
        newValues: { status: "ONGOING" },
        reason,
        performedBy: userId
    });

    return await examRepository.findById(id);
}
