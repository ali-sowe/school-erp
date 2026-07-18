import { ensureGradeLevelDoesNotExist, ensureEducationLevelIsConfigured } from "../../helpers/grade-level/grade-level.helper.js";
import * as gradeLevelRepository from "../../repositories/grade-level/grade-level.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { GRADE_LEVEL_MESSAGES } from "../../constants/messages/grade-level/grade-level.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createGradeLevel(data, schoolId, userId = null) {
    await ensureEducationLevelIsConfigured(schoolId, data.education_level);
    await ensureGradeLevelDoesNotExist(schoolId, data.name);

    const id = await gradeLevelRepository.create({ ...data, school_id: schoolId }, userId);

    return await gradeLevelRepository.findById(id);
}

export async function getGradeLevels(schoolId, status) {
    return await gradeLevelRepository.findAll(schoolId, status);
}

// Every read of a specific grade level is tenant-checked here, so no caller
// can accidentally leak another school's record just by guessing an id.
async function findOwnedGradeLevelOrThrow(id, schoolId) {
    const gradeLevel = await gradeLevelRepository.findById(id);

    if (!gradeLevel || gradeLevel.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, GRADE_LEVEL_MESSAGES.NOT_FOUND);
    }

    return gradeLevel;
}

export async function getGradeLevelById(id, schoolId) {
    return await findOwnedGradeLevelOrThrow(id, schoolId);
}

export async function updateGradeLevel(id, data, schoolId, userId = null) {
    const gradeLevel = await findOwnedGradeLevelOrThrow(id, schoolId);

    if (gradeLevel.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GRADE_LEVEL_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    if (data.education_level && data.education_level !== gradeLevel.education_level) {
        await ensureEducationLevelIsConfigured(schoolId, data.education_level);
    }

    if (data.name && data.name !== gradeLevel.name) {
        const existing = await gradeLevelRepository.findByName(schoolId, data.name);
        if (existing && existing.id !== gradeLevel.id) {
            throw new AppError(HTTP_STATUS.CONFLICT, GRADE_LEVEL_MESSAGES.DUPLICATE_NAME);
        }
    }

    await gradeLevelRepository.update(id, data);

    const updatedGradeLevel = await gradeLevelRepository.findById(id);
    const changes = getChangedFields(gradeLevel, updatedGradeLevel);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "GradeLevel",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Grade level information updated",
            performedBy: userId
        });
    }

    return updatedGradeLevel;
}

export async function archiveGradeLevel(id, schoolId, userId = null) {
    const gradeLevel = await findOwnedGradeLevelOrThrow(id, schoolId);

    if (gradeLevel.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GRADE_LEVEL_MESSAGES.ALREADY_ARCHIVED);
    }

    await gradeLevelRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "GradeLevel",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: gradeLevel.status },
        newValues: { status: "ARCHIVED" },
        reason: "Grade level archived",
        performedBy: userId
    });

    return await gradeLevelRepository.findById(id);
}

export async function restoreGradeLevel(id, schoolId, userId = null) {
    const gradeLevel = await findOwnedGradeLevelOrThrow(id, schoolId);

    if (gradeLevel.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GRADE_LEVEL_MESSAGES.ALREADY_ACTIVE);
    }

    await gradeLevelRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "GradeLevel",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: gradeLevel.status },
        newValues: { status: "ACTIVE" },
        reason: "Grade level restored",
        performedBy: userId
    });

    return await gradeLevelRepository.findById(id);
}
