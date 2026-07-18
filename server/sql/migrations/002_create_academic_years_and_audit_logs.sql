CREATE TABLE IF NOT EXISTS academic_years (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE,

  -- Planned dates: what was scheduled.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Actual dates: what really happened. Never overwritten by planning edits,
  -- only set by lifecycle actions (auto activation/completion or an
  -- authorized override). See docs: School Calendar Engine Design.
  actual_start_date DATE NULL,
  actual_end_date DATE NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  reason VARCHAR(255) NULL,

  -- Every table needs an owner.
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_academic_years_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  reason VARCHAR(255) NULL,
  performed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_logs_performed_by FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
