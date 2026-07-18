import { pool } from './connection.js';

export const ensureCoreTables = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(100) NOT NULL UNIQUE,
            description VARCHAR(255) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_code VARCHAR(50) NOT NULL UNIQUE,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role_id INT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            last_login TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    // Planned vs actual dates, per the Calendar Engine design doc:
    // history must be preserved, so "actual_*" columns are only ever
    // written by lifecycle actions, never by a routine edit.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS academic_years (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(20) NOT NULL UNIQUE,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            actual_start_date DATE NULL,
            actual_end_date DATE NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
            reason VARCHAR(255) NULL,
            created_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_academic_years_created_by FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    // Institutional memory: who changed what, when, and why. See ADR-003.
    await pool.query(`
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
        )
    `);

    await pool.query(`
        CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id)
    `).catch((error) => {
        // MySQL has no "CREATE INDEX IF NOT EXISTS" — ignore duplicate-index errors
        // so this stays safe to run on every boot.
        if (error.code !== 'ER_DUP_KEYNAME') throw error;
    });

    // A school term within an academic year. Same planned-vs-actual
    // philosophy as academic_years — see School Calendar Engine Design doc.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS terms (
            id INT AUTO_INCREMENT PRIMARY KEY,
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
};
