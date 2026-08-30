-- Multi-school support. NULL school_id means "platform level" (the SaaS
-- operator's own account), not "belongs to no school".
--
-- BREAKING CHANGE for existing local/dev databases: academic_years and terms
-- created before this migration have no school assigned. They are left as
-- NULL here rather than guessed at. If you have real test data you want to
-- keep, assign it to a school manually after running this migration:
--   UPDATE academic_years SET school_id = <id> WHERE school_id IS NULL;
--   UPDATE terms SET school_id = <id> WHERE school_id IS NULL;
-- Otherwise, for early-stage local dev data, it's simplest to drop and
-- recreate the database.

ALTER TABLE roles ADD COLUMN school_id INT NULL AFTER id;
ALTER TABLE roles ADD CONSTRAINT fk_roles_school FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE roles DROP INDEX role_name;
ALTER TABLE roles ADD CONSTRAINT uq_roles_school_name UNIQUE (school_id, role_name);

ALTER TABLE users ADD COLUMN school_id INT NULL AFTER id;
ALTER TABLE users ADD CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id);

ALTER TABLE academic_years ADD COLUMN school_id INT NULL AFTER id;
ALTER TABLE academic_years ADD CONSTRAINT fk_academic_years_school FOREIGN KEY (school_id) REFERENCES schools(id);
ALTER TABLE academic_years DROP INDEX name;
ALTER TABLE academic_years ADD CONSTRAINT uq_academic_years_school_name UNIQUE (school_id, name);

ALTER TABLE terms ADD COLUMN school_id INT NULL AFTER id;
ALTER TABLE terms ADD CONSTRAINT fk_terms_school FOREIGN KEY (school_id) REFERENCES schools(id);

ALTER TABLE audit_logs ADD COLUMN school_id INT NULL AFTER id;
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_school FOREIGN KEY (school_id) REFERENCES schools(id);
