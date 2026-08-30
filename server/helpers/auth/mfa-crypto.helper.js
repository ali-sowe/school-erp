import crypto from 'crypto';
import env from '../../config/env.js';

// Every other secret in this codebase (passwords, refresh tokens, reset
// tokens) is one-way hashed because the server only ever needs to compare
// against it, never read it back. A TOTP secret is different: verifying a
// future 6-digit code requires re-deriving HOTP from the *plaintext*
// secret, so it must be reversible. AES-256-GCM (authenticated encryption)
// is the appropriate tool here, not a hash.

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12; // 96-bit IV is the recommended size for GCM

function getKey() {
    // Deliberately derived from JWT_SECRET rather than requiring a brand
    // new required env var — same "existing .env files keep working"
    // reasoning as env.js's other optional settings. A dedicated
    // MFA_ENCRYPTION_KEY env var overrides this if the operator sets one.
    const material = process.env.MFA_ENCRYPTION_KEY || env.jwtSecret;
    return crypto.createHash('sha256').update(material).digest();
}

export function encryptSecret(plaintextSecret) {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    const encrypted = Buffer.concat([cipher.update(plaintextSecret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // iv : authTag : ciphertext, all hex, colon-joined — everything needed
    // to decrypt lives in the one stored column.
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(storedValue) {
    const [ivHex, authTagHex, encryptedHex] = storedValue.split(':');

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final()
    ]);

    return decrypted.toString('utf8');
}
