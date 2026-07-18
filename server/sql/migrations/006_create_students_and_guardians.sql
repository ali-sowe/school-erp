-- Students & Parents domain module.
-- Profiles only for now: students and guardians are school-administered
-- records, not portal accounts. A future migration can add a nullable
-- user_id to students/guardians to link a login without touching this shape.

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    admission_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NULL,
    date_of_birth DATE NULL,
    admission_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_students_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_students_school_admission_number UNIQUE (school_id, admission_number)
);

CREATE TABLE IF NOT EXISTS guardians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    address VARCHAR(255) NULL,
    occupation VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_guardians_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_guardians_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_guardians_phone ON guardians (phone);

-- Many-to-many: a student can have multiple guardians, a guardian can have
-- multiple students (siblings). relationship lives on the pairing, not on
-- the guardian, since the same person can be "Father" to one student and
-- "Uncle" to another.
CREATE TABLE IF NOT EXISTS student_guardians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    guardian_id INT NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    is_primary_contact TINYINT(1) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_guardians_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_student_guardians_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id),
    CONSTRAINT fk_student_guardians_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_student_guardians_pair UNIQUE (student_id, guardian_id)
);

CREATE INDEX idx_student_guardians_guardian ON student_guardians (guardian_id);

-- One row per student per academic year, so promotion/roster history is
-- preserved instead of overwritten (see the note left in the classes section
-- of schema.js when the Classes module was built). A mid-year section swap
-- updates class_id on the same row (TRANSFERRED); a new academic year is
-- always a new row.
CREATE TABLE IF NOT EXISTS student_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    student_id INT NOT NULL,
    academic_year_id INT NOT NULL,
    class_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    enrolled_date DATE NOT NULL,
    reason VARCHAR(255) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_enrollments_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_student_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_student_enrollments_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    CONSTRAINT fk_student_enrollments_class FOREIGN KEY (class_id) REFERENCES classes(id),
    CONSTRAINT fk_student_enrollments_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT uq_student_enrollments_student_year UNIQUE (student_id, academic_year_id)
);

CREATE INDEX idx_student_enrollments_class ON student_enrollments (class_id, academic_year_id);
