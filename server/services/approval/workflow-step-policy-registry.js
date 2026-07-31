// Companion to workflow-executor-registry.js, for a gap that registry alone
// doesn't close: an executor decides what happens on execute(), but nothing
// stopped a caller from hitting POST /approval-requests directly with e.g.
// workflow_type 'PAYMENT_VOID' and a self-authored steps array — bypassing
// the 'must be approved by an Administrator' policy that
// payment.service.js#requestPaymentVoid always intends, since the engine
// itself has no concept of that policy. Anyone holding the generic
// approvals.write permission (Teacher included, see permission.helper.js)
// could otherwise name themselves as the sole approver of their own
// PAYMENT_VOID / INVOICE_VOID / STUDENT_TRANSFER / ACADEMIC_YEAR_OVERRIDE
// request and self-approve it.
//
// A module that cares who's allowed to approve its workflow_type registers
// that chain here, once, next to its registerWorkflowExecutor call.
// approval.service.js#createApprovalRequest looks it up and — when
// present — uses it instead of whatever steps the caller supplied, no
// matter what the caller sent. Workflow types with no registered policy
// (ad-hoc ones like LEAVE_REQUEST) keep working exactly as before: the
// caller's own steps are used, since nobody has declared they need to be
// fixed.
const requiredSteps = new Map();

// steps: the same shape createApprovalRequestSchema accepts, e.g.
// [{ approver_role_name: 'Administrator' }]
export function registerRequiredSteps(workflowType, steps) {
    requiredSteps.set(workflowType, steps);
}

export function getRequiredSteps(workflowType) {
    return requiredSteps.get(workflowType);
}
