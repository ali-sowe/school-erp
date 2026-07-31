import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { APPROVAL_MESSAGES } from "../../constants/messages/approval/approval.message.js";
import { AppError } from "../app-error.helper.js";
import * as approvalRepository from "../../repositories/approval/approval.repository.js";
import * as userRepository from "../../repositories/user/user.repository.js";
import * as roleRepository from "../../repositories/role/role.repository.js";

// Same tenant-ownership check used throughout the codebase.
export async function findOwnedApprovalRequestOrThrow(id, schoolId) {
    const request = await approvalRepository.findById(id);

    if (!request || request.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, APPROVAL_MESSAGES.NOT_FOUND);
    }

    return request;
}

// Each step names either a specific person or "anyone holding this role" --
// never both, never neither. Joi's .xor() on the request body already
// guards the shape; this is the business-rule check once real records
// (which might not exist) are involved.
//
// requestedBy also blocks a step naming the requester themselves as
// approver_user_id — an approval a person can grant themselves isn't an
// approval. This applies to every workflow_type, not just the ones with a
// registered required-steps policy (workflow-step-policy-registry.js),
// since a role-named step still can't be gamed this way but a user-named
// one always could be without this check.
export async function validateAndResolveSteps(steps, schoolId, requestedBy) {
    if (!Array.isArray(steps) || steps.length === 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.STEPS_REQUIRED);
    }

    for (const step of steps) {
        const hasUser = Boolean(step.approver_user_id);
        const hasRole = Boolean(step.approver_role_name);

        if (hasUser === hasRole) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.STEP_APPROVER_REQUIRED);
        }

        if (hasUser && requestedBy && step.approver_user_id === requestedBy) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.APPROVER_CANNOT_BE_REQUESTER);
        }

        if (hasUser) {
            const approver = await userRepository.findById(step.approver_user_id);
            if (!approver || approver.school_id !== schoolId) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, APPROVAL_MESSAGES.APPROVER_NOT_FOUND);
            }
        }

        if (hasRole) {
            const role = await roleRepository.findByName(schoolId, step.approver_role_name);
            if (!role) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, APPROVAL_MESSAGES.APPROVER_ROLE_NOT_FOUND);
            }
        }
    }

    return steps;
}

// Resolves who to notify for a given step: the named user, or every active
// user currently holding the named role (small schools often don't have a
// single dedicated approver for every workflow type).
export async function resolveStepNotifyees(step, schoolId) {
    if (step.approver_user_id) {
        return [step.approver_user_id];
    }

    const usersWithRole = await userRepository.findByRole(schoolId, step.approver_role_name);
    return usersWithRole.map((user) => user.id);
}

// Whether the acting user is allowed to decide on this step: named
// directly, or holding the role the step was assigned to. role is the
// role_name string off the JWT (req.user.role), the same field every other
// permission-adjacent check in this codebase reads from the token.
export function isEligibleApprover(step, userId, role) {
    if (step.approver_user_id) {
        return step.approver_user_id === userId;
    }

    return Boolean(role) && step.approver_role_name === role;
}
