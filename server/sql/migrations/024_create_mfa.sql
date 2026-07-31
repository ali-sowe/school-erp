-- Multi-Factor Authentication (TOTP-based, RFC 6238), applies to all
-- users platform-wide — not opt-in per role. Four pieces:
--
-- 1. users.mfa_enabled — the single source of truth for "does this
--    account require a second factor at login". A row existing in
--    mfa_secrets is NOT enough by itself (see status below), so login
--    checks this flag, not the presence of a secret.
--
-- 2. mfa_secrets — one row per user, holding the TOTP secret encrypted
--    at rest (AES-256-GCM, see mfa-crypto.helper.js) since — unlike a
--    password or token — it must be decryptable to verify future codes,
--    so a one-way hash (bcrypt/sha256, as used elsewhere in auth) won't
--    work here. status='pending' during enrollment (secret generated,
--    QR shown, not yet confirmed with a real code) vs 'active' (confirmed
--    and in use). A pending row a user never confirms is harmless and
--    just gets overwritten if they re-enroll.
--
-- 3. mfa_backup_codes — one-time recovery codes issued when MFA is
--    confirmed, for the "lost my authenticator app" case. Hashed with
--    bcrypt (via password.helper.js) rather than sha256 like the
--    higher-entropy refresh/reset tokens — these are shorter, user-
--    retained codes, so the slower hash is deliberate defense in depth.
--
-- 4. mfa_challenges — bridges the two-step login. Password verifies
--    first; rather than issuing real session tokens immediately, the
--    server issues a short-lived opaque challenge token (same
--    hash-only-stored pattern as refresh_tokens/password_reset_tokens)
--    that the client exchanges for real tokens only after the TOTP/backup
--    code step succeeds. This keeps a bare password never sufficient to
--    obtain a session on its own.

ALTER TABLE users
    ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER status;

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
);

CREATE TABLE IF NOT EXISTS mfa_backup_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mfa_backup_codes_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_mfa_backup_codes_user ON mfa_backup_codes (user_id);

CREATE TABLE IF NOT EXISTS mfa_challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    challenge_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mfa_challenges_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_mfa_challenges_hash UNIQUE (challenge_hash)
);

CREATE INDEX idx_mfa_challenges_user ON mfa_challenges (user_id);
