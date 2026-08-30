import {
    ensureClassDoesNotExist,
    findOwnedGradeLevelOrThrow,
    findOwnedSubjectOrThrow
} from "../../helpers/class/class.helper.js";
import * as classRepository from "../../repositories/class/class.repository.js";
import * as classSubjectRepository from "../../repositories/class/class-subject.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { CLASS_MESSAGES } from "../../constants/messages/class/class.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createClass(data, schoolId, userId = null) {
    const gradeLevel = await findOwnedGradeLevelOrThrow(data.grade_level_id, schoolId);

    if (gradeLevel.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_MESSAGES.GRADE_LEVEL_ARCHIVED);
    }

    await ensureClassDoesNotExist(gradeLevel.id, data.name);

    const id = await classRepository.create({ ...data, school_id: schoolId }, userId);

    return await classRepository.findById(id);
}

export async function getClasses(schoolId, filters) {
    return await classRepository.findAll(schoolId, filters);
}

// Every read of a specific class is tenant-checked here, so no caller can
// accidentally leak another school's record just by guessing an id.
async function findOwnedClassOrThrow(id, schoolId) {
    const classRecord = await classRepository.findById(id);

    if (!classRecord || classRecord.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CLASS_MESSAGES.NOT_FOUND);
    }

    return classRecord;
}

export async function getClassById(id, schoolId) {
    return await findOwnedClassOrThrow(id, schoolId);
}

export async function updateClass(id, data, schoolId, userId = null) {
    const classRecord = await findOwnedClassOrThrow(id, schoolId);

    if (classRecord.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    // grade_level_id is intentionally not editable here — moving a class to
    // a different grade level is a structural change, not a routine edit.
    if (data.name && data.name !== classRecord.name) {
        const existing = await classRepository.findByNameInGradeLevel(classRecord.grade_level_id, data.name);
        if (existing && existing.id !== classRecord.id) {
            throw new AppError(HTTP_STATUS.CONFLICT, CLASS_MESSAGES.DUPLICATE_NAME);
        }
    }

    await classRepository.update(id, data);

    const updatedClass = await classRepository.findById(id);
    const changes = getChangedFields(classRecord, updatedClass);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Class",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Class information updated",
            performedBy: userId
        });
    }

    return updatedClass;
}

export async function archiveClass(id, schoolId, userId = null) {
    const classRecord = await findOwnedClassOrThrow(id, schoolId);

    if (classRecord.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_MESSAGES.ALREADY_ARCHIVED);
    }

    await classRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Class",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: classRecord.status },
        newValues: { status: "ARCHIVED" },
        reason: "Class archived",
        performedBy: userId
    });

    return await classRepository.findById(id);
}

export async function restoreClass(id, schoolId, userId = null) {
    const classRecord = await findOwnedClassOrThrow(id, schoolId);

    if (classRecord.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_MESSAGES.ALREADY_ACTIVE);
    }

    await classRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Class",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: classRecord.status },
        newValues: { status: "ACTIVE" },
        reason: "Class restored",
        performedBy: userId
    });

    return await classRepository.findById(id);
}

// --- Subject assignment ---

export async function assignSubjectToClass(classId, subjectId, schoolId, userId = null) {
    const classRecord = await findOwnedClassOrThrow(classId, schoolId);
    const subject = await findOwnedSubjectOrThrow(subjectId, schoolId);

    if (classRecord.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    if (subject.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CLASS_MESSAGES.SUBJECT_ARCHIVED);
    }

    const existingMapping = await classSubjectRepository.findMapping(classId, subjectId);
    if (existingMapping && existingMapping.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.CONFLICT, CLASS_MESSAGES.SUBJECT_ALREADY_ASSIGNED);
    }

    await classSubjectRepository.create(classId, subjectId, userId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Class",
        entityId: classId,
        action: "SUBJECT_ASSIGNED",
        newValues: { subject_id: subjectId, subject_name: subject.name },
        reason: "Subject assigned to class",
        performedBy: userId
    });

    return await classSubjectRepository.findSubjectsForClass(classId);
}

export async function removeSubjectFromClass(classId, subjectId, schoolId, userId = null) {
    await findOwnedClassOrThrow(classId, schoolId);
    const subject = await findOwnedSubjectOrThrow(subjectId, schoolId);

    const existingMapping = await classSubjectRepository.findMapping(classId, subjectId);
    if (!existingMapping) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CLASS_MESSAGES.SUBJECT_NOT_ASSIGNED);
    }

    await classSubjectRepository.remove(classId, subjectId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Class",
        entityId: classId,
        action: "SUBJECT_REMOVED",
        oldValues: { subject_id: subjectId, subject_name: subject.name },
        reason: "Subject removed from class",
        performedBy: userId
    });

    return await classSubjectRepository.findSubjectsForClass(classId);
}

export async function getClassSubjects(classId, schoolId) {
    await findOwnedClassOrThrow(classId, schoolId);

    return await classSubjectRepository.findSubjectsForClass(classId);
}
