import { ensureEmployeeNumberIsAvailable, findOwnedTeacherOrThrow } from "../../helpers/teacher/teacher.helper.js";
import * as teacherRepository from "../../repositories/teacher/teacher.repository.js";
import * as userRepository from "../../repositories/user/user.repository.js";
import * as roleRepository from "../../repositories/role/role.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TEACHER_MESSAGES } from "../../constants/messages/teacher/teacher.message.js";
import { USER_MESSAGES } from "../../constants/messages/user.message.js";
import { hashPassword } from "../../helpers/password.helper.js";
import { generateCode } from "../../helpers/code-generator.helper.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";
import { transaction } from "../../database/transaction.js";

// A teacher's employee number is school-configurable (they may already
// issue their own staff IDs), so it's only auto-generated here as a
// fallback — same reasoning as student.service.js's resolveAdmissionNumber
// (ADR-005: Configuration Over Hardcoding).
async function resolveEmployeeNumber(schoolId, providedEmployeeNumber) {
    if (providedEmployeeNumber) {
        await ensureEmployeeNumberIsAvailable(schoolId, providedEmployeeNumber);
        return providedEmployeeNumber;
    }

    const existingCount = await teacherRepository.countForSchool(schoolId);
    return generateCode('TCH', existingCount + 1);
}

// Creates the login (users) and the employment profile (teachers)
// atomically: if either step fails, nothing is left half-created — no user
// with no teacher record, no teacher record pointing at a user that
// doesn't exist. Same shape as school.service.js creating a school and its
// first Administrator together.
export async function createTeacher(data, schoolId, userId = null) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
        throw new AppError(HTTP_STATUS.CONFLICT, USER_MESSAGES.DUPLICATE_EMAIL);
    }

    const employeeNumber = await resolveEmployeeNumber(schoolId, data.employee_number);

    const teacherRole = await roleRepository.findByName(schoolId, 'Teacher');
    if (!teacherRole) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_MESSAGES.TEACHER_ROLE_NOT_CONFIGURED);
    }

    const hashedPassword = await hashPassword(data.password);
    const hireDate = data.hire_date || new Date().toISOString().slice(0, 10);

    const teacherId = await transaction(async (connection) => {
        const newUserId = await userRepository.create(
            {
                school_id: schoolId,
                user_code: generateCode('USR', Date.now()),
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                password: hashedPassword,
                role_id: teacherRole.id,
                status: 'active'
            },
            connection
        );

        return await teacherRepository.create(
            {
                school_id: schoolId,
                user_id: newUserId,
                employee_number: employeeNumber,
                qualification: data.qualification,
                specialization: data.specialization,
                hire_date: hireDate,
                created_by: userId
            },
            connection
        );
    });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Teacher",
        entityId: teacherId,
        action: "CREATED",
        newValues: { employee_number: employeeNumber, qualification: data.qualification ?? null, specialization: data.specialization ?? null, hire_date: hireDate },
        reason: "Teacher hired",
        performedBy: userId
    });

    return await teacherRepository.findById(teacherId);
}

export async function getTeachers(schoolId, filters) {
    return await teacherRepository.findAll(schoolId, filters);
}

export async function getTeacherById(id, schoolId) {
    return await findOwnedTeacherOrThrow(id, schoolId);
}

export async function updateTeacher(id, data, schoolId, userId = null) {
    const teacher = await findOwnedTeacherOrThrow(id, schoolId);

    if (teacher.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    await teacherRepository.update(id, data);

    const updatedTeacher = await teacherRepository.findById(id);
    const changes = getChangedFields(teacher, updatedTeacher);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Teacher",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Teacher information updated",
            performedBy: userId
        });
    }

    return updatedTeacher;
}

export async function archiveTeacher(id, schoolId, userId = null) {
    const teacher = await findOwnedTeacherOrThrow(id, schoolId);

    if (teacher.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_MESSAGES.ALREADY_ARCHIVED);
    }

    await teacherRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Teacher",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: teacher.status },
        newValues: { status: "ARCHIVED" },
        reason: "Teacher archived",
        performedBy: userId
    });

    return await teacherRepository.findById(id);
}

export async function restoreTeacher(id, schoolId, userId = null) {
    const teacher = await findOwnedTeacherOrThrow(id, schoolId);

    if (teacher.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, TEACHER_MESSAGES.ALREADY_ACTIVE);
    }

    await teacherRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Teacher",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: teacher.status },
        newValues: { status: "ACTIVE" },
        reason: "Teacher restored",
        performedBy: userId
    });

    return await teacherRepository.findById(id);
}
