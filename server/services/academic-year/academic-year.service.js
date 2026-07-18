import { ensureAcademicYearDoesNotExist, validateAcademicYearDates } from "../../helpers/academic-year/academic-year.helper.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { ACADEMIC_YEAR_MESSAGES } from "../../constants/messages/academic-year/academic-year.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createAcademicYear(data, schoolId, userId = null) {
    validateAcademicYearDates(data.start_date, data.end_date);

    await ensureAcademicYearDoesNotExist(schoolId, data.name);

    const id = await academicYearRepository.create({ ...data, school_id: schoolId }, userId);

    return await academicYearRepository.findById(id);
}

export async function getAcademicYears(schoolId) {
    return await academicYearRepository.findAll(schoolId);
}

// Every read of a specific academic year is tenant-checked here, so no
// caller can accidentally leak another school's record just by guessing an id.
async function findOwnedAcademicYearOrThrow(id, schoolId) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear || academicYear.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND);
    }

    return academicYear;
}

export async function getAcademicYearById(id, schoolId) {
    return await findOwnedAcademicYearOrThrow(id, schoolId);
}

export async function updateAcademicYear(id, data, schoolId, userId = null) {
    const academicYear = await findOwnedAcademicYearOrThrow(id, schoolId);

    if (academicYear.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_EDIT_COMPLETED);
    }

    if (data.start_date && data.end_date) {
        validateAcademicYearDates(data.start_date, data.end_date);
    }

    if (data.name && data.name !== academicYear.name) {
        const existingAcademicYear = await academicYearRepository.findByName(schoolId, data.name);
        if (existingAcademicYear && existingAcademicYear.id !== academicYear.id) {
            throw new AppError(HTTP_STATUS.CONFLICT, ACADEMIC_YEAR_MESSAGES.DUPLICATE_NAME);
        }
    }

    await academicYearRepository.update(id, data);

    const updatedAcademicYear = await academicYearRepository.findById(id);
    const changes = getChangedFields(academicYear, updatedAcademicYear);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "AcademicYear",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Academic year information updated",
            performedBy: userId
        });
    }

    return updatedAcademicYear;
}

export async function activateAcademicYear(id, schoolId, userId = null) {
    const academicYear = await findOwnedAcademicYearOrThrow(id, schoolId);

    if (academicYear.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_ACTIVATE_COMPLETED);
    }

    if (academicYear.status === "ACTIVE") {
        return academicYear;
    }

    const currentlyActive = await academicYearRepository.findActive(schoolId);
    if (currentlyActive && currentlyActive.id !== academicYear.id) {
        throw new AppError(HTTP_STATUS.CONFLICT, ACADEMIC_YEAR_MESSAGES.ONLY_ONE_ACTIVE);
    }

    const today = new Date();
    if (new Date(academicYear.start_date) > today) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_ACTIVATE_FUTURE);
    }

    await academicYearRepository.activate(id);

    const updatedAcademicYear = await academicYearRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "AcademicYear",
        entityId: id,
        action: "ACTIVATED",
        oldValues: { status: academicYear.status },
        newValues: { status: updatedAcademicYear.status },
        reason: "Academic year manually activated",
        performedBy: userId
    });

    return updatedAcademicYear;
}

export async function completeAcademicYear(id, schoolId, userId = null) {
    const academicYear = await findOwnedAcademicYearOrThrow(id, schoolId);

    if (academicYear.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_COMPLETE_INACTIVE);
    }

    await academicYearRepository.complete(id);

    const completedAcademicYear = await academicYearRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "AcademicYear",
        entityId: id,
        action: "COMPLETED",
        oldValues: { status: academicYear.status },
        newValues: { status: completedAcademicYear.status },
        reason: "Academic year completed",
        performedBy: userId
    });

    return completedAcademicYear;
}

export async function overrideAcademicYear(id, payload, schoolId, userId = null) {
    const academicYear = await findOwnedAcademicYearOrThrow(id, schoolId);

    if (academicYear.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_EDIT_COMPLETED);
    }

    const overrideData = {
        status: academicYear.status,
        actual_start_date: payload.actual_start_date ?? academicYear.actual_start_date,
        actual_end_date: payload.actual_end_date ?? academicYear.actual_end_date,
        reason: payload.reason ?? null
    };

    await academicYearRepository.updateLifecycle(id, overrideData);

    const updatedAcademicYear = await academicYearRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "AcademicYear",
        entityId: id,
        action: "OVERRIDDEN",
        oldValues: {
            status: academicYear.status,
            actual_start_date: academicYear.actual_start_date,
            actual_end_date: academicYear.actual_end_date
        },
        newValues: {
            status: updatedAcademicYear.status,
            actual_start_date: updatedAcademicYear.actual_start_date,
            actual_end_date: updatedAcademicYear.actual_end_date
        },
        reason: payload.reason || ACADEMIC_YEAR_MESSAGES.OVERRIDE_REQUIRED,
        performedBy: userId
    });

    return updatedAcademicYear;
}
