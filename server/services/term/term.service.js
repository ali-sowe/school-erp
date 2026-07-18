import {
    ensureTermDoesNotExist,
    validateTermDates,
    ensureTermFitsWithinAcademicYear,
    findAcademicYearOrThrow
} from "../../helpers/term/term.helper.js";
import * as termRepository from "../../repositories/term/term.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { TERM_MESSAGES } from "../../constants/messages/term/term.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createTerm(data, userId = null) {
    const academicYear = await findAcademicYearOrThrow(data.academic_year_id);

    if (academicYear.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.ACADEMIC_YEAR_COMPLETED);
    }

    validateTermDates(data.start_date, data.end_date);
    await ensureTermFitsWithinAcademicYear(academicYear, data.start_date, data.end_date);
    await ensureTermDoesNotExist(data.academic_year_id, data.name);

    const id = await termRepository.create(data, userId);

    return await termRepository.findById(id);
}

export async function getTerms(academicYearId = null) {
    return await termRepository.findAll(academicYearId);
}

export async function getTermById(id) {
    const term = await termRepository.findById(id);

    if (!term) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TERM_MESSAGES.NOT_FOUND);
    }

    return term;
}

export async function updateTerm(id, data, userId = null) {
    const term = await termRepository.findById(id);

    if (!term) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TERM_MESSAGES.NOT_FOUND);
    }

    if (term.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.CANNOT_EDIT_COMPLETED);
    }

    const newStartDate = data.start_date ?? term.start_date;
    const newEndDate = data.end_date ?? term.end_date;

    if (data.start_date || data.end_date) {
        const academicYear = await findAcademicYearOrThrow(term.academic_year_id);
        validateTermDates(newStartDate, newEndDate);
        await ensureTermFitsWithinAcademicYear(academicYear, newStartDate, newEndDate);
    }

    if (data.name && data.name !== term.name) {
        await ensureTermDoesNotExist(term.academic_year_id, data.name);
    }

    await termRepository.update(id, data);

    const updatedTerm = await termRepository.findById(id);
    const changes = getChangedFields(term, updatedTerm);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
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

export async function activateTerm(id, userId = null) {
    const term = await termRepository.findById(id);

    if (!term) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TERM_MESSAGES.NOT_FOUND);
    }

    if (term.status === "COMPLETED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.CANNOT_ACTIVATE_COMPLETED);
    }

    if (term.status === "ACTIVE") {
        return term;
    }

    // A term can't run ahead of its own academic year — the year has to be
    // the live one before any of its terms can be.
    const academicYear = await findAcademicYearOrThrow(term.academic_year_id);
    if (academicYear.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.ACADEMIC_YEAR_NOT_ACTIVE);
    }

    const currentlyActive = await termRepository.findActiveInYear(term.academic_year_id);
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

export async function completeTerm(id, userId = null) {
    const term = await termRepository.findById(id);

    if (!term) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, TERM_MESSAGES.NOT_FOUND);
    }

    if (term.status !== "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TERM_MESSAGES.CANNOT_COMPLETE_INACTIVE);
    }

    await termRepository.complete(id);

    const completedTerm = await termRepository.findById(id);

    await auditRepository.createAuditLog({
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
