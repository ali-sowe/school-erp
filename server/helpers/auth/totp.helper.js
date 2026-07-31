import crypto from 'crypto';

// No otplib/speakeasy in package.json — TOTP (RFC 6238) is a small enough
// algorithm on top of HMAC that it's implemented directly here with Node's
// built-in crypto rather than adding a new dependency for it.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const SECRET_BYTES = 20; // 160 bits — matches the RFC 4226/6238 recommendation for HMAC-SHA1
const TIME_STEP_SECONDS = 30;
const DIGITS = 6;

// Authenticator apps (Google Authenticator, Authy, etc.) expect the secret
// as base32, not raw bytes/hex — this is the one encoding that's actually
// part of the otpauth:// standard, so it's not optional.
function base32Encode(buffer) {
    let bits = '';
    for (const byte of buffer) {
        bits += byte.toString(2).padStart(8, '0');
    }

    let output = '';
    for (let i = 0; i + 5 <= bits.length; i += 5) {
        output += BASE32_ALPHABET[parseInt(bits.substring(i, i + 5), 2)];
    }

    const remainder = bits.length % 5;
    if (remainder > 0) {
        const lastChunk = bits.substring(bits.length - remainder).padEnd(5, '0');
        output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
    }

    return output;
}

function base32Decode(base32String) {
    const cleaned = base32String.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');

    let bits = '';
    for (const char of cleaned) {
        const value = BASE32_ALPHABET.indexOf(char);
        if (value === -1) {
            continue; // skip any stray formatting character rather than throwing
        }
        bits += value.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }

    return Buffer.from(bytes);
}

// Returns the base32 secret to store (encrypted) and hand to the user for enrollment.
export function generateSecret() {
    return base32Encode(crypto.randomBytes(SECRET_BYTES));
}

// RFC 6238: HOTP(secret, floor(unixTime / timeStep)), truncated to `digits`.
function hotp(secretBuffer, counter) {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuffer).digest();

    const offset = hmac[hmac.length - 1] & 0x0f;
    const truncated =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

    return String(truncated % 10 ** DIGITS).padStart(DIGITS, '0');
}

export function generateTotp(base32Secret, forTime = Date.now()) {
    const counter = Math.floor(forTime / 1000 / TIME_STEP_SECONDS);
    return hotp(base32Decode(base32Secret), counter);
}

// Accepts a code generated up to `window` steps before/after now (default
// window=1, i.e. ±30s) — some clock drift between server and phone is
// normal and shouldn't lock a legitimate user out.
export function verifyTotp(base32Secret, token, window = 1) {
    if (!token || !/^\d{6}$/.test(token)) {
        return false;
    }

    const secretBuffer = base32Decode(base32Secret);
    const currentCounter = Math.floor(Date.now() / 1000 / TIME_STEP_SECONDS);

    for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
        if (hotp(secretBuffer, currentCounter + errorWindow) === token) {
            return true;
        }
    }

    return false;
}

// otpauth:// URI per Google Authenticator's key URI format — a QR renderer
// on the frontend (or the user typing the secret in manually) both work
// off this same string.
export function buildOtpauthUri(base32Secret, accountEmail, issuer = 'School ERP') {
    const label = encodeURIComponent(`${issuer}:${accountEmail}`);
    const params = new URLSearchParams({
        secret: base32Secret,
        issuer,
        algorithm: 'SHA1',
        digits: String(DIGITS),
        period: String(TIME_STEP_SECONDS)
    });

    return `otpauth://totp/${label}?${params.toString()}`;
}
