-- Finance: Fee Structures, Invoices, Payments.
-- Per the ERP Constitution and ADR-003: financial mutations are never
-- silently deleted — invoices and payments are voided (with a required
-- reason) and audit-logged, never removed.

-- A fee a school charges for a given academic year, optionally scoped to
-- one grade level (NULL = applies to every grade). Amount is per-year
-- deliberately, not hardcoded, since fees change year to year.
CREATE TABLE IF NOT EXISTS fee_structures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  grade_level_id INT NULL,
  name VARCHAR(150) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_fee_structures_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_fee_structures_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT fk_fee_structures_grade_level FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id),
  CONSTRAINT fk_fee_structures_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- A bill issued to one student. amount_paid is a maintained running total
-- (kept in sync by the payment service inside a transaction), so reading a
-- balance never requires summing payments live.
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  student_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  term_id INT NULL,
  fee_structure_id INT NULL,
  description VARCHAR(255) NOT NULL,
  amount_due DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  due_date DATE NULL,
  reason VARCHAR(255) NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_invoices_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_invoices_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_invoices_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT fk_invoices_term FOREIGN KEY (term_id) REFERENCES terms(id),
  CONSTRAINT fk_invoices_fee_structure FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id),
  CONSTRAINT fk_invoices_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_invoices_student ON invoices (student_id);

-- A payment recorded against one invoice. Never deleted — a mistaken or
-- reversed payment is voided with a reason, preserving the full history.
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  invoice_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  payment_date DATE NOT NULL,
  reference_number VARCHAR(100) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  reason VARCHAR(255) NULL,
  received_by INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_payments_received_by FOREIGN KEY (received_by) REFERENCES users(id),
  CONSTRAINT fk_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_payments_invoice ON payments (invoice_id);
