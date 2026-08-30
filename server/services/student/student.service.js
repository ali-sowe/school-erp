import { ensureAdmissionNumberIsAvailable, findOwnedStudentOrThrow } from "../../helpers/student/student.helper.js";
import * as studentRepository from "../../repositories/student/student.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { STUDENT_MESSAGES } from "../../constants/messages/student/student.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { generateCode } from "../../helpers/code-generator.helper.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

// A student's admission number is school-configurable (they may already
// issue their own), so it's only auto-generated here as a fallback — never
// forced on a school that has its own format (ADR-005).
async function resolveAdmissionNumber(schoolId, providedAdmissionNumber) {
    if (providedAdmissionNumber) {
        await ensureAdmissionNumberIsAvailable(schoolId, providedAdmissionNumber);
        return providedAdmissionNumber;
    }

    const existingCount = await studentRepository.countForSchool(schoolId);
    return generateCode('STU', existingCount + 1);
}

export async function createStudent(data, schoolId, userId = null) {
    const admissionNumber = await resolveAdmissionNumber(schoolId, data.admission_number);

    const id = await studentRepository.create(
        {
            ...data,
            school_id: schoolId,
            admission_number: admissionNumber,
            admission_date: data.admission_date || new Date().toISOString().slice(0, 10)
        },
        userId
    );

    return await studentRepository.findById(id);
}

export async function getStudents(schoolId, filters) {
    return await studentRepository.findAll(schoolId, filters);
}

export async function getStudentById(id, schoolId) {
    return await findOwnedStudentOrThrow(id, schoolId);
}

export async function updateStudent(id, data, schoolId, userId = null) {
    const student = await findOwnedStudentOrThrow(id, schoolId);

    if (student.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, STUDENT_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    await studentRepository.update(id, data);

    const updatedStudent = await studentRepository.findById(id);
    const changes = getChangedFields(student, updatedStudent);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Student",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Student information updated",
            performedBy: userId
        });
    }

    return updatedStudent;
}

export async function archiveStudent(id, schoolId, userId = null) {
    const student = await findOwnedStudentOrThrow(id, schoolId);

    if (student.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, STUDENT_MESSAGES.ALREADY_ARCHIVED);
    }

    await studentRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: student.status },
        newValues: { status: "ARCHIVED" },
        reason: "Student archived",
        performedBy: userId
    });

    return await studentRepository.findById(id);
}

export async function restoreStudent(id, schoolId, userId = null) {
    const student = await findOwnedStudentOrThrow(id, schoolId);

    if (student.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, STUDENT_MESSAGES.ALREADY_ACTIVE);
    }

    await studentRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: student.status },
        newValues: { status: "ACTIVE" },
        reason: "Student restored",
        performedBy: userId
    });

    return await studentRepository.findById(id);
}
