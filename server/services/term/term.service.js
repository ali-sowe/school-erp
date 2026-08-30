import {
    ensureTermDoesNotExist,
    validateTermDates,
    ensureTermFitsWithinAcademicYear,
    findOwnedAcademicYearOrThrow
} from "../../helpers/term/term.helper.js";
import * as termRepository from "../../repositories/term/term.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { TERM_MESSAGES } from "../../constants/messages/term/term.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createTerm(data, schoolId, userId = null) {
    const academicYear = await findOwnedAcademicYearOrThrow(data.academic_year_id, schoolId);

    if (academicYear.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.ACADEMIC_YEAR_COMPLETED);
    }

    validateTermDates(data.start_date, data.end_date);
    await ensureTermFitsWithinAcademicYear(academicYear, data.start_date, data.end_date);
    await ensureTermDoesNotExist(schoolId, data.academic_year_id, data.name);

    const id = await termRepository.create({ ...data, school_id: schoolId }, userId);

    return await termRepository.findById(id);
}

export async function getTerms(schoolId, academicYearId = null) {
    return await termRepository.findAll(schoolId, academicYearId);
}

// Every read of a specific term is tenant-checked here, so no caller can
// accidentally leak another school's record just by guessing an id.
async function findOwnedTermOrThrow(id, schoolId) {
    const term = await termRepository.findById(id);

    if (!term || term.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TERM_MESSAGES.NOT_FOUND);
    }

    return term;
}

export async function getTermById(id, schoolId) {
    return await findOwnedTermOrThrow(id, schoolId);
}

export async function updateTerm(id, data, schoolId, userId = null) {
    const term = await findOwnedTermOrThrow(id, schoolId);

    if (term.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.CANNOT_EDIT_COMPLETED);
    }

    const newStartDate = data.start_date ?? term.start_date;
    const newEndDate = data.end_date ?? term.end_date;

    if (data.start_date || data.end_date) {
        const academicYear = await findOwnedAcademicYearOrThrow(term.academic_year_id, schoolId);
        validateTermDates(newStartDate, newEndDate);
        await ensureTermFitsWithinAcademicYear(academicYear, newStartDate, newEndDate);
    }

    if (data.name && data.name !== term.name) {
        await ensureTermDoesNotExist(schoolId, term.academic_year_id, data.name);
    }

    await termRepository.update(id, data);

    const updatedTerm = await termRepository.findById(id);
    const changes = getChangedFields(term, updatedTerm);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Term",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Term information updated",
            performedBy: userId
        });
    }

    return updatedTerm;
}

export async function activateTerm(id, schoolId, userId = null) {
    const term = await findOwnedTermOrThrow(id, schoolId);

    if (term.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.CANNOT_ACTIVATE_COMPLETED);
    }

    if (term.status === "ACTIVE") {
        return term;
    }

    // A term can't run ahead of its own academic year — the year has to be
    // the live one before any of its terms can be.
    const academicYear = await findOwnedAcademicYearOrThrow(term.academic_year_id, schoolId);
    if (academicYear.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.ACADEMIC_YEAR_NOT_ACTIVE);
    }

    const currentlyActive = await termRepository.findActiveInYear(schoolId, term.academic_year_id);
    if (currentlyActive && currentlyActive.id !== term.id) {
        throw new AppError(HTTP_STATUS.CONFLICT, TERM_MESSAGES.ONLY_ONE_ACTIVE_PER_YEAR);
    }

    const today = new Date();
    if (new Date(term.start_date) > today) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.CANNOT_ACTIVATE_FUTURE);
    }

    await termRepository.activate(id);

    const updatedTerm = await termRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Term",
        entityId: id,
        action: "ACTIVATED",
        oldValues: { status: term.status },
        newValues: { status: updatedTerm.status },
        reason: "Term manually activated",
        performedBy: userId
    });

    return updatedTerm;
}

export async function completeTerm(id, schoolId, userId = null) {
    const term = await findOwnedTermOrThrow(id, schoolId);

    if (term.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.CANNOT_COMPLETE_INACTIVE);
    }

    await termRepository.complete(id);

    const completedTerm = await termRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Term",
        entityId: id,
        action: "COMPLETED",
        oldValues: { status: term.status },
        newValues: { status: completedTerm.status },
        reason: "Term completed",
        performedBy: userId
    });

    return completedTerm;
}
