import * as approvalRepository from "../../repositories/approval/approval.repository.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { transaction } from "../../database/transaction.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { APPROVAL_MESSAGES } from "../../constants/messages/approval/approval.message.js";
import {
    findOwnedApprovalRequestOrThrow,
    validateAndResolveSteps,
    resolveStepNotifyees,
    isEligibleApprover
} from "../../helpers/approval/approval.helper.js";
import { notifyUsers } from "../notification/notification.service.js";
import { getWorkflowExecutor } from "./workflow-executor-registry.js";
import { getRequiredSteps } from "./workflow-step-policy-registry.js";

async function attachSteps(request) {
    const steps = await approvalRepository.findSteps(request.id);
    return { ...request, steps };
}

async function notifyStepApprovers(step, schoolId, { title, body, relatedEntityType, relatedEntityId, triggeredBy }) {
    const userIds = await resolveStepNotifyees(step, schoolId);

    await notifyUsers(userIds, {
        schoolId,
        type: 'APPROVAL_PENDING',
        title,
        body,
        relatedEntityType: relatedEntityType ?? 'ApprovalRequest',
        relatedEntityId,
        triggeredBy
    });
}

// Creates a request and its whole planned approval chain atomically, then
// notifies the first stage's approver(s). This is the generic engine ADR-004
// and the Documentation Index describe: any module can call this for its
// own important decisions (fee void, student transfer, academic override,
// leave request, ...) by picking a workflow_type and an optional
// entity_type/entity_id to link back to its own record.
export async function createApprovalRequest(data, schoolId, userId) {
    // A registered policy always wins over whatever the caller sent — see
    // workflow-step-policy-registry.js. This is what actually stops a
    // PAYMENT_VOID (or INVOICE_VOID / STUDENT_TRANSFER /
    // ACADEMIC_YEAR_OVERRIDE) request from being created with anything
    // other than its intended approver chain, regardless of who calls this
    // or what steps they pass in.
    const requestedSteps = getRequiredSteps(data.workflow_type) ?? data.steps;
    const steps = await validateAndResolveSteps(requestedSteps, schoolId, userId);

    const requestId = await transaction(async (connection) => {
        const id = await approvalRepository.create(
            {
                school_id: schoolId,
                workflow_type: data.workflow_type,
                entity_type: data.entity_type,
                entity_id: data.entity_id,
                title: data.title,
                description: data.description,
                metadata: data.metadata,
                requested_by: userId
            },
            connection
        );

        let stepNumber = 1;
        for (const step of steps) {
            await approvalRepository.createStep(
                { approval_request_id: id, step_number: stepNumber, ...step },
                connection
            );
            stepNumber += 1;
        }

        return id;
    });

    const request = await attachSteps(await approvalRepository.findById(requestId));

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ApprovalRequest",
        entityId: requestId,
        action: "REQUESTED",
        oldValues: {},
        newValues: {
            workflow_type: request.workflow_type,
            title: request.title,
            entity_type: request.entity_type,
            entity_id: request.entity_id,
            step_count: request.steps.length
        },
        reason: "Approval request created",
        performedBy: userId
    });

    await notifyStepApprovers(request.steps[0], schoolId, {
        title: `Approval needed: ${request.title}`,
        body: request.description,
        relatedEntityId: request.id,
        triggeredBy: userId
    });

    return request;
}

export async function getApprovalRequests(schoolId, filters) {
    const requests = await approvalRepository.findAll(schoolId, filters);
    return Promise.all(requests.map(attachSteps));
}

export async function getApprovalRequestById(id, schoolId) {
    const request = await findOwnedApprovalRequestOrThrow(id, schoolId);
    return attachSteps(request);
}

export async function getMyPendingApprovals(schoolId, userId, roleName) {
    return await approvalRepository.findPendingForApprover(schoolId, userId, roleName);
}

