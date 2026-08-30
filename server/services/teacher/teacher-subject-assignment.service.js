import * as teacherSubjectAssignmentRepository from "../../repositories/teacher/teacher-subject-assignment.repository.js";
import * as classSubjectRepository from "../../repositories/class/class-subject.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TEACHER_SUBJECT_ASSIGNMENT_MESSAGES } from "../../constants/messages/teacher/teacher-subject-assignment.message.js";
import { findActiveOwnedTeacherOrThrow } from "../../helpers/teacher/teacher-assignment.helper.js";
import { findOwnedClassOrThrow, resolveAcademicYearId } from "../../helpers/student/enrollment.helper.js";
import { findOwnedSubjectOrThrow } from "../../helpers/class/class.helper.js";

async function findOwnedAssignmentOrThrow(id, schoolId) {
    const assignment = await teacherSubjectAssignmentRepository.findById(id);

    if (!assignment || assignment.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.NOT_FOUND);
    }

    return assignment;
}

// Assigns a teacher to teach a subject to a class for an academic year. If
// that class-subject-year slot is already assigned, this reassigns it in
// place (updates teacher_id, audit-logs the change) rather than creating a
// second, conflicting row — same "create vs reassign" decision enrollment
// makes for a student's yearly enrollment row.
export async function assignTeacher(data, schoolId, userId = null) {
    const teacher = await findActiveOwnedTeacherOrThrow(data.teacher_id, schoolId);
    const classRecord = await findOwnedClassOrThrow(data.class_id, schoolId);
    const subject = await findOwnedSubjectOrThrow(data.subject_id, schoolId);
    const academicYearId = await resolveAcademicYearId(data.academic_year_id, schoolId);

    const classSubjectMapping = await classSubjectRepository.findMapping(classRecord.id, subject.id);
    if (!classSubjectMapping || classSubjectMapping.status !== 'ACTIVE') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.SUBJECT_NOT_TAUGHT_IN_CLASS);
    }

    const existing = await teacherSubjectAssignmentRepository.findByClassSubjectYear(classRecord.id, subject.id, academicYearId);

    if (!existing) {
        const id = await teacherSubjectAssignmentRepository.create(
            {
                school_id: schoolId,
                teacher_id: teacher.id,
                class_id: classRecord.id,
                subject_id: subject.id,
                academic_year_id: academicYearId
            },
            userId
        );

        await auditRepository.createAuditLog({
            schoolId,
            entityType: "TeacherSubjectAssignment",
            entityId: id,
            action: "ASSIGNED",
            newValues: { teacher_id: teacher.id, class_id: classRecord.id, subject_id: subject.id, academic_year_id: academicYearId },
            reason: "Teacher assigned to class subject",
            performedBy: userId
        });

        return await teacherSubjectAssignmentRepository.findById(id);
    }

    if (existing.status === 'ENDED') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.ALREADY_ENDED);
    }

    if (existing.teacher_id === teacher.id) {
        return existing;
    }

    await teacherSubjectAssignmentRepository.updateTeacher(existing.id, teacher.id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "TeacherSubjectAssignment",
        entityId: existing.id,
        action: "REASSIGNED",
        oldValues: { teacher_id: existing.teacher_id },
        newValues: { teacher_id: teacher.id },
        reason: "Class subject reassigned to a different teacher",
        performedBy: userId
    });

    return await teacherSubjectAssignmentRepository.findById(existing.id);
}

export async function getAssignmentsForClass(classId, academicYearId, schoolId) {
    await findOwnedClassOrThrow(classId, schoolId);
    const resolvedAcademicYearId = await resolveAcademicYearId(academicYearId, schoolId);

    return await teacherSubjectAssignmentRepository.findForClass(classId, resolvedAcademicYearId);
}

export async function getAssignmentsForTeacher(teacherId, academicYearId, schoolId) {
    await findActiveOwnedTeacherOrThrow(teacherId, schoolId);
    return await teacherSubjectAssignmentRepository.findForTeacher(teacherId, academicYearId);
}

export async function endAssignment(id, schoolId, userId = null) {
    const assignment = await findOwnedAssignmentOrThrow(id, schoolId);

    if (assignment.status === 'ENDED') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.ALREADY_ENDED);
    }

    await teacherSubjectAssignmentRepository.setStatus(id, 'ENDED');

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "TeacherSubjectAssignment",
        entityId: id,
        action: "ENDED",
        oldValues: { status: assignment.status },
        newValues: { status: 'ENDED' },
        reason: "Teacher subject assignment ended",
        performedBy: userId
    });

    return await teacherSubjectAssignmentRepository.findById(id);
}
