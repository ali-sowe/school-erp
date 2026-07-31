import { query } from "../../database/query.js";

export async function create(userId, tokenHash, expiresAt) {
    const result = await query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
        [userId, tokenHash, expiresAt]
    );
    return result.insertId;
}

// Unused (expired or not) and unexpired (used or not) are both excluded in
// the same query — a reset link only ever works once, within its window.
export async function findValidByTokenHash(tokenHash) {
    const rows = await query(
        `SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
        [tokenHash]
    );
    return rows[0] || null;
}

export async function markUsed(id) {
    await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`, [id]);
}
