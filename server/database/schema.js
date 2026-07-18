import { pool } from './connection.js';

// Runs a schema-altering statement and swallows the "already applied" error
// so this stays safe to run on every boot (mirrors the existing index pattern).
// Used for changes to tables that may already exist from before multi-school
// support was introduced.
async function alterIfNeeded(sql, ignorableCodes) {
    try {
        await pool.query(sql);
    } catch (error) {
        if (!ignorableCodes.includes(error.code)) {
            throw error;
        }
    }
}

export const ensureCoreTables = async () => {

    // The tenant. Every school-owned table scopes its data to one of these.
    // See ERP Constitution: "Build for many schools, not one school."
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schools (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL UNIQUE,
            slug VARCHAR(150) NOT NULL UNIQUE,
            ownership_type VARCHAR(50) NULL,
            region VARCHAR(100) NULL,
            education_levels JSON NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NULL,
            role_name VARCHAR(100) NOT NULL,
            description VARCHAR(255) DEFAULT '',
            permissions JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_roles_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT uq_roles_school_name UNIQUE (school_id, role_name)
        )
    `);

    // Existing installs created the roles table before `permissions` existed —
    // add it if missing so upgrades don't require a manual migration step.
    await alterIfNeeded(
        `ALTER TABLE roles ADD COLUMN permissions JSON NULL AFTER description`,
        ['ER_DUP_FIELDNAME']
    );

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NULL,
            user_code VARCHAR(50) NOT NULL UNIQUE,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role_id INT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            last_login TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id)
        )
    `);

    // Planned vs actual dates, per the Calendar Engine design doc:
    // history must be preserved, so "actual_*" columns are only ever
    // written by lifecycle actions, never by a routine edit.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS academic_years (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            name VARCHAR(20) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            actual_start_date DATE NULL,
            actual_end_date DATE NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
            reason VARCHAR(255) NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_academic_years_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_academic_years_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_academic_years_school_name UNIQUE (school_id, name)
        )
    `);

    // Institutional memory: who changed what, when, and why. See ADR-003.
    // school_id is nullable: some actions (e.g. a platform admin creating a
    // school) aren't scoped to any single school.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id INT NOT NULL,
            action VARCHAR(50) NOT NULL,
            old_values JSON NULL,
            new_values JSON NULL,
            reason VARCHAR(255) NULL,
            performed_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_audit_logs_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_audit_logs_performed_by FOREIGN KEY (performed_by) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // A school term within an academic year. school_id is redundant with
    // academic_years.school_id but kept directly on the row so tenant-scoped
    // queries never need a join — standard practice for shared-schema SaaS.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS terms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            academic_year_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            actual_start_date DATE NULL,
            actual_end_date DATE NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
            reason VARCHAR(255) NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_terms_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_terms_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
            CONSTRAINT fk_terms_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_terms_year_name UNIQUE (academic_year_id, name)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_terms_academic_year ON terms (academic_year_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Existing installs (tables created before multi-school support) ---
    // These ALTERs are no-ops once applied. school_id is added nullable here
    // even where new installs get NOT NULL, because we can't safely guess
    // which school pre-existing rows belong to — see migration 005 for the
    // backfill note.
    await alterIfNeeded(`ALTER TABLE roles ADD COLUMN school_id INT NULL AFTER id`, ['ER_DUP_FIELDNAME']);
    await alterIfNeeded(`ALTER TABLE roles ADD CONSTRAINT fk_roles_school FOREIGN KEY (school_id) REFERENCES schools(id)`, ['ER_FK_DUP_NAME', 'ER_DUP_KEY']);
    await alterIfNeeded(`ALTER TABLE roles DROP INDEX role_name`, ['ER_CANT_DROP_FIELD_OR_KEY']);
    await alterIfNeeded(`ALTER TABLE roles ADD CONSTRAINT uq_roles_school_name UNIQUE (school_id, role_name)`, ['ER_DUP_KEYNAME']);

    await alterIfNeeded(`ALTER TABLE users ADD COLUMN school_id INT NULL AFTER id`, ['ER_DUP_FIELDNAME']);
    await alterIfNeeded(`ALTER TABLE users ADD CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id)`, ['ER_FK_DUP_NAME', 'ER_DUP_KEY']);

    await alterIfNeeded(`ALTER TABLE academic_years ADD COLUMN school_id INT NULL AFTER id`, ['ER_DUP_FIELDNAME']);
    await alterIfNeeded(`ALTER TABLE academic_years ADD CONSTRAINT fk_academic_years_school FOREIGN KEY (school_id) REFERENCES schools(id)`, ['ER_FK_DUP_NAME', 'ER_DUP_KEY']);
    await alterIfNeeded(`ALTER TABLE academic_years DROP INDEX name`, ['ER_CANT_DROP_FIELD_OR_KEY']);
    await alterIfNeeded(`ALTER TABLE academic_years ADD CONSTRAINT uq_academic_years_school_name UNIQUE (school_id, name)`, ['ER_DUP_KEYNAME']);

    await alterIfNeeded(`ALTER TABLE terms ADD COLUMN school_id INT NULL AFTER id`, ['ER_DUP_FIELDNAME']);
    await alterIfNeeded(`ALTER TABLE terms ADD CONSTRAINT fk_terms_school FOREIGN KEY (school_id) REFERENCES schools(id)`, ['ER_FK_DUP_NAME', 'ER_DUP_KEY']);

    await alterIfNeeded(`ALTER TABLE audit_logs ADD COLUMN school_id INT NULL AFTER id`, ['ER_DUP_FIELDNAME']);
    await alterIfNeeded(`ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_school FOREIGN KEY (school_id) REFERENCES schools(id)`, ['ER_FK_DUP_NAME', 'ER_DUP_KEY']);

    // --- Classes, Grades & Subjects ---
    // These are school-level structural tables (NOT scoped to an academic
    // year — per product decision, a class/grade/subject is a standing part
    // of the school's structure, not a per-year instance). Promotion/roster
    // history for students moving between classes each year belongs to a
    // future Students module, not here.

    // A school's own list of levels (e.g. "Grade 7"). education_level must
    // match one of the values the school configured in schools.education_levels
    // — enforced in the service layer, not the DB, since that list is itself
    // school-configurable (ADR-005: Configuration Over Hardcoding).
    await pool.query(`
        CREATE TABLE IF NOT EXISTS grade_levels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            education_level VARCHAR(50) NOT NULL,
            sequence_order INT NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_grade_levels_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_grade_levels_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_grade_levels_school_name UNIQUE (school_id, name)
        )
    `);

    // A school's reusable subject list. Subjects are not tied to a grade
    // level directly — which classes teach which subjects is decided by
    // class_subjects below, since e.g. Senior Secondary streams (Science vs
    // Arts) need different subject combinations within the same grade.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            code VARCHAR(20) NOT NULL,
            is_core TINYINT(1) NOT NULL DEFAULT 1,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_subjects_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_subjects_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_subjects_school_name UNIQUE (school_id, name),
            CONSTRAINT uq_subjects_school_code UNIQUE (school_id, code)
        )
    `);

    // An actual class/section (e.g. "Grade 7A") under a grade level.
    // school_id is redundant with grade_levels.school_id but kept directly
    // on the row so tenant-scoped queries never need a join — same reasoning
    // as terms.school_id.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            grade_level_id INT NOT NULL,
            name VARCHAR(50) NOT NULL,
            capacity INT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_classes_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_classes_grade_level FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id),
            CONSTRAINT fk_classes_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_classes_grade_level_name UNIQUE (grade_level_id, name)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_classes_grade_level ON classes (grade_level_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Which subjects a given class is taught. A join table rather than a
    // grade-level-wide list because streams within the same grade (e.g.
    // Science vs Arts in Senior Secondary) can differ.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS class_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            subject_id INT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_class_subjects_class FOREIGN KEY (class_id) REFERENCES classes(id),
            CONSTRAINT fk_class_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
            CONSTRAINT fk_class_subjects_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_class_subjects_class_subject UNIQUE (class_id, subject_id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_class_subjects_class ON class_subjects (class_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Students & Parents ---
    // Profiles only for now (Students & Parents Domain Module doc): students
    // and guardians are records the school administers, not yet portal
    // accounts. A future phase can link a student/guardian row to a `users`
    // row for login without changing anything here.

    // admission_number is school-configurable (schools already issue their
    // own physical admission numbers per the Gambian context doc), so it's
    // accepted from the caller and only auto-generated as a fallback in the
    // service layer — never assumed to follow one fixed format.
    await pool.query(`
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
        )
    `);

    // A guardian is registered once per school and can be linked to more
    // than one student (siblings) via student_guardians below — a guardian
    // is not owned by a single student.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_guardians_phone ON guardians (phone)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Many-to-many: a student can have more than one guardian (mother,
    // father, etc.) and a guardian can have more than one student (siblings).
    // relationship is per-pairing, not per-guardian, since the same person
    // could be e.g. "Father" to one student and "Uncle" to another.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_student_guardians_guardian ON student_guardians (guardian_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Roster history: one row per student per academic year, per the
    // "Promotion/roster history... belongs to a future Students module" note
    // above. A mid-year section change updates class_id on the same row
    // (TRANSFERRED audit action); moving to a new academic year is always a
    // new row, so a student's full class history is never overwritten.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_student_enrollments_class ON student_enrollments (class_id, academic_year_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Attendance ---
    // One row per student per calendar day. class_id and academic_year_id
    // are snapshotted at the time attendance is taken (resolved from the
    // student's enrollment for that class) rather than looked up live from
    // student_enrollments — a later mid-year transfer updates the
    // enrollment's class_id in place (see student_enrollments above), and
    // attendance history must keep showing the class the student was
    // actually marked in that day, not wherever they sit today (ADR-002:
    // never confuse planned/current state with what actually happened).
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_attendance_class_date ON attendance_records (class_id, attendance_date)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });
};
