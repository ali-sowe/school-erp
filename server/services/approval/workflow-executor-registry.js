// A small registry so the approval engine can actually *do* something on
// execute() without becoming coupled to every module that uses it
// (System Architecture doc: approvals is a cross-cutting concern, reused
// across fees, transfers, leave requests, ...). A module that wants its
// actions to be approval-gated registers an executor for its own
// workflow_type at import time; approval.service.js only ever knows how to
// look one up and call it, never which modules exist.
//
// Registering nothing for a workflow_type is fine — executeApprovalRequest
// just marks the request EXECUTED with no side effect, which is exactly
// the original decoupled behavior for any workflow_type nobody has wired
// an executor for yet.
const executors = new Map();

// executorFn: async (approvalRequest, schoolId, userId) => void
// approvalRequest carries entity_type/entity_id (what to act on) and
// description (commonly reused as the reason for the underlying action).
export function registerWorkflowExecutor(workflowType, executorFn) {
    executors.set(workflowType, executorFn);
}

export function getWorkflowExecutor(workflowType) {
    return executors.get(workflowType);
}
