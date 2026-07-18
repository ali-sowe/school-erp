CREATE TABLE IF NOT EXISTS terms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  academic_year_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,

  -- Planned dates: what was scheduled.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Actual dates: what really happened. Same planned-vs-actual philosophy
  -- as academic_years (see docs: School Calendar Engine Design).
  actual_start_date DATE NULL,
  actual_end_date DATE NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  reason VARCHAR(255) NULL,

  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_terms_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT fk_terms_created_by FOREIGN KEY (created_by) REFERENCES users(id),

  -- A term name only needs to be unique within its own academic year
  -- ("Term 1" can and will repeat every year).
  CONSTRAINT uq_terms_year_name UNIQUE (academic_year_id, name)
);

CREATE INDEX idx_terms_academic_year ON terms (academic_year_id);
