import { query } from '../../database/query.js';

// --- mfa_secrets --------------------------------------------------------

export async function findSecretByUserId(userId) {
    const rows = await query(`SELECT * FROM mfa_secrets WHERE user_id = ?`, [userId]);
    return rows[0] || null;
}

// Enrollment (and re-enrollment after a lost device) both just overwrite
// whatever pending/active row already exists — a user only ever has one
// secret at a time, so there's no separate "delete first" step needed.
export async function upsertPendingSecret(userId, encryptedSecret) {
    await query(
        `INSERT INTO mfa_secrets (user_id, secret_encrypted, status)
         VALUES (?, ?, 'pending')
         ON DUPLICATE KEY UPDATE secret_encrypted = VALUES(secret_encrypted), status = 'pending', confirmed_at = NULL`,
        [userId, encryptedSecret]
    );
}

export async function activateSecret(userId, connection = null) {
    const sql = `UPDATE mfa_secrets SET status = 'active', confirmed_at = NOW() WHERE user_id = ?`;
    if (connection) {
        await connection.query(sql, [userId]);
        return;
    }
    await query(sql, [userId]);
}

export async function deleteSecret(userId, connection = null) {
    const sql = `DELETE FROM mfa_secrets WHERE user_id = ?`;
    if (connection) {
        await connection.query(sql, [userId]);
        return;
    }
    await query(sql, [userId]);
}

// --- mfa_backup_codes ----------------------------------------------------

export async function replaceBackupCodes(userId, hashedCodes, connection) {
    // Always called inside a transaction (see mfa.service.js) — old codes
    // are invalidated the instant new ones are issued, never left valid
    // alongside a fresh batch.
    await connection.query(`DELETE FROM mfa_backup_codes WHERE user_id = ?`, [userId]);

    for (const hash of hashedCodes) {
        await connection.query(
            `INSERT INTO mfa_backup_codes (user_id, code_hash) VALUES (?, ?)`,
            [userId, hash]
        );
    }
}

export async function findUnusedBackupCodes(userId) {
    return query(
        `SELECT * FROM mfa_backup_codes WHERE user_id = ? AND used_at IS NULL`,
        [userId]
    );
}

export async function markBackupCodeUsed(id) {
    await query(`UPDATE mfa_backup_codes SET used_at = NOW() WHERE id = ?`, [id]);
}

export async function deleteBackupCodes(userId, connection = null) {
    const sql = `DELETE FROM mfa_backup_codes WHERE user_id = ?`;
    if (connection) {
        await connection.query(sql, [userId]);
        return;
    }
    await query(sql, [userId]);
}

export async function countUnusedBackupCodes(userId) {
    const rows = await query(
        `SELECT COUNT(*) AS count FROM mfa_backup_codes WHERE user_id = ? AND used_at IS NULL`,
        [userId]
    );
    return rows[0].count;
}

// --- mfa_challenges --------------------------------------------------------

export async function createChallenge(userId, challengeHash, expiresAt) {
    const result = await query(
        `INSERT INTO mfa_challenges (user_id, challenge_hash, expires_at) VALUES (?, ?, ?)`,
        [userId, challengeHash, expiresAt]
    );
    return result.insertId;
}

export async function findValidChallengeByHash(challengeHash) {
    const rows = await query(
        `SELECT * FROM mfa_challenges WHERE challenge_hash = ? AND consumed_at IS NULL AND expires_at > NOW()`,
        [challengeHash]
    );
    return rows[0] || null;
}

// Guarded by "AND consumed_at IS NULL", same reasoning as
// refresh-token.repository.js's revoke() — two concurrent requests racing
// on the same challenge token should result in exactly one succeeding
// (1 affected row) and the other getting 0, not both silently succeeding.
export async function consumeChallenge(id) {
    const result = await query(
        `UPDATE mfa_challenges SET consumed_at = NOW() WHERE id = ? AND consumed_at IS NULL`,
        [id]
    );
    return result.affectedRows;
}

// --- users.mfa_enabled --------------------------------------------------

export async function setMfaEnabled(userId, enabled, connection = null) {
    const sql = `UPDATE users SET mfa_enabled = ? WHERE id = ?`;
    if (connection) {
        await connection.query(sql, [enabled, userId]);
        return;
    }
    await query(sql, [enabled, userId]);
}
