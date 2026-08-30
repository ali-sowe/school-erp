-- Teacher Management module.
--
-- A teacher IS a user (they log in and mark attendance -- a "Teacher" role
-- with real permissions is already seeded per school in school.service.js).
-- So identity/auth (name, email, password) stays on `users`; `teachers` only
-- adds the employment fields a login doesn't have. This mirrors why `roles`
-- carries permissions separately from `users` -- one concern per table.
--
-- teacher_subject_assignments and class_teachers both follow the same
-- shape as student_enrollments: one row per (scope, academic_year), updated
-- in place when reassigned rather than inserted as a new row each time.
-- History is preserved through the audit log (ADR-003), not by keeping old
-- rows around -- consistent with how enrollment "transfer" and attendance
-- "correct" both update in place.

CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    user_id INT NOT NULL,
    employee_number VARCHAR(50) NOT NULL,
    qualification VARCHAR(150) NULL,
    specialization VARCHAR(150) NULL,
    hire_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_teachers_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_teachers_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_teachers_user UNIQUE (user_id),
    CONSTRAINT uq_teachers_school_employee_number UNIQUE (school_id, employee_number)
);

-- Which teacher teaches a given subject to a given class, for a given
-- academic year. One row per (class, subject, year) -- reassigning mid-year
-- updates teacher_id on the same row rather than creating a second "who
-- really teaches this" row.
CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tsa_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_tsa_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    CONSTRAINT fk_tsa_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_tsa_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
    CONSTRAINT fk_tsa_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    CONSTRAINT fk_tsa_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_tsa_class_subject_year UNIQUE (class_id, subject_id, academic_year_id)
);

CREATE INDEX idx_tsa_teacher ON teacher_subject_assignments (teacher_id, academic_year_id);

-- The homeroom/form teacher responsible for a whole class, for a given
-- academic year. One row per (class, year) -- same update-in-place pattern.
CREATE TABLE IF NOT EXISTS class_teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    class_id INT NOT NULL,
    teacher_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_teachers_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_class_teachers_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_class_teachers_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    CONSTRAINT fk_class_teachers_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    CONSTRAINT fk_class_teachers_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_class_teachers_class_year UNIQUE (class_id, academic_year_id)
);

CREATE INDEX idx_class_teachers_teacher ON class_teachers (teacher_id, academic_year_id);
