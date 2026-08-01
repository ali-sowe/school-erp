// Mirrors every registerWorkflowExecutor(...) call across the codebase
// (grep for it) plus LEAVE_REQUEST and EXPENSE_APPROVAL, which use the
// engine directly without registering an executor. Add an entry here
// whenever a new module wires into the Approval Workflow Engine.
const WORKFLOW_TYPE_LABELS = {
  ACADEMIC_YEAR_OVERRIDE: 'Academic year override',
  INVOICE_VOID: 'Invoice void',
  PAYMENT_VOID: 'Payment void',
  STUDENT_TRANSFER: 'Student transfer',
  LEAVE_REQUEST: 'Leave request',
  EXPENSE_APPROVAL: 'Expense approval',
};

function humanize(value) {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getWorkflowTypeLabel(workflowType) {
  return WORKFLOW_TYPE_LABELS[workflowType] || humanize(workflowType);
}

// Only entity_types that actually resolve to a real, existing frontend page
// are listed — AcademicYear, Payment, and Enrollment have no dedicated
// detail page yet, so a request tied to one of those shows its
// entity_type/entity_id as plain text rather than a dead link.
const ENTITY_ROUTE_BUILDERS = {
  Invoice: (entityId) => `/finance/invoices/${entityId}`,
  Expense: (entityId) => `/expenses/${entityId}`,
  LeaveRequest: (entityId) => `/leave-requests/${entityId}`,
};

export function getEntityLink(entityType, entityId) {
  const builder = ENTITY_ROUTE_BUILDERS[entityType];
  return builder && entityId ? builder(entityId) : null;
}
