import { query } from "../../database/query.js";

export async function create(userId, tokenHash, expiresAt, connection = null) {
    const sql = `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`;
    const params = [userId, tokenHash, expiresAt];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.insertId;
    }

    const result = await query(sql, params);
    return result.insertId;
}

// Any state, valid or not — used for reuse detection (see auth.service.js's
// refreshAccessToken), which needs to tell "never existed" apart from
// "existed but was already revoked".
export async function findByTokenHash(tokenHash) {
    const rows = await query(`SELECT * FROM refresh_tokens WHERE token_hash = ?`, [tokenHash]);
    return rows[0] || null;
}

// Guarded by "AND revoked_at IS NULL" so revoking an already-revoked token
// twice (e.g. a concurrent refresh + logout, or two tabs refreshing at once)
// affects 0 rows rather than silently succeeding twice — the caller treats
// that as someone else already won the race on this exact token.
export async function revoke(id, replacedById = null, connection = null) {
    const sql = `UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by_id = ? WHERE id = ? AND revoked_at IS NULL`;
    const params = [replacedById, id];

    if (connection) {
        const [result] = await connection.query(sql, params);
        return result.affectedRows;
    }

    const result = await query(sql, params);
    return result.affectedRows;
}

// Used both for explicit "log out everywhere" and for reuse-detection
// response (see auth.service.js) — a stolen-and-replayed token means the
// whole family this user's tokens belong to should be treated as compromised.
export async function revokeAllForUser(userId) {
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`, [userId]);
}
