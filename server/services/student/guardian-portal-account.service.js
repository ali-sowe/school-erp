import { findOwnedGuardianOrThrow } from "../../helpers/student/guardian.helper.js";
import * as guardianRepository from "../../repositories/student/guardian.repository.js";
import * as userRepository from "../../repositories/user/user.repository.js";
import * as roleRepository from "../../repositories/role/role.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { GUARDIAN_MESSAGES } from "../../constants/messages/student/guardian.message.js";
import { USER_MESSAGES } from "../../constants/messages/user.message.js";
import { hashPassword } from "../../helpers/password.helper.js";
import { generateCode } from "../../helpers/code-generator.helper.js";
import { transaction } from "../../database/transaction.js";

// Same shape as student-portal-account.service.js's createStudentPortalAccount,
// for the Parent role instead. A guardian's own email (already on file
// for contact purposes) is reused by default so staff don't have to type
// it twice — but an explicit email in the request always wins, since a
// guardian may want a different address for their own portal login.
export async function createGuardianPortalAccount(guardianId, data, schoolId, userId = null) {
    const guardian = await findOwnedGuardianOrThrow(guardianId, schoolId);

    if (guardian.user_id) {
        throw new AppError(HTTP_STATUS.CONFLICT, GUARDIAN_MESSAGES.ALREADY_HAS_PORTAL_ACCOUNT);
    }

    const email = data.email || guardian.email;
    if (!email) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GUARDIAN_MESSAGES.EMAIL_REQUIRED_FOR_PORTAL_ACCOUNT);
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        throw new AppError(HTTP_STATUS.CONFLICT, USER_MESSAGES.DUPLICATE_EMAIL);
    }

    const parentRole = await roleRepository.findByName(schoolId, 'Parent');
    if (!parentRole) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, USER_MESSAGES.INVALID_ROLE);
    }

    const hashedPassword = await hashPassword(data.password);

    await transaction(async (connection) => {
        const newUserId = await userRepository.create(
            {
                school_id: schoolId,
                user_code: generateCode('USR', Date.now()),
                first_name: guardian.first_name,
                last_name: guardian.last_name,
                email,
                password: hashedPassword,
                role_id: parentRole.id,
                status: 'active'
            },
            connection
        );

        await guardianRepository.attachUserAccount(guardian.id, newUserId);
    });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Guardian",
        entityId: guardian.id,
        action: "PORTAL_ACCOUNT_CREATED",
        newValues: { email },
        reason: "Parent portal account provisioned",
        performedBy: userId
    });

    return await findOwnedGuardianOrThrow(guardian.id, schoolId);
}
