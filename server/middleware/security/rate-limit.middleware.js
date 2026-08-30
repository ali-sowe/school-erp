import rateLimit from 'express-rate-limit';

// Applied only to the handful of endpoints an attacker would actually want
// to hammer (login guessing, reset-link/email enumeration) — not a
// blanket limiter across the whole API, which would need its own tuning
// per module instead of guessing one number that fits everything.
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' }
});
