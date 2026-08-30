import * as mfaRepository from '../../repositories/auth/mfa.repository.js';
import * as userRepository from '../../repositories/user/user.repository.js';
import * as authRepository from '../../repositories/auth/auth.repository.js';
import * as auditRepository from '../../repositories/audit/audit.repository.js';
import { comparePassword } from '../../helpers/password.helper.js';
import { generateSecret, verifyTotp, buildOtpauthUri } from '../../helpers/auth/totp.helper.js';
import { encryptSecret, decryptSecret } from '../../helpers/auth/mfa-crypto.helper.js';
import { generateBackupCodes, hashBackupCode, verifyBackupCode } from '../../helpers/auth/backup-code.helper.js';
import { transaction } from '../../database/transaction.js';
import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';

// Step 1 of enrollment: generate a secret, store it as 'pending' (not yet
// trusted for login), hand back the otpauth URI so the frontend can render
// a QR code (or the user can type the secret in manually).
export const enrollMfa = async (userId) => {
    const user = await userRepository.findById(userId);
    authRepository.validateUser(user);

    const existingSecret = await mfaRepository.findSecretByUserId(userId);
    if (existingSecret && existingSecret.status === 'active') {
        // Overwriting an active secret here would flip it to 'pending'
        // immediately — breaking TOTP login for this user (backup codes
        // would still work) until they finish confirming the *new* code,
        // with no warning in between. Re-enrollment (lost device, etc.)
        // goes through disable -> enroll instead, which is an explicit,
        // deliberate action rather than an accidental overwrite.
        throw new AppError(HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.MFA_ALREADY_ENABLED);
    }

    const secret = generateSecret();
    await mfaRepository.upsertPendingSecret(userId, encryptSecret(secret));

    return {
        secret,
        otpauthUri: buildOtpauthUri(secret, user.email)
    };
};

// Step 2: the user enters a code from their authenticator app, proving
// they actually captured the secret. Only at this point does MFA become
// enforced on login, and only at this point are backup codes issued
// (issuing them earlier would mean handing out recovery codes for a
// second factor that was never confirmed to work).
export const confirmMfa = async (userId, code) => {
    const pendingSecret = await mfaRepository.findSecretByUserId(userId);

    if (!pendingSecret || pendingSecret.status !== 'pending') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.MFA_ENROLLMENT_NOT_STARTED);
    }

    const decryptedSecret = decryptSecret(pendingSecret.secret_encrypted);

    if (!verifyTotp(decryptedSecret, code)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.MFA_INVALID_CODE);
    }

    const rawBackupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(rawBackupCodes.map(hashBackupCode));

    await transaction(async (connection) => {
        await mfaRepository.replaceBackupCodes(userId, hashedBackupCodes, connection);
        await mfaRepository.setMfaEnabled(userId, true, connection);
        await mfaRepository.activateSecret(userId, connection);
    });

    await auditRepository.createAuditLog({
        entityType: 'User',
        entityId: userId,
        action: 'MFA_ENABLED',
        reason: 'User confirmed MFA enrollment',
        performedBy: userId
    });

    // Backup codes are shown exactly once, here — only the bcrypt hash is
    // ever stored, so this is the only response that will ever contain them.
    return { message: AUTH_MESSAGES.MFA_ENABLED, backupCodes: rawBackupCodes };
};

// Step 2 of a *login* (not enrollment): the challenge token issued after a
// correct password is exchanged here for confirmation that the second
// factor also checks out. auth.service.js's login() calls this indirectly
// via the challenge lookup, then finishes issuing real session tokens.
export const verifyChallengeCode = async (challengeRecord, code) => {
    const secretRecord = await mfaRepository.findSecretByUserId(challengeRecord.user_id);

    if (secretRecord && secretRecord.status === 'active' && verifyTotp(decryptSecret(secretRecord.secret_encrypted), code)) {
        return;
    }

    // Falls back to a backup code only if the TOTP check above didn't
    // already pass — checked in sequence rather than in parallel since a
    // 6-digit code and an XXXX-XXXX code never overlap in format, but
    // trying TOTP first avoids burning a scarce backup code unnecessarily.
    const unusedCodes = await mfaRepository.findUnusedBackupCodes(challengeRecord.user_id);

    for (const backupCode of unusedCodes) {
        if (await verifyBackupCode(code, backupCode.code_hash)) {
            await mfaRepository.markBackupCodeUsed(backupCode.id);
            return;
        }
    }

    throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.MFA_INVALID_CODE);
};

// Requires the current password, same as any other security-downgrading
// action — knowing you're currently logged in isn't sufficient on its own,
// since a hijacked but not-yet-logged-out session shouldn't be able to
// turn MFA off.
export const disableMfa = async (userId, password) => {
    const user = await userRepository.findById(userId);
    authRepository.validateUser(user);

    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    await transaction(async (connection) => {
        await mfaRepository.setMfaEnabled(userId, false, connection);
        await mfaRepository.deleteSecret(userId, connection);
        await mfaRepository.deleteBackupCodes(userId, connection);
    });

    await auditRepository.createAuditLog({
        entityType: 'User',
        entityId: userId,
        action: 'MFA_DISABLED',
        reason: 'User disabled MFA',
        performedBy: userId
    });

    return { message: AUTH_MESSAGES.MFA_DISABLED };
};

// Invalidates every unused code and issues a fresh set — same reasoning as
// refresh token rotation: old codes should never remain valid alongside a
// newly-issued batch the user asked for because they thought the old ones
// were compromised or exhausted.
export const regenerateBackupCodes = async (userId, password) => {
    const user = await userRepository.findById(userId);
    authRepository.validateUser(user);

    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.mfa_enabled) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.MFA_NOT_ENABLED);
    }

    const rawBackupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(rawBackupCodes.map(hashBackupCode));

    await transaction(async (connection) => {
        await mfaRepository.replaceBackupCodes(userId, hashedBackupCodes, connection);
    });

    return { backupCodes: rawBackupCodes };
};
