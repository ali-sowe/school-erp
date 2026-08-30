-- Attendance module. One row per student per calendar day.
--
-- class_id and academic_year_id are snapshotted from the student's
-- enrollment at the time attendance is recorded, not derived live from
-- student_enrollments each time it's read: a mid-year transfer updates the
-- enrollment's class_id in place, and attendance already taken must keep
-- reflecting the class the student was actually marked in that day (see
-- ADR-002 -- planned/current state must never overwrite what actually
-- happened).

CREATE TABLE IF NOT EXISTS attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    remarks VARCHAR(255) NULL,
    recorded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_attendance_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_attendance_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_attendance_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    CONSTRAINT fk_attendance_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id),
    CONSTRAINT uq_attendance_student_date UNIQUE (student_id, attendance_date)
);

CREATE INDEX idx_attendance_class_date ON attendance_records (class_id, attendance_date);
