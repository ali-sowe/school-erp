-- Expense Tracker: school operating expenses (money going OUT), distinct
-- from fee_structures/invoices/payments (student fees coming IN).
--
-- expense_categories is school-configurable (ADR-005: Configuration Over
-- Hardcoding) — same pattern as grade_levels/subjects: a school's own list,
-- not a fixed enum, since operating cost categories vary school to school.
--
-- expenses deliberately has NO status column — same reasoning as
-- leave_requests (see 019_create_leave_requests.sql): every expense is
-- approval-gated (product decision), and status always comes from the
-- linked approval_requests row via a join, so nothing here can drift out
-- of sync with the approval chain's actual state. approval_request_id is
-- nullable and filled in right after the approval chain is created, same
-- ordering as leave_requests.
--
-- Receipt attachments reuse the existing documents table
-- (related_entity_type='Expense', related_entity_id=expenses.id) — no
-- schema change needed there, per the Documents module's polymorphic
-- reference design.

CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_categories_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_expense_categories_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_expense_categories_school_name UNIQUE (school_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    category_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    approval_request_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    vendor_name VARCHAR(150) NULL,
    payment_method VARCHAR(30) NULL,
    reference_number VARCHAR(100) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_expenses_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    CONSTRAINT fk_expenses_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    CONSTRAINT fk_expenses_approval_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id),
    CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_expenses_approval_request UNIQUE (approval_request_id)
);

CREATE INDEX idx_expenses_school_category ON expenses (school_id, category_id);
CREATE INDEX idx_expenses_academic_year ON expenses (academic_year_id);
