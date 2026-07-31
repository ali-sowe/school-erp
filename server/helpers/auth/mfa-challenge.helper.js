import crypto from 'crypto';

const TOKEN_BYTES = 32;
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // short-lived on purpose — this only bridges the password step to the TOTP step of one login attempt

// Looked up by exact hash match, same reasoning as refresh-token.helper.js
// and password-reset.helper.js — never store the raw value.
export function generateRawChallenge() {
    return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

export function hashChallenge(rawChallenge) {
    return crypto.createHash('sha256').update(rawChallenge).digest('hex');
}

export function getChallengeExpiryDate() {
    return new Date(Date.now() + CHALLENGE_TTL_MS);
}
