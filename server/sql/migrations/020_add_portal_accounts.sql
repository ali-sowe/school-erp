-- Student Portal & Parent Portal — login links.
--
-- A student or guardian IS a user once a portal account is provisioned for
-- them, same relationship teachers already have to users (identity/auth
-- stays on `users`; the profile table only links to it). Nullable and
-- added after the fact here, unlike teachers.user_id (NOT NULL) — most
-- students and guardians won't have a login; one is granted on request via
-- student-portal-account.service.js / guardian-portal-account.service.js,
-- not created automatically alongside every profile.

ALTER TABLE students ADD COLUMN user_id INT NULL AFTER school_id;
ALTER TABLE students ADD CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE students ADD CONSTRAINT uq_students_user UNIQUE (user_id);

ALTER TABLE guardians ADD COLUMN user_id INT NULL AFTER school_id;
ALTER TABLE guardians ADD CONSTRAINT fk_guardians_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE guardians ADD CONSTRAINT uq_guardians_user UNIQUE (user_id);
