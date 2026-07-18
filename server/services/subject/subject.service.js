import { ensureSubjectDoesNotExist } from "../../helpers/subject/subject.helper.js";
import * as subjectRepository from "../../repositories/subject/subject.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { SUBJECT_MESSAGES } from "../../constants/messages/subject/subject.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createSubject(data, schoolId, userId = null) {
    await ensureSubjectDoesNotExist(schoolId, data.name, data.code);

    const id = await subjectRepository.create({ ...data, school_id: schoolId }, userId);

    return await subjectRepository.findById(id);
}

export async function getSubjects(schoolId, status) {
    return await subjectRepository.findAll(schoolId, status);
}

// Every read of a specific subject is tenant-checked here, so no caller can
// accidentally leak another school's record just by guessing an id.
async function findOwnedSubjectOrThrow(id, schoolId) {
    const subject = await subjectRepository.findById(id);

    if (!subject || subject.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, SUBJECT_MESSAGES.NOT_FOUND);
    }

    return subject;
}

export async function getSubjectById(id, schoolId) {
    return await findOwnedSubjectOrThrow(id, schoolId);
}

export async function updateSubject(id, data, schoolId, userId = null) {
    const subject = await findOwnedSubjectOrThrow(id, schoolId);

    if (subject.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, SUBJECT_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    if (data.name && data.name !== subject.name) {
        const existing = await subjectRepository.findByName(schoolId, data.name);
        if (existing && existing.id !== subject.id) {
            throw new AppError(HTTP_STATUS.CONFLICT, SUBJECT_MESSAGES.DUPLICATE_NAME);
        }
    }

    if (data.code && data.code !== subject.code) {
        const existing = await subjectRepository.findByCode(schoolId, data.code);
        if (existing && existing.id !== subject.id) {
            throw new AppError(HTTP_STATUS.CONFLICT, SUBJECT_MESSAGES.DUPLICATE_CODE);
        }
    }

    await subjectRepository.update(id, data);

    const updatedSubject = await subjectRepository.findById(id);
    const changes = getChangedFields(subject, updatedSubject);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Subject",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Subject information updated",
            performedBy: userId
        });
    }

    return updatedSubject;
}

export async function archiveSubject(id, schoolId, userId = null) {
    const subject = await findOwnedSubjectOrThrow(id, schoolId);

    if (subject.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, SUBJECT_MESSAGES.ALREADY_ARCHIVED);
    }

    await subjectRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Subject",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: subject.status },
        newValues: { status: "ARCHIVED" },
        reason: "Subject archived",
        performedBy: userId
    });

    return await subjectRepository.findById(id);
}

export async function restoreSubject(id, schoolId, userId = null) {
    const subject = await findOwnedSubjectOrThrow(id, schoolId);

    if (subject.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, SUBJECT_MESSAGES.ALREADY_ACTIVE);
    }

    await subjectRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Subject",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: subject.status },
        newValues: { status: "ACTIVE" },
        reason: "Subject restored",
        performedBy: userId
    });

    return await subjectRepository.findById(id);
}
