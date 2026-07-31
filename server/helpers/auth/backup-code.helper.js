import crypto from 'crypto';
import { hashPassword, comparePassword } from '../password.helper.js';

const CODE_COUNT = 10;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids visual ambiguity when a user is copying one down

function generateOneCode() {
    let raw = '';
    for (let i = 0; i < 10; i++) {
        raw += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export function generateBackupCodes(count = CODE_COUNT) {
    return Array.from({ length: count }, generateOneCode);
}

// bcrypt, not sha256 — these are shorter, user-retained recovery
// credentials (closer to a password than to a high-entropy random token),
// so the slower hash is deliberate, same reasoning as users.password.
export async function hashBackupCode(rawCode) {
    return hashPassword(rawCode);
}

export async function verifyBackupCode(rawCode, hashedCode) {
    return comparePassword(rawCode, hashedCode);
}
