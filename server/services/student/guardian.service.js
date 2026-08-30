import { findOwnedGuardianOrThrow } from "../../helpers/student/guardian.helper.js";
import { findOwnedStudentOrThrow } from "../../helpers/student/student.helper.js";
import * as guardianRepository from "../../repositories/student/guardian.repository.js";
import * as studentGuardianRepository from "../../repositories/student/student-guardian.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { GUARDIAN_MESSAGES } from "../../constants/messages/student/guardian.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createGuardian(data, schoolId, userId = null) {
    const id = await guardianRepository.create({ ...data, school_id: schoolId }, userId);
    return await guardianRepository.findById(id);
}

export async function getGuardians(schoolId, filters) {
    return await guardianRepository.findAll(schoolId, filters);
}

export async function getGuardianById(id, schoolId) {
    return await findOwnedGuardianOrThrow(id, schoolId);
}

export async function updateGuardian(id, data, schoolId, userId = null) {
    const guardian = await findOwnedGuardianOrThrow(id, schoolId);

    if (guardian.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GUARDIAN_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    await guardianRepository.update(id, data);

    const updatedGuardian = await guardianRepository.findById(id);
    const changes = getChangedFields(guardian, updatedGuardian);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Guardian",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Guardian information updated",
            performedBy: userId
        });
    }

    return updatedGuardian;
}

export async function archiveGuardian(id, schoolId, userId = null) {
    const guardian = await findOwnedGuardianOrThrow(id, schoolId);

    if (guardian.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GUARDIAN_MESSAGES.ALREADY_ARCHIVED);
    }

    await guardianRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Guardian",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: guardian.status },
        newValues: { status: "ARCHIVED" },
        reason: "Guardian archived",
        performedBy: userId
    });

    return await guardianRepository.findById(id);
}

export async function restoreGuardian(id, schoolId, userId = null) {
    const guardian = await findOwnedGuardianOrThrow(id, schoolId);

    if (guardian.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GUARDIAN_MESSAGES.ALREADY_ACTIVE);
    }

    await guardianRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Guardian",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: guardian.status },
        newValues: { status: "ACTIVE" },
        reason: "Guardian restored",
        performedBy: userId
    });

    return await guardianRepository.findById(id);
}

// --- Student linking ---
// A guardian can be linked to more than one student (siblings) and a
// student can have more than one guardian — see student_guardians in schema.js.

export async function linkGuardianToStudent(studentId, guardianId, linkData, schoolId, userId = null) {
    const student = await findOwnedStudentOrThrow(studentId, schoolId);
    const guardian = await findOwnedGuardianOrThrow(guardianId, schoolId);

    if (student.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GUARDIAN_MESSAGES.STUDENT_ARCHIVED);
    }

    if (guardian.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GUARDIAN_MESSAGES.GUARDIAN_ARCHIVED);
    }

    const existingLink = await studentGuardianRepository.findLink(studentId, guardianId);
    if (existingLink && existingLink.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.CONFLICT, GUARDIAN_MESSAGES.ALREADY_LINKED);
    }

    await studentGuardianRepository.create(studentId, guardianId, linkData, userId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: studentId,
        action: "GUARDIAN_LINKED",
        newValues: { guardian_id: guardianId, relationship: linkData.relationship },
        reason: "Guardian linked to student",
        performedBy: userId
    });

    return await studentGuardianRepository.findGuardiansForStudent(studentId);
}

export async function unlinkGuardianFromStudent(studentId, guardianId, schoolId, userId = null) {
    await findOwnedStudentOrThrow(studentId, schoolId);
    const guardian = await findOwnedGuardianOrThrow(guardianId, schoolId);

    const existingLink = await studentGuardianRepository.findLink(studentId, guardianId);
    if (!existingLink) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, GUARDIAN_MESSAGES.NOT_LINKED);
    }

    await studentGuardianRepository.remove(studentId, guardianId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: studentId,
        action: "GUARDIAN_UNLINKED",
        oldValues: { guardian_id: guardianId, guardian_name: `${guardian.first_name} ${guardian.last_name}` },
        reason: "Guardian unlinked from student",
        performedBy: userId
    });

    return await studentGuardianRepository.findGuardiansForStudent(studentId);
}

export async function getGuardiansForStudent(studentId, schoolId) {
    await findOwnedStudentOrThrow(studentId, schoolId);
    return await studentGuardianRepository.findGuardiansForStudent(studentId);
}

export async function getStudentsForGuardian(guardianId, schoolId) {
    await findOwnedGuardianOrThrow(guardianId, schoolId);
    return await studentGuardianRepository.findStudentsForGuardian(guardianId);
}
