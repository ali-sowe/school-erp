import crypto from 'crypto';
import env from '../../config/env.js';

const TOKEN_BYTES = 40; // longer than the password-reset token (32) — this is
                         // longer-lived and higher-value, so worth the extra entropy.

// Looked up by exact hash match, not a slow salted compare like a password —
// same reasoning as password-reset.helper.js. bcrypt stays reserved for
// users.password in password.helper.js.
export function generateRawToken() {
    return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function getExpiryDate() {
    return new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
}