// Approving the current step either advances the chain (notifying the next
// approver) or, if it was the last step, marks the whole request APPROVED
// and hands it back to the requester to execute — the "Approved" and
// "Executed" stages are deliberately separate (ADR-004): being cleared to
// proceed is not the same event as the action actually being carried out.
export async function approveCurrentStep(requestId, schoolId, userId, roleName, comment) {
    const request = await findOwnedApprovalRequestOrThrow(requestId, schoolId);

    if (request.status !== 'PENDING_REVIEW') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.ALREADY_DECIDED);
    }

    const step = await approvalRepository.findCurrentStep(requestId);

    if (!step) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.NO_PENDING_STEP);
    }

    // Belt-and-suspenders alongside the creation-time check in
    // approval.helper.js#validateAndResolveSteps: that one only catches a
    // step naming the requester's user id directly. A role-matched step
    // (e.g. approver_role_name: 'Teacher') can still resolve to the
    // requester themselves if they hold that role — this catches that case
    // too, at the one point it actually matters (the moment of approval).
    if (request.requested_by === userId) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, APPROVAL_MESSAGES.APPROVER_CANNOT_BE_REQUESTER);
    }

    if (!isEligibleApprover(step, userId, roleName)) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, APPROVAL_MESSAGES.NOT_YOUR_APPROVAL);
    }

    const decided = await approvalRepository.decideStep(step.id, { status: 'APPROVED', decidedBy: userId, comment });

    // 0 rows affected means someone else's decision on this exact step won
    // the race between our read of "current step" and our write — same
    // step_id, but its status was no longer PENDING by the time this UPDATE
    // ran. Treat it the same as the request-level already-decided check
    // above, rather than continuing as if our decision were the one that landed.
    if (decided === 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.ALREADY_DECIDED);
    }

    const remainingSteps = await approvalRepository.findSteps(requestId);
    const nextStep = remainingSteps.find((candidate) => candidate.status === 'PENDING');

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ApprovalRequest",
        entityId: requestId,
        action: "STEP_APPROVED",
        oldValues: { step_status: 'PENDING' },
        newValues: { step_number: step.step_number, step_status: 'APPROVED', comment: comment ?? null },
        reason: "Approval step approved",
        performedBy: userId
    });

    if (nextStep) {
        await notifyStepApprovers(nextStep, schoolId, {
            title: `Approval needed: ${request.title}`,
            body: request.description,
            relatedEntityId: request.id,
            triggeredBy: userId
        });

        return attachSteps(request);
    }

    await approvalRepository.updateStatus(requestId, 'APPROVED');

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ApprovalRequest",
        entityId: requestId,
        action: "APPROVED",
        oldValues: { status: 'PENDING_REVIEW' },
        newValues: { status: 'APPROVED' },
        reason: "All approval steps completed",
        performedBy: userId
    });

    if (request.requested_by) {
        await notifyUsers([request.requested_by], {
            schoolId,
            type: 'APPROVAL_APPROVED',
            title: `Approved: ${request.title}`,
            body: "Your request has been fully approved and is ready to be executed.",
            relatedEntityType: 'ApprovalRequest',
            relatedEntityId: request.id,
            triggeredBy: userId
        });
    }

    return attachSteps(await approvalRepository.findById(requestId));
}

