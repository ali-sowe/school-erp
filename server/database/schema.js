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

    // Portal login link (Student Portal). Nullable and added after the
    // fact deliberately — most students won't have one; a login is
    // provisioned on request via student-portal-account.service.js, the
    // same "extends users, doesn't duplicate identity" relationship
    // teachers already have, just optional here instead of required.
    await alterIfNeeded(`ALTER TABLE students ADD COLUMN user_id INT NULL AFTER school_id`, ['ER_DUP_FIELDNAME']);
    await alterIfNeeded(`ALTER TABLE students ADD CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id)`, ['ER_FK_DUP_NAME', 'ER_DUP_KEY']);
    await alterIfNeeded(`ALTER TABLE students ADD CONSTRAINT uq_students_user UNIQUE (user_id)`, ['ER_DUP_KEYNAME']);

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

    // Portal login link (Parent Portal) — same optional, added-after-the-
    // fact relationship as students.user_id above.
    await alterIfNeeded(`ALTER TABLE guardians ADD COLUMN user_id INT NULL AFTER school_id`, ['ER_DUP_FIELDNAME']);
    await alterIfNeeded(`ALTER TABLE guardians ADD CONSTRAINT fk_guardians_user FOREIGN KEY (user_id) REFERENCES users(id)`, ['ER_FK_DUP_NAME', 'ER_DUP_KEY']);
    await alterIfNeeded(`ALTER TABLE guardians ADD CONSTRAINT uq_guardians_user UNIQUE (user_id)`, ['ER_DUP_KEYNAME']);

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

    // --- Teacher Management ---
    // A teacher IS a user (they log in, mark attendance -- the "Teacher"
    // role already seeded per school has real permissions). Identity/auth
    // stays on `users`; this table only adds employment fields a login
    // doesn't carry, the same separation `roles` already has from `users`.
    await pool.query(`
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
        )
    `);

    // Who teaches a given subject to a given class, for a given academic
    // year. One row per (class, subject, year) -- a mid-year reassignment
    // updates teacher_id in place (same pattern as student_enrollments
    // "transfer"), with the change preserved via the audit log, not a
    // second row.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_tsa_teacher ON teacher_subject_assignments (teacher_id, academic_year_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // The homeroom/form teacher responsible for a whole class, for a given
    // academic year. Same one-row-per-year, update-in-place shape.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_class_teachers_teacher ON class_teachers (teacher_id, academic_year_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Finance ---
    // Never hard-deleted: a mistaken invoice or payment is voided (with a
    // required reason) and audit-logged, per ADR-003 and the Constitution's
    // "important actions require audit history."

    await pool.query(`
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
        )
    `);

    // amount_paid is a maintained running total, kept in sync by the payment
    // service inside a transaction — reading a balance never sums live.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_invoices_student ON invoices (student_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_payments_invoice ON payments (invoice_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Exams ---
    // Per the Constitution's own canonical plans-vs-reality example ("changed
    // exam schedules"), exams get the same planned_*/actual_* treatment as
    // academic years and terms.

    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_exams_class_year ON exams (class_id, academic_year_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Subject list is locked once the exam starts (see exam.service.js).
    await pool.query(`
        CREATE TABLE IF NOT EXISTS exam_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            exam_id INT NOT NULL,
            subject_id INT NOT NULL,
            max_score DECIMAL(6,2) NOT NULL DEFAULT 100,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_exam_subjects_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
            CONSTRAINT fk_exam_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
            CONSTRAINT uq_exam_subjects UNIQUE (exam_id, subject_id)
        )
    `);

    // max_score is snapshotted at entry time, not re-read from exam_subjects,
    // so a later max_score change never silently reinterprets a past score.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_exam_results_student ON exam_results (student_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Messaging ---
    // Staff-to-staff only for now: messaging/conversations were designed
    // and built before student/parent portal accounts existed, and haven't
    // been extended to include them as participants yet (portal accounts
    // are real logins now — see users.student_id/guardian_id below — this
    // is just messaging not using them yet, not a technical limitation).
    // Announcements below still compute and store a school/grade/class
    // audience so the targeting is correct and ready for portal delivery
    // whenever messaging is extended to include them.

    await pool.query(`
        CREATE TABLE IF NOT EXISTS conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            type VARCHAR(20) NOT NULL DEFAULT 'DIRECT',
            title VARCHAR(150) NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_conversations_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_conversations_created_by FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    // last_read_at drives unread counts without a per-message read-receipt
    // table — good enough for a conversation view, and much cheaper to
    // maintain than one row per (message, participant).
    await pool.query(`
        CREATE TABLE IF NOT EXISTS conversation_participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            user_id INT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            last_read_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_conversation_participants_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            CONSTRAINT fk_conversation_participants_user FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT uq_conversation_participants UNIQUE (conversation_id, user_id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_conversation_participants_user ON conversation_participants (user_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // status supports a soft "unsend" (DELETED) without losing the row —
    // consistent with "preserve history instead of silently overwriting."
    await pool.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            body TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'SENT',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
            CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // audience_id is interpreted according to audience_type: NULL for
    // SCHOOL, a grade_level_id for GRADE_LEVEL, a class_id for CLASS. Kept
    // as a single nullable column (rather than two FK columns) since exactly
    // one of those meanings ever applies per row.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            author_id INT NOT NULL,
            title VARCHAR(150) NOT NULL,
            body TEXT NOT NULL,
            audience_type VARCHAR(20) NOT NULL DEFAULT 'SCHOOL',
            audience_id INT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_announcements_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users(id),
            CONSTRAINT fk_announcements_created_by FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_announcements_school ON announcements (school_id, status)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Tracks who has viewed an announcement. Only users (today: staff) can
    // have a row here, for the same reason messaging is staff-only — but the
    // table works unmodified for guardians/students once they get user_id.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS announcement_reads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            announcement_id INT NOT NULL,
            user_id INT NOT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_announcement_reads_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id),
            CONSTRAINT fk_announcement_reads_user FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT uq_announcement_reads UNIQUE (announcement_id, user_id)
        )
    `);

    // --- Notifications ---
    // A persisted, per-recipient inbox that sits on top of the same
    // real-time layer messaging already uses (realtime.helper.js): every
    // notification is written here first, then pushed live if the
    // recipient is connected. That order means a user who was offline still
    // sees what they missed — the socket push is a convenience, not the
    // source of truth (same REST-first shape as messages/announcements).
    // Staff-to-staff only for now, for the same reason messaging is: no
    // student/guardian login yet. type/related_entity_* let any module
    // (messaging, finance, exams, ...) hook in without a schema change —
    // see notification.service.js#notifyUsers.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            user_id INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(150) NOT NULL,
            body VARCHAR(500) NULL,
            related_entity_type VARCHAR(50) NULL,
            related_entity_id INT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            read_at TIMESTAMP NULL,
            triggered_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_notifications_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT fk_notifications_triggered_by FOREIGN KEY (triggered_by) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Library ---
    // books is the catalog entry (one row per title); book_copies is the
    // physical inventory (one row per copy a school actually owns). Borrowing
    // always happens against a specific copy, never against the title
    // directly, so two students can't simultaneously "have" the same copy —
    // book_copies.status is the single source of truth for whether a given
    // copy is currently out, mirroring how invoices/payments keep amount_paid
    // as a maintained derived value rather than something computed ad hoc at
    // read time (see invoice.repository.js#recalculateBalance).
    await pool.query(`
        CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(150) NULL,
            isbn VARCHAR(20) NULL,
            category VARCHAR(100) NULL,
            publisher VARCHAR(150) NULL,
            description TEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_books_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_books_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_books_school_isbn UNIQUE (school_id, isbn)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_books_school_title ON books (school_id, title)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // copy_number is the school's own physical tag/barcode — optional
    // (uq_book_copies_school_copy_number only enforces uniqueness when set;
    // MySQL unique indexes treat multiple NULLs as distinct).
    await pool.query(`
        CREATE TABLE IF NOT EXISTS book_copies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            book_id INT NOT NULL,
            copy_number VARCHAR(50) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
            reason VARCHAR(255) NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_book_copies_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_book_copies_book FOREIGN KEY (book_id) REFERENCES books(id),
            CONSTRAINT fk_book_copies_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_book_copies_school_copy_number UNIQUE (school_id, copy_number)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_book_copies_book_status ON book_copies (book_id, status)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // One row per checkout, updated in place on return (same shape as
    // student_enrollments: a single mutable record, not a create-then-child
    // pattern) — a copy's borrow/return is one continuous event, not two.
    // "Overdue" is deliberately not a stored status: it's derived at query
    // time from due_date/status (see borrow.repository.js), so there's no
    // lifecycle cron job to keep in sync — the same reasoning that made the
    // academic-year/term lifecycle bug worth fixing applies here in reverse:
    // fewer independently-updated copies of the truth, fewer ways to drift.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS borrow_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            book_copy_id INT NOT NULL,
            student_id INT NOT NULL,
            borrowed_date DATE NOT NULL,
            due_date DATE NOT NULL,
            returned_date DATE NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'BORROWED',
            remarks VARCHAR(255) NULL,
            issued_by INT NULL,
            returned_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_borrow_records_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_borrow_records_copy FOREIGN KEY (book_copy_id) REFERENCES book_copies(id),
            CONSTRAINT fk_borrow_records_student FOREIGN KEY (student_id) REFERENCES students(id),
            CONSTRAINT fk_borrow_records_issued_by FOREIGN KEY (issued_by) REFERENCES users(id),
            CONSTRAINT fk_borrow_records_returned_by FOREIGN KEY (returned_by) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_borrow_records_student ON borrow_records (student_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    await pool.query(`
        CREATE INDEX idx_borrow_records_copy ON borrow_records (book_copy_id, status)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Approval Workflow Engine (ADR-004) ---
    // A deliberately generic engine, not a per-feature one: "important
    // decisions should support visible workflows... academic overrides,
    // payments, leave requests, student transfers, administrative
    // decisions" (Documentation Index). workflow_type is a free string
    // (e.g. 'INVOICE_VOID', 'STUDENT_TRANSFER') rather than a fixed enum
    // table, same reasoning as attendance.status/notifications.type — new
    // workflow types are a config choice for a calling module, not a schema
    // change (ADR-005: Configuration Over Hardcoding).
    //
    // entity_type/entity_id optionally link this request to the record it's
    // about, mirroring audit_logs' and notifications' polymorphic reference
    // — intentionally unvalidated/unconstrained here (no FK, no lookup) so
    // the engine stays decoupled from every module that might use it.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS approval_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            workflow_type VARCHAR(50) NOT NULL,
            entity_type VARCHAR(100) NULL,
            entity_id INT NULL,
            title VARCHAR(255) NOT NULL,
            description VARCHAR(1000) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
            requested_by INT NULL,
            executed_at TIMESTAMP NULL,
            executed_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_approval_requests_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_approval_requests_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
            CONSTRAINT fk_approval_requests_executed_by FOREIGN KEY (executed_by) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_approval_requests_school_status ON approval_requests (school_id, status)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Workflow-specific data an executor needs beyond entity_id (e.g.
    // STUDENT_TRANSFER's target class_id) — a nullable JSON column so this
    // stays generic (ADR-005) rather than adding workflow-specific columns
    // to a table that's deliberately decoupled from every module using it.
    await alterIfNeeded(
        `ALTER TABLE approval_requests ADD COLUMN metadata JSON NULL AFTER description`,
        ['ER_DUP_FIELDNAME']
    );

    // The approval chain for one request, one row per stage, created
    // up front for the whole chain (not lazily as each stage is reached) so
    // the full planned path is visible immediately — "users should see...
    // next required action" doesn't require guessing what comes after the
    // current stage. Stages are still worked strictly in step_number order:
    // the "current" stage is always whichever PENDING row has the lowest
    // step_number, derived at read time rather than tracked in a separate
    // counter column (same "fewer independently-updated copies of the
    // truth" reasoning as borrow_records' derived overdue status above).
    //
    // Exactly one of approver_user_id/approver_role_name is set per step
    // (enforced in the service layer): a step can name a specific person or
    // "anyone holding this role", since small schools often don't have a
    // dedicated named approver for every workflow.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS approval_steps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            approval_request_id INT NOT NULL,
            step_number INT NOT NULL,
            approver_user_id INT NULL,
            approver_role_name VARCHAR(100) NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            decided_by INT NULL,
            decided_at TIMESTAMP NULL,
            comment VARCHAR(500) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_approval_steps_request FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id),
            CONSTRAINT fk_approval_steps_approver_user FOREIGN KEY (approver_user_id) REFERENCES users(id),
            CONSTRAINT fk_approval_steps_decided_by FOREIGN KEY (decided_by) REFERENCES users(id),
            CONSTRAINT uq_approval_steps_request_step UNIQUE (approval_request_id, step_number)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_approval_steps_request ON approval_steps (approval_request_id, status)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Documents (Office Document Processing ADR) ---
    // Shared storage foundation both halves of the ADR build on: readable
    // documents (letters, circulars, policies — preview/text-extract/search
    // land on top of this later) and data documents (Excel imports — the
    // parse/validate/import pipeline lands on top of this later). This
    // table only owns "a file was uploaded and is safely on disk with
    // metadata" — nothing about processing either kind yet.
    //
    // `kind` (READABLE/DATA) is derived server-side from the file extension
    // at upload time (see document.helper.js#deriveDocumentKind), not
    // client-supplied, so a future processing job can pick up exactly the
    // rows it knows how to handle without re-deriving anything.
    //
    // `category` is a free string, not an enum table — same reasoning as
    // books.category (ADR-005: Configuration Over Hardcoding): schools
    // shouldn't need a migration to add a new document category.
    //
    // related_entity_type/related_entity_id is the same optional polymorphic
    // reference notifications/approval_requests use, so any module can
    // attach a document (a student's certificate, a class's circular)
    // without a schema change.
    //
    // stored_filename is a generated name (uuid + original extension), never
    // the user-supplied filename — original_filename is kept separately for
    // display/download so path traversal / filename collisions on disk
    // aren't a concern.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS documents (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            kind VARCHAR(20) NOT NULL,
            category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
            title VARCHAR(255) NOT NULL,
            description VARCHAR(1000) NULL,
            related_entity_type VARCHAR(50) NULL,
            related_entity_id INT NULL,
            original_filename VARCHAR(255) NOT NULL,
            stored_filename VARCHAR(255) NOT NULL,
            storage_path VARCHAR(500) NOT NULL,
            file_extension VARCHAR(10) NOT NULL,
            mime_type VARCHAR(150) NOT NULL,
            file_size_bytes INT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_documents_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_documents_created_by FOREIGN KEY (created_by) REFERENCES users(id),
            CONSTRAINT uq_documents_stored_filename UNIQUE (stored_filename)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_documents_school_category ON documents (school_id, category)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    await pool.query(`
        CREATE INDEX idx_documents_entity ON documents (related_entity_type, related_entity_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Processing columns (readable-document half of the ADR): populated
    // asynchronously after upload by document-processing.service.js, never
    // on the upload request itself — conversion/extraction can take a few
    // seconds and shouldn't hold the HTTP response open. Two independent
    // status columns (not one) because a file can have a ready preview but
    // failed text extraction, or vice versa.
    await alterIfNeeded(
        `ALTER TABLE documents ADD COLUMN preview_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER file_size_bytes`,
        ['ER_DUP_FIELDNAME']
    );
    await alterIfNeeded(
        `ALTER TABLE documents ADD COLUMN preview_storage_path VARCHAR(500) NULL AFTER preview_status`,
        ['ER_DUP_FIELDNAME']
    );
    await alterIfNeeded(
        `ALTER TABLE documents ADD COLUMN text_extraction_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER preview_storage_path`,
        ['ER_DUP_FIELDNAME']
    );
    await alterIfNeeded(
        `ALTER TABLE documents ADD COLUMN extracted_text LONGTEXT NULL AFTER text_extraction_status`,
        ['ER_DUP_FIELDNAME']
    );
    await alterIfNeeded(
        `ALTER TABLE documents ADD COLUMN processed_at TIMESTAMP NULL AFTER extracted_text`,
        ['ER_DUP_FIELDNAME']
    );

    // "Index for global search" (ADR) — a MySQL FULLTEXT index rather than
    // a separate search engine: schools this size don't need Elasticsearch,
    // and MATCH...AGAINST gives real relevance ranking over title/
    // description/extracted_text for free (same "don't over-engineer for
    // this scale" reasoning as books.findAll's LIKE search, one level up).
    await pool.query(`
        ALTER TABLE documents ADD FULLTEXT INDEX ft_documents_search (title, description, extracted_text)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Data Import Engine (data-document half of the ADR) ---
    // Deliberately generic, same shape as the Approval Workflow Engine:
    // target_type is a free string a calling module registers an importer
    // for (services/data-import/importer-registry.js), not a fixed enum —
    // adding "TEACHERS" or "EXAM_MARKS" later is a new registry entry, not
    // a schema change (ADR-005).
    //
    // context is importer-specific data the row validator/importer needs
    // beyond the spreadsheet itself (e.g. which class_id student rows
    // should enroll into) — same nullable-JSON escape hatch as
    // approval_requests.metadata.
    //
    // One row per uploaded file per import attempt (document_id, not a
    // 1:1 on documents) so the same spreadsheet could in principle be
    // re-run, and so a batch's own lifecycle (validated -> confirmed ->
    // imported) doesn't have to be squeezed into the documents table.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS import_batches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            document_id INT NOT NULL,
            target_type VARCHAR(50) NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VALIDATION',
            context JSON NULL,
            total_rows INT NOT NULL DEFAULT 0,
            valid_rows INT NOT NULL DEFAULT 0,
            invalid_rows INT NOT NULL DEFAULT 0,
            imported_rows INT NOT NULL DEFAULT 0,
            failed_rows INT NOT NULL DEFAULT 0,
            validation_error VARCHAR(500) NULL,
            validated_at TIMESTAMP NULL,
            confirmed_by INT NULL,
            confirmed_at TIMESTAMP NULL,
            imported_at TIMESTAMP NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_import_batches_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_import_batches_document FOREIGN KEY (document_id) REFERENCES documents(id),
            CONSTRAINT fk_import_batches_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id),
            CONSTRAINT fk_import_batches_created_by FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_import_batches_school_status ON import_batches (school_id, status)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // One row per spreadsheet row — the persisted "import preview" the ADR
    // requires (show what will happen before it happens). raw_data is
    // exactly what was parsed from the sheet; normalized_data is what the
    // importer will actually write (set once validateRow accepts a row) —
    // kept separate so the preview can always show the user's original
    // input even after normalization (trimmed strings, parsed dates, ...).
    await pool.query(`
        CREATE TABLE IF NOT EXISTS import_batch_rows (
            id INT AUTO_INCREMENT PRIMARY KEY,
            import_batch_id INT NOT NULL,
            row_number INT NOT NULL,
            raw_data JSON NOT NULL,
            normalized_data JSON NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            errors JSON NULL,
            imported_entity_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_import_batch_rows_batch FOREIGN KEY (import_batch_id) REFERENCES import_batches(id),
            CONSTRAINT uq_import_batch_rows_batch_row UNIQUE (import_batch_id, row_number)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_import_batch_rows_batch_status ON import_batch_rows (import_batch_id, status)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Leave Requests ---
    // A thin domain entity riding entirely on the Approval Workflow Engine
    // (ADR-004) — same relationship STUDENT_TRANSFER has to Enrollment.
    // This table only ever holds the immutable submission (who, what kind
    // of leave, which dates, why); it deliberately has no status column of
    // its own. Status (PENDING_REVIEW/APPROVED/REJECTED/CANCELLED/EXECUTED)
    // always comes from the linked approval_requests row — a duplicated
    // status column here could drift out of sync on reject/cancel (the
    // engine only calls a registered executor on the execute step, not on
    // every transition), so there's deliberately nothing here that could
    // drift.
    //
    // approval_request_id is nullable and filled in right after the
    // approval chain is created (see leave-request.service.js) — the row
    // itself is inserted first so entity_id has something real to point at,
    // same ordering reasoning as Enrollment existing before
    // requestStudentTransfer creates its approval request.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_leave_requests_school_user ON leave_requests (school_id, user_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Backs the overlap check in leave-request.helper.js — one user
    // shouldn't be able to have two leave requests covering the same days
    // both still in play.
    await pool.query(`
        CREATE INDEX idx_leave_requests_user_dates ON leave_requests (user_id, start_date, end_date)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Self-service password reset. Only token_hash is ever stored — never
    // the raw token — same reasoning as users.password: even a full DB
    // read shouldn't hand out something usable. A row is single-use
    // (used_at) and short-lived (expires_at), checked together in
    // password-reset.repository.js's findValidByTokenHash rather than
    // deleted outright, so a used or expired attempt still has something
    // to log against.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT uq_password_reset_tokens_hash UNIQUE (token_hash)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // Rotation chain: each refresh issues a new row and revokes the old one
    // (replaced_by_id), so reuse of an already-rotated-out token is
    // detectable — see refresh-token.repository.js / auth.service.js.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            revoked_at TIMESTAMP NULL,
            replaced_by_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT fk_refresh_tokens_replaced_by FOREIGN KEY (replaced_by_id) REFERENCES refresh_tokens(id),
            CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Expense Tracker ---
    // School operating expenses (money going OUT), distinct from
    // fee_structures/invoices/payments (student fees coming IN).

    // School-configurable categories (ADR-005: Configuration Over
    // Hardcoding) — same pattern as grade_levels/subjects.
    await pool.query(`
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
        )
    `);

    // Deliberately NO status column — same reasoning as leave_requests:
    // every expense is approval-gated (product decision), so status always
    // comes from the linked approval_requests row via a join, and nothing
    // here can drift out of sync with the approval chain's actual state.
    // Receipt attachments reuse the existing documents table
    // (related_entity_type='Expense', related_entity_id=expenses.id).
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_expenses_school_category ON expenses (school_id, category_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    await pool.query(`
        CREATE INDEX idx_expenses_academic_year ON expenses (academic_year_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- Multi-Factor Authentication ---
    // Ported from sql/migrations/024_create_mfa.sql, which defines these
    // tables but — unlike every earlier migration — was never actually
    // added here. server.js only ever calls ensureCoreTables(), never reads
    // the sql/migrations/*.sql files directly (they're history/documentation,
    // not executed), so without this block MFA's routes exist but every one
    // of them 500s against a table that was never created. See that file
    // for the full reasoning behind each table.
    await alterIfNeeded(`ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER status`, ['ER_DUP_FIELDNAME']);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mfa_secrets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            secret_encrypted VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            confirmed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_mfa_secrets_user FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT uq_mfa_secrets_user UNIQUE (user_id)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mfa_backup_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            code_hash VARCHAR(255) NOT NULL,
            used_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_mfa_backup_codes_user FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_mfa_backup_codes_user ON mfa_backup_codes (user_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mfa_challenges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            challenge_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            consumed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_mfa_challenges_user FOREIGN KEY (user_id) REFERENCES users(id),
            CONSTRAINT uq_mfa_challenges_hash UNIQUE (challenge_hash)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_mfa_challenges_user ON mfa_challenges (user_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // --- School Calendar Engine: holidays & school events ---
    // Academic years and terms already implement this engine's lifecycle
    // half (SCHEDULED -> ACTIVE -> COMPLETED); this is the "holidays, exam
    // periods, school events" half. See sql/migrations/025_create_calendar_events.sql
    // for why this deliberately isn't auto-recurring by month/day.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            academic_year_id INT NOT NULL,
            title VARCHAR(150) NOT NULL,
            description VARCHAR(1000) NULL,
            category VARCHAR(50) NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            is_school_closed BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_calendar_events_school FOREIGN KEY (school_id) REFERENCES schools(id),
            CONSTRAINT fk_calendar_events_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
            CONSTRAINT fk_calendar_events_created_by FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    await pool.query(`
        CREATE INDEX idx_calendar_events_year ON calendar_events (academic_year_id)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    await pool.query(`
        CREATE INDEX idx_calendar_events_school_dates ON calendar_events (school_id, is_school_closed, start_date, end_date)
    `).catch((error) => {
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });
};
