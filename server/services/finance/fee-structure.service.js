import {
    ensureFeeStructureDoesNotExist,
    validateAmount,
    findOwnedFeeStructureOrThrow,
    findOwnedAcademicYearOrThrow,
    findOwnedGradeLevelOrThrow
} from "../../helpers/finance/fee-structure.helper.js";
import * as feeStructureRepository from "../../repositories/finance/fee-structure.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { FEE_STRUCTURE_MESSAGES } from "../../constants/messages/finance/fee-structure.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createFeeStructure(data, schoolId, userId = null) {
    await findOwnedAcademicYearOrThrow(data.academic_year_id, schoolId);

    if (data.grade_level_id) {
        await findOwnedGradeLevelOrThrow(data.grade_level_id, schoolId);
    }

    validateAmount(data.amount, FEE_STRUCTURE_MESSAGES.INVALID_AMOUNT);
    await ensureFeeStructureDoesNotExist(data.academic_year_id, data.grade_level_id ?? null, data.name);

    const id = await feeStructureRepository.create({ ...data, school_id: schoolId }, userId);

    return await feeStructureRepository.findById(id);
}

export async function getFeeStructures(schoolId, filters) {
    return await feeStructureRepository.findAll(schoolId, filters);
}

export async function getFeeStructureById(id, schoolId) {
    return await findOwnedFeeStructureOrThrow(id, schoolId);
}

export async function updateFeeStructure(id, data, schoolId, userId = null) {
    const feeStructure = await findOwnedFeeStructureOrThrow(id, schoolId);

    if (feeStructure.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, FEE_STRUCTURE_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    if (data.amount !== undefined) {
        validateAmount(data.amount, FEE_STRUCTURE_MESSAGES.INVALID_AMOUNT);
    }

    if (data.name && data.name !== feeStructure.name) {
        await ensureFeeStructureDoesNotExist(feeStructure.academic_year_id, feeStructure.grade_level_id, data.name);
    }

    await feeStructureRepository.update(id, data);

    const updatedFeeStructure = await feeStructureRepository.findById(id);
    const changes = getChangedFields(feeStructure, updatedFeeStructure);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "FeeStructure",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Fee structure updated",
            performedBy: userId
        });
    }

    return updatedFeeStructure;
}

export async function archiveFeeStructure(id, schoolId, userId = null) {
    const feeStructure = await findOwnedFeeStructureOrThrow(id, schoolId);

    if (feeStructure.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, FEE_STRUCTURE_MESSAGES.ALREADY_ARCHIVED);
    }

    await feeStructureRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "FeeStructure",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: feeStructure.status },
        newValues: { status: "ARCHIVED" },
        reason: "Fee structure archived",
        performedBy: userId
    });

    return await feeStructureRepository.findById(id);
}

export async function restoreFeeStructure(id, schoolId, userId = null) {
    const feeStructure = await findOwnedFeeStructureOrThrow(id, schoolId);

    if (feeStructure.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, FEE_STRUCTURE_MESSAGES.ALREADY_ACTIVE);
    }

    await feeStructureRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "FeeStructure",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: feeStructure.status },
        newValues: { status: "ACTIVE" },
        reason: "Fee structure restored",
        performedBy: userId
    });

    return await feeStructureRepository.findById(id);
}
