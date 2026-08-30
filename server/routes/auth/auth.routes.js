import { Router } from 'express';
import {
    login, logout, logoutAllDevices, refresh, me, forgotPassword, resetPassword,
    verifyMfaLogin, enrollMfa, confirmMfa, disableMfa, regenerateMfaBackupCodes
} from '../../controllers/auth/auth.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { authRateLimiter } from '../../middleware/security/rate-limit.middleware.js';
import {
    forgotPasswordSchema, resetPasswordSchema,
    verifyMfaLoginSchema, confirmMfaSchema, mfaPasswordConfirmSchema
} from '../../validations/auth/auth.validation.js';

const router = Router();

router.post('/login', authRateLimiter, asyncHandler(login));
// Rate-limited like login — this is the second half of the same login
// attempt, and just as attractive a target for guessing a 6-digit code.
router.post('/mfa/verify', authRateLimiter, validate(verifyMfaLoginSchema), asyncHandler(verifyMfaLogin));
// Rate-limited like login — a refresh endpoint is just as attractive a
// target for brute-forcing/guessing as the login endpoint itself.
router.post('/refresh', authRateLimiter, asyncHandler(refresh));
router.get('/me', authenticate, asyncHandler(me));
router.post('/logout', authenticate, asyncHandler(logout));
router.post('/logout-all', authenticate, asyncHandler(logoutAllDevices));
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), asyncHandler(resetPassword));

// MFA management — settings actions on an already-authenticated account,
// not part of the login flow itself.
router.post('/mfa/enroll', authenticate, asyncHandler(enrollMfa));
router.post('/mfa/confirm', authenticate, validate(confirmMfaSchema), asyncHandler(confirmMfa));
router.post('/mfa/disable', authenticate, validate(mfaPasswordConfirmSchema), asyncHandler(disableMfa));
router.post('/mfa/backup-codes/regenerate', authenticate, validate(mfaPasswordConfirmSchema), asyncHandler(regenerateMfaBackupCodes));

export default router;