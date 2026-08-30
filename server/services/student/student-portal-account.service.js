import { findOwnedStudentOrThrow } from "../../helpers/student/student.helper.js";
import * as studentRepository from "../../repositories/student/student.repository.js";
import * as userRepository from "../../repositories/user/user.repository.js";
import * as roleRepository from "../../repositories/role/role.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { STUDENT_MESSAGES } from "../../constants/messages/student/student.message.js";
import { USER_MESSAGES } from "../../constants/messages/user.message.js";
import { hashPassword } from "../../helpers/password.helper.js";
import { generateCode } from "../../helpers/code-generator.helper.js";
import { transaction } from "../../database/transaction.js";

// Grants an existing student a login, same "extends users, doesn't
// duplicate identity" relationship teacher.service.js's createTeacher
// already has — just optional and requested after the profile exists,
// rather than created together with it. A student's name comes from their
// existing profile, not re-entered.
export async function createStudentPortalAccount(studentId, data, schoolId, userId = null) {
    const student = await findOwnedStudentOrThrow(studentId, schoolId);

    if (student.user_id) {
        throw new AppError(HTTP_STATUS.CONFLICT, STUDENT_MESSAGES.ALREADY_HAS_PORTAL_ACCOUNT);
    }

    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
        throw new AppError(HTTP_STATUS.CONFLICT, USER_MESSAGES.DUPLICATE_EMAIL);
    }

    const studentRole = await roleRepository.findByName(schoolId, 'Student');
    if (!studentRole) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, USER_MESSAGES.INVALID_ROLE);
    }

    const hashedPassword = await hashPassword(data.password);

    await transaction(async (connection) => {
        const newUserId = await userRepository.create(
            {
                school_id: schoolId,
                user_code: generateCode('USR', Date.now()),
                first_name: student.first_name,
                last_name: student.last_name,
                email: data.email,
                password: hashedPassword,
                role_id: studentRole.id,
                status: 'active'
            },
            connection
        );

        await studentRepository.attachUserAccount(student.id, newUserId);
    });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Student",
        entityId: student.id,
        action: "PORTAL_ACCOUNT_CREATED",
        newValues: { email: data.email },
        reason: "Student portal account provisioned",
        performedBy: userId
    });

    return await findOwnedStudentOrThrow(student.id, schoolId);
}