// Rejecting any single step rejects the whole request outright rather than
// letting it continue to later stages — the simplest, least surprising
// semantics for a linear approval chain, and consistent with how e.g.
// invoice voiding requires a reason for any state-changing rejection.
export async function rejectCurrentStep(requestId, schoolId, userId, roleName, comment) {
    const request = await findOwnedApprovalRequestOrThrow(requestId, schoolId);

    if (request.status !== 'PENDING_REVIEW') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.ALREADY_DECIDED);
    }

    if (!comment) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.REJECT_COMMENT_REQUIRED);
    }

    const step = await approvalRepository.findCurrentStep(requestId);

    if (!step) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.NO_PENDING_STEP);
    }

    if (!isEligibleApprover(step, userId, roleName)) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, APPROVAL_MESSAGES.NOT_YOUR_APPROVAL);
    }

    const decided = await approvalRepository.decideStep(step.id, { status: 'REJECTED', decidedBy: userId, comment });

    if (decided === 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.ALREADY_DECIDED);
    }

    await approvalRepository.updateStatus(requestId, 'REJECTED');
    await approvalRepository.skipPendingSteps(requestId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ApprovalRequest",
        entityId: requestId,
        action: "REJECTED",
        oldValues: { status: 'PENDING_REVIEW' },
        newValues: { status: 'REJECTED', step_number: step.step_number, comment },
        reason: comment,
        performedBy: userId
    });

    if (request.requested_by) {
        await notifyUsers([request.requested_by], {
            schoolId,
            type: 'APPROVAL_REJECTED',
            title: `Rejected: ${request.title}`,
            body: comment,
            relatedEntityType: 'ApprovalRequest',
            relatedEntityId: request.id,
            triggeredBy: userId
        });
    }

    return attachSteps(await approvalRepository.findById(requestId));
}

// Performing the underlying action (voiding an invoice, applying a
// transfer, ...) is still owned by whichever module registered an executor
// for this workflow_type (see workflow-executor-registry.js) — this engine
// stays generic and never hardcodes knowledge of any specific module. The
// executor runs *before* the request is marked EXECUTED: if it throws (e.g.
// the invoice already has payments recorded against it by the time this
// runs), the request stays APPROVED rather than being marked done for an
// action that didn't actually happen.
export async function executeApprovalRequest(requestId, schoolId, userId, note) {
    const request = await findOwnedApprovalRequestOrThrow(requestId, schoolId);

    if (request.status !== 'APPROVED') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.NOT_APPROVED);
    }

    const executor = getWorkflowExecutor(request.workflow_type);
    if (executor) {
        await executor(request, schoolId, userId);
    }

    await approvalRepository.setExecuted(requestId, userId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ApprovalRequest",
        entityId: requestId,
        action: "EXECUTED",
        oldValues: { status: 'APPROVED' },
        newValues: { status: 'EXECUTED' },
        reason: note || "Approval request executed",
        performedBy: userId
    });

    return attachSteps(await approvalRepository.findById(requestId));
}

// Only the original requester can withdraw their own request, and only
// while it's still pending review — once a decision has been made
// (approved/rejected) or it's been executed, cancelling would erase a
// record ADR-003 requires to stay explainable.
export async function cancelApprovalRequest(requestId, schoolId, userId, reason) {
    const request = await findOwnedApprovalRequestOrThrow(requestId, schoolId);

    if (!reason) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.CANCEL_REASON_REQUIRED);
    }

    if (request.requested_by !== userId) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, APPROVAL_MESSAGES.ONLY_REQUESTER_CAN_CANCEL);
    }

    if (request.status !== 'PENDING_REVIEW') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, APPROVAL_MESSAGES.CANNOT_CANCEL);
    }

    const currentStep = await approvalRepository.findCurrentStep(requestId);

    await approvalRepository.updateStatus(requestId, 'CANCELLED');
    await approvalRepository.skipPendingSteps(requestId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "ApprovalRequest",
        entityId: requestId,
        action: "CANCELLED",
        oldValues: { status: 'PENDING_REVIEW' },
        newValues: { status: 'CANCELLED' },
        reason,
        performedBy: userId
    });

    if (currentStep) {
        const userIds = await resolveStepNotifyees(currentStep, schoolId);
        await notifyUsers(userIds, {
            schoolId,
            type: 'APPROVAL_CANCELLED',
            title: `Withdrawn: ${request.title}`,
            body: reason,
            relatedEntityType: 'ApprovalRequest',
            relatedEntityId: request.id,
            triggeredBy: userId
        });
    }

    return attachSteps(await approvalRepository.findById(requestId));
}
