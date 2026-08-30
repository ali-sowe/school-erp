import * as classTeacherRepository from "../../repositories/teacher/class-teacher.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CLASS_TEACHER_MESSAGES } from "../../constants/messages/teacher/class-teacher.message.js";
import { findActiveOwnedTeacherOrThrow } from "../../helpers/teacher/teacher-assignment.helper.js";
import { findOwnedClassOrThrow, resolveAcademicYearId } from "../../helpers/student/enrollment.helper.js";

async function findOwnedClassTeacherOrThrow(id, schoolId) {
    const assignment = await classTeacherRepository.findById(id);

    if (!assignment || assignment.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CLASS_TEACHER_MESSAGES.NOT_FOUND);
    }

    return assignment;
}

// Assigns the homeroom/form teacher for a class for an academic year. Same
// create-vs-reassign shape as teacher-subject-assignment.service.js's
// assignTeacher: one row per (class, year), updated in place when the
// class teacher changes.
export async function assignClassTeacher(data, schoolId, userId = null) {
    const teacher = await findActiveOwnedTeacherOrThrow(data.teacher_id, schoolId);
    const classRecord = await findOwnedClassOrThrow(data.class_id, schoolId);
    const academicYearId = await resolveAcademicYearId(data.academic_year_id, schoolId);

    const existing = await classTeacherRepository.findByClassAndYear(classRecord.id, academicYearId);

    if (!existing) {
        const id = await classTeacherRepository.create(
            {
                school_id: schoolId,
                class_id: classRecord.id,
                teacher_id: teacher.id,
                academic_year_id: academicYearId
            },
            userId
        );

        await auditRepository.createAuditLog({
            schoolId,
            entityType: "ClassTeacher",
            entityId: id,
            action: "ASSIGNED",
            newValues: { class_id: classRecord.id, teacher_id: teacher.id, academic_year_id: academicYearId },
            reason: "Class teacher assigned",
            performedBy: userId
        });

        return await classTeacherRepository.findById(id);
    }

    if (existing.status === 'ENDED') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_TEACHER_MESSAGES.ALREADY_ENDED);
    }

    if (existing.teacher_id === teacher.id) {
        return existing;
    }

    await classTeacherRepository.updateTeacher(existing.id, teacher.id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ClassTeacher",
        entityId: existing.id,
        action: "REASSIGNED",
        oldValues: { teacher_id: existing.teacher_id },
        newValues: { teacher_id: teacher.id },
        reason: "Class teacher reassigned",
        performedBy: userId
    });

    return await classTeacherRepository.findById(existing.id);
}

export async function getClassTeacher(classId, academicYearId, schoolId) {
    await findOwnedClassOrThrow(classId, schoolId);
    const resolvedAcademicYearId = await resolveAcademicYearId(academicYearId, schoolId);

    const assignment = await classTeacherRepository.findByClassAndYear(classId, resolvedAcademicYearId);

    if (!assignment) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CLASS_TEACHER_MESSAGES.NOT_FOUND);
    }

    return assignment;
}

export async function getClassesForTeacher(teacherId, schoolId) {
    await findActiveOwnedTeacherOrThrow(teacherId, schoolId);
    return await classTeacherRepository.findForTeacher(teacherId);
}

export async function endClassTeacherAssignment(id, schoolId, userId = null) {
    const assignment = await findOwnedClassTeacherOrThrow(id, schoolId);

    if (assignment.status === 'ENDED') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_TEACHER_MESSAGES.ALREADY_ENDED);
    }

    await classTeacherRepository.setStatus(id, 'ENDED');

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ClassTeacher",
        entityId: id,
        action: "ENDED",
        oldValues: { status: assignment.status },
        newValues: { status: 'ENDED' },
        reason: "Class teacher assignment ended",
        performedBy: userId
    });

    return await classTeacherRepository.findById(id);
}
