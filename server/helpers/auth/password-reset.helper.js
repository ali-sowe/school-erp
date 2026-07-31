import crypto from 'crypto';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// A reset token is looked up by exact match (not a slow, salted compare
// like a password), so a fast SHA-256 hash is the right tool here — bcrypt
// is deliberately reserved for users.password in password.helper.js.
export function generateRawToken() {
    return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function getExpiryDate() {
    return new Date(Date.now() + TOKEN_TTL_MS);
}
