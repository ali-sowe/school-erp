import { ensureAcademicYearDoesNotExist, validateAcademicYearDates } from "../../helpers/academic-year/academic-year.helper.js";
import * as academicYearRepository from "../../repositories/academic-year/academic-year.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { ACADEMIC_YEAR_MESSAGES } from "../../constants/messages/academic-year/academic-year.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createAcademicYear(data, userId = null) {
    validateAcademicYearDates(data.start_date, data.end_date);

    await ensureAcademicYearDoesNotExist(data.name);

    const id = await academicYearRepository.create(data, userId);

    return await academicYearRepository.findById(id);
}

export async function getAcademicYears() {
    return await academicYearRepository.findAll();
}

export async function getAcademicYearById(id) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND);
    }

    return academicYear;
}

export async function updateAcademicYear(id, data, userId = null) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND);
    }

    if (academicYear.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_EDIT_COMPLETED);
    }

    if (data.start_date && data.end_date) {
        validateAcademicYearDates(data.start_date, data.end_date);
    }

    if (data.name && data.name !== academicYear.name) {
        const existingAcademicYear = await academicYearRepository.findByName(data.name);
        if (existingAcademicYear && existingAcademicYear.id !== id) {
            throw new AppError(HTTP_STATUS.CONFLICT, ACADEMIC_YEAR_MESSAGES.DUPLICATE_NAME);
        }
    }

    await academicYearRepository.update(id, data);

    const updatedAcademicYear = await academicYearRepository.findById(id);
    const changes = getChangedFields(academicYear, updatedAcademicYear);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
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

export async function activateAcademicYear(id, userId = null) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND);
    }

    if (academicYear.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_ACTIVATE_COMPLETED);
    }

    if (academicYear.status === "ACTIVE") {
        return academicYear;
    }

    const currentlyActive = await academicYearRepository.findActive();
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

export async function completeAcademicYear(id, userId = null) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND);
    }

    if (academicYear.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ACADEMIC_YEAR_MESSAGES.CANNOT_COMPLETE_INACTIVE);
    }

    await academicYearRepository.complete(id);

    const completedAcademicYear = await academicYearRepository.findById(id);

    await auditRepository.createAuditLog({
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

export async function overrideAcademicYear(id, payload, userId = null) {
    const academicYear = await academicYearRepository.findById(id);

    if (!academicYear) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, ACADEMIC_YEAR_MESSAGES.NOT_FOUND);
    }

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