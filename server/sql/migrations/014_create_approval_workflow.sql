-- Approval Workflow Engine (ADR-004 / Documentation Index: "Approval
-- Workflow Engine"). A generic, reusable engine rather than a per-feature
-- one -- applicable to academic overrides, payments, leave requests,
-- student transfers, and other administrative decisions, per the docs.
--
-- workflow_type is a free string (e.g. 'INVOICE_VOID', 'STUDENT_TRANSFER'),
-- not a fixed enum table -- new workflow types are a config choice for
-- whichever module uses this engine, not a schema change (ADR-005).
-- entity_type/entity_id optionally link a request to the record it's about,
-- mirroring audit_logs' and notifications' polymorphic reference -- left
-- unvalidated/unconstrained here so the engine stays decoupled from every
-- module that might call into it.

CREATE TABLE IF NOT EXISTS approval_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    requested_by INT NULL,
    executed_at TIMESTAMP NULL,
    executed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_requests_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_approval_requests_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_approval_requests_executed_by FOREIGN KEY (executed_by) REFERENCES users(id)
);

CREATE INDEX idx_approval_requests_school_status ON approval_requests (school_id, status);

-- The approval chain for one request, one row per stage, all created up
-- front for the whole planned chain rather than lazily as each stage is
-- reached -- "users should see... next required action" doesn't require
-- guessing what comes after the current stage. The "current" stage is
-- always whichever PENDING row has the lowest step_number, derived at read
-- time rather than tracked in a separate counter column.
--
-- Exactly one of approver_user_id/approver_role_name is set per step
-- (enforced in the service layer): a step can name a specific person or
-- "anyone holding this role", since small schools often don't have a
-- dedicated named approver for every workflow.
CREATE TABLE IF NOT EXISTS approval_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    approval_request_id INT NOT NULL,
    step_number INT NOT NULL,
    approver_user_id INT NULL,
    approver_role_name VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    decided_by INT NULL,
    decided_at TIMESTAMP NULL,
    comment VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_steps_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id),
    CONSTRAINT fk_approval_steps_approver_user FOREIGN KEY (approver_user_id) REFERENCES users(id),
    CONSTRAINT fk_approval_steps_decided_by FOREIGN KEY (decided_by) REFERENCES users(id),
    CONSTRAINT uq_approval_steps_request_step UNIQUE (approval_request_id, step_number)
);

CREATE INDEX idx_approval_steps_request ON approval_steps (approval_request_id, status);
