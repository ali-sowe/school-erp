import * as leaveRequestRepository from '../../repositories/leave/leave-request.repository.js';
import { findOwnedLeaveRequestOrThrow, ensureValidDateRange, ensureNoOverlap } from '../../helpers/leave/leave-request.helper.js';
import { createApprovalRequest } from '../approval/approval.service.js';
import { registerRequiredSteps } from '../approval/workflow-step-policy-registry.js';

// LEAVE_REQUEST has no registerWorkflowExecutor (see comment below on why),
// but it still always intends an Administrator-only approver — registered
// here for the same reason as PAYMENT_VOID/INVOICE_VOID/STUDENT_TRANSFER/
// ACADEMIC_YEAR_OVERRIDE (see workflow-step-policy-registry.js): without
// this, POST /approval-requests could still be used to create a
// LEAVE_REQUEST-typed request with a self-named approver. There's no real
// leave_requests row or executor behind such a request, so the impact is
// low (no actual leave is granted), but it's free to close and keeps every
// workflow_type's policy in one place instead of "all but one."
registerRequiredSteps('LEAVE_REQUEST', [{ approver_role_name: 'Administrator' }]);

// Deliberately does not register a workflow executor for 'LEAVE_REQUEST'
// (compare services/student/enrollment.service.js's STUDENT_TRANSFER
// executor). Approving a leave request has no further side effect to apply
// to another table — the approval itself *is* the outcome the requester
// needed — so the engine's default no-op executor (see
// workflow-executor-registry.js) is exactly the right behavior here.
// Calling PATCH /api/approval-requests/:id/execute afterwards is optional
// and mostly for symmetry with workflows that do have one.
//
// Approve / reject / cancel / execute all go through the generic
// /api/approval-requests/:id/... endpoints directly — same as
// STUDENT_TRANSFER, INVOICE_VOID, and PAYMENT_VOID, none of which expose
// their own decision endpoints either. This module only owns submission
// and the leave-specific read views.
export async function requestLeave(data, schoolId, userId) {
    ensureValidDateRange(data.start_date, data.end_date);
    await ensureNoOverlap(userId, data.start_date, data.end_date);

    // Inserted before the approval chain exists so entity_id has a real
    // row to point at — same ordering as Enrollment existing before
    // requestStudentTransfer creates its approval request.
    const leaveRequestId = await leaveRequestRepository.create({
        school_id: schoolId,
        user_id: userId,
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
    });

    const approvalRequest = await createApprovalRequest(
        {
            workflow_type: 'LEAVE_REQUEST',
            entity_type: 'LeaveRequest',
            entity_id: leaveRequestId,
            title: `Leave request: ${data.leave_type || 'OTHER'} (${data.start_date} to ${data.end_date})`,
            description: data.reason,
            steps: [{ approver_role_name: 'Administrator' }],
        },
        schoolId,
        userId
    );

    await leaveRequestRepository.attachApprovalRequest(leaveRequestId, approvalRequest.id);

    return await leaveRequestRepository.findById(leaveRequestId);
}

export async function getLeaveRequests(schoolId, filters) {
    return await leaveRequestRepository.findAll(schoolId, filters);
}

export async function getMyLeaveRequests(schoolId, userId, filters) {
    return await leaveRequestRepository.findAll(schoolId, { ...filters, userId });
}

export async function getLeaveRequestById(id, schoolId) {
    return await findOwnedLeaveRequestOrThrow(id, schoolId);
}
