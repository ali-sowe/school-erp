-- Leave Requests — a thin domain entity riding on the Approval Workflow
-- Engine (ADR-004), same relationship STUDENT_TRANSFER has to Enrollment.
--
-- Deliberately no status column: status always comes from the linked
-- approval_requests row, so nothing here can drift out of sync with it.
-- approval_request_id is nullable and filled in right after the approval
-- chain is created (the row is inserted first so entity_id has something
-- real to point at).

CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    user_id INT NOT NULL,
    approval_request_id INT NULL,
    leave_type VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(1000) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_requests_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_leave_requests_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_leave_requests_approval_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id),
    CONSTRAINT uq_leave_requests_approval_request UNIQUE (approval_request_id)
);

CREATE INDEX idx_leave_requests_school_user ON leave_requests (school_id, user_id);
CREATE INDEX idx_leave_requests_user_dates ON leave_requests (user_id, start_date, end_date);
