-- Exams. Per the ERP Constitution's own canonical plans-vs-reality example
-- ("changed exam schedules") and the Calendar Engine doc, exam schedules get
-- the same planned_* / actual_* treatment as academic years and terms.

CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  class_id INT NOT NULL,
  academic_year_id INT NOT NULL,
  term_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  exam_type VARCHAR(30) NOT NULL DEFAULT 'END_OF_TERM',

  planned_start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_start_date DATE NULL,
  actual_end_date DATE NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  reason VARCHAR(255) NULL,

  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_exams_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_exams_class FOREIGN KEY (class_id) REFERENCES classes(id),
  CONSTRAINT fk_exams_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT fk_exams_term FOREIGN KEY (term_id) REFERENCES terms(id),
  CONSTRAINT fk_exams_created_by FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT uq_exams_class_year_name UNIQUE (class_id, academic_year_id, name)
);

CREATE INDEX idx_exams_class_year ON exams (class_id, academic_year_id);

-- Which of the class's subjects are examined, and out of how much. Subject
-- list is locked once the exam starts (see exam.service.js) so results are
-- never entered against a scope that's still shifting.
CREATE TABLE IF NOT EXISTS exam_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  subject_id INT NOT NULL,
  max_score DECIMAL(6,2) NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_exam_subjects_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
  CONSTRAINT fk_exam_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT uq_exam_subjects UNIQUE (exam_id, subject_id)
);

-- One student's score in one subject of one exam. max_score is snapshotted
-- at entry time (not re-read from exam_subjects) so a later max_score change
-- never silently reinterprets an already-recorded score.
CREATE TABLE IF NOT EXISTS exam_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  exam_id INT NOT NULL,
  subject_id INT NOT NULL,
  student_id INT NOT NULL,
  score DECIMAL(6,2) NOT NULL,
  max_score DECIMAL(6,2) NOT NULL,
  remarks VARCHAR(255) NULL,
  recorded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_exam_results_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_exam_results_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
  CONSTRAINT fk_exam_results_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_exam_results_student FOREIGN KEY (student_id) REFERENCES students(id),
  CONSTRAINT fk_exam_results_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id),
  CONSTRAINT uq_exam_results UNIQUE (exam_id, subject_id, student_id)
);

CREATE INDEX idx_exam_results_student ON exam_results (student_id);
