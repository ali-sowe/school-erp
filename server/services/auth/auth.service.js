import { AppError } from '../../helpers/app-error.helper.js';
import { generateCode } from '../../helpers/code-generator.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';
import { hashPassword, comparePassword } from '../../helpers/password.helper.js';
import { generateToken } from '../../helpers/jwt.helper.js';
import { generateRawToken, hashToken, getExpiryDate } from '../../helpers/auth/refresh-token.helper.js';
import { generateRawChallenge, hashChallenge, getChallengeExpiryDate } from '../../helpers/auth/mfa-challenge.helper.js';
import { transaction } from '../../database/transaction.js';
import * as authRepository from '../../repositories/auth/auth.repository.js';
import * as refreshTokenRepository from '../../repositories/auth/refresh-token.repository.js';
import * as mfaRepository from '../../repositories/auth/mfa.repository.js';
import * as roleRepository from '../../repositories/role/role.repository.js';
import * as userRepository from '../../repositories/user/user.repository.js';
import { DEFAULT_ROLE_PERMISSIONS, normalizePermissions } from '../../helpers/auth/permission.helper.js';
import { verifyChallengeCode } from './mfa.service.js';

const PLATFORM_ADMIN_ROLE_NAME = 'Platform Administrator';
const PLATFORM_ADMIN_EMAIL = 'admin@schoolerp.com';

// Bootstraps the one account that can create schools in the first place —
// school_id NULL means "platform level", not "belongs to no school" (see
// migration 005). Every other Administrator is created per-school, as part
// of school onboarding (see school.service.js).
export const seedPlatformAdministrator = async () => {
    const existingAdmin = await userRepository.findByEmail(PLATFORM_ADMIN_EMAIL);

    if (existingAdmin) {
        console.log('✅ Platform Administrator already exists. Skipping creation.');
        return;
    }

    let role = await roleRepository.findByName(null, PLATFORM_ADMIN_ROLE_NAME);

    if (!role) {
        const roleId = await roleRepository.create({
            school_id: null,
            role_name: PLATFORM_ADMIN_ROLE_NAME,
            description: 'Manages schools on the platform. Not tied to any single school.',
            permissions: DEFAULT_ROLE_PERMISSIONS[PLATFORM_ADMIN_ROLE_NAME]
        });
        role = await roleRepository.findById(roleId);
    }

    const hashedPassword = await hashPassword('Admin@123');

    await userRepository.create({
        school_id: null,
        user_code: generateCode('USR', 1),
        first_name: 'Platform',
        last_name: 'Administrator',
        email: PLATFORM_ADMIN_EMAIL,
        password: hashedPassword,
        role_id: role.id,
        status: 'active'
    });

    console.log('🎉 Platform Administrator created successfully.');
}

export const login = async ({ email, password }) => {
    // Step 1: Find user 
    const user = await authRepository.findUserByEmail(email);

    // validate the user
    authRepository.validateUser(user);


    // Step 3: Compare password
    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // step 4: Update last login timestamp
    // Awaited and isolated: a failure here (e.g. a transient DB hiccup)
    // shouldn't fail the login itself, but an unawaited rejection would
    // otherwise become an unhandled promise rejection.
    try {
        await authRepository.updateLastLogin(user.id);
    } catch (error) {
        console.error('Failed to update last_login timestamp:', error);
    }

    // Step 5: MFA-enabled accounts don't get real session tokens off a
    // correct password alone. Instead, issue a short-lived opaque
    // challenge (same hash-only-stored pattern as the refresh token below)
    // that the client must exchange — via completeMfaLogin — for a real
    // session once the second factor also checks out.
    if (user.mfa_enabled) {
        const rawChallenge = generateRawChallenge();
        await mfaRepository.createChallenge(user.id, hashChallenge(rawChallenge), getChallengeExpiryDate());

        return { mfaRequired: true, challengeToken: rawChallenge };
    }

    // Step 6: Generate JWT access token + an opaque, DB-tracked refresh
    // token. Permissions are read from the role's own DB record
    // (configurable per school/role, per ADR-005) with the legacy hardcoded
    // map only as a fallback for roles created before permissions existed.
  
    const permissions = normalizePermissions(
        // user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role_name] ?? []
        DEFAULT_ROLE_PERMISSIONS[user.role_name] ?? []
    );
    const token = generateToken({
        userId: user.id,
        schoolId: user.school_id,
        email: user.email,
        role: user.role_name,
        permissions
    });

    const rawRefreshToken = generateRawToken();
    await refreshTokenRepository.create(user.id, hashToken(rawRefreshToken), getExpiryDate());

    return { mfaRequired: false, token, refreshToken: rawRefreshToken, user: { ...authRepository.sensitizeUser(user), permissions } };
}

// Step 2 of an MFA login: exchanges a still-valid challenge token + a TOTP
// or backup code for the same shape of result plain login() returns —
// same token-issuing tail, just gated behind the second factor first.
export const completeMfaLogin = async (rawChallengeToken, code) => {
    if (!rawChallengeToken) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.MFA_CHALLENGE_INVALID_OR_EXPIRED);
    }

    const challenge = await mfaRepository.findValidChallengeByHash(hashChallenge(rawChallengeToken));
    if (!challenge) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.MFA_CHALLENGE_INVALID_OR_EXPIRED);
    }

    await verifyChallengeCode(challenge, code);
    // Consumed immediately on success — a challenge token is single-use,
    // same as a refresh token being rotated out. 0 affected rows means a
    // concurrent request on this exact token won the race and already
    // consumed it, so this request must not also issue a session.
    const consumed = await mfaRepository.consumeChallenge(challenge.id);
    if (consumed === 0) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.MFA_CHALLENGE_INVALID_OR_EXPIRED);
    }

    const user = await authRepository.findUserById(challenge.user_id);
    authRepository.validateUser(user);

    try {
        await authRepository.updateLastLogin(user.id);
    } catch (error) {
        console.error('Failed to update last_login timestamp:', error);
    }

    const permissions = normalizePermissions(
        user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role_name] ?? []
    );
    const token = generateToken({
        userId: user.id,
        schoolId: user.school_id,
        email: user.email,
        role: user.role_name,
        permissions
    });

    const rawRefreshToken = generateRawToken();
    await refreshTokenRepository.create(user.id, hashToken(rawRefreshToken), getExpiryDate());

    return { token, refreshToken: rawRefreshToken, user: { ...authRepository.sensitizeUser(user), permissions } };
}

// Exchanges a still-valid refresh token for a new access token, rotating
// the refresh token in the same step (a new row is issued, the old one is
// revoked and linked via replaced_by_id — see migration 022's comment).
// Rotation means a refresh token is single-use: the *previous* raw value
// stops working the moment it's exchanged, which is what makes reuse
// detection below possible.
export const refreshAccessToken = async (rawToken) => {
    if (!rawToken) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const tokenHash = hashToken(rawToken);
    const existing = await refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existing) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // Reuse of an already-rotated-out token: either two concurrent refresh
    // requests raced (benign — see the guarded revoke() below for that case)
    // or this token was stolen and both the attacker and the legitimate
    // user have now used it (compromise). This branch specifically means
    // the token had *already* been revoked before this request even started,
    // which the race case doesn't hit — so treat it as the worst case:
    // revoke the whole family and force a full re-login, rather than
    // silently trusting a token that's supposed to be dead.
    if (existing.revoked_at) {
        await refreshTokenRepository.revokeAllForUser(existing.user_id);
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.SESSION_COMPROMISED);
    }

    if (new Date(existing.expires_at) < new Date()) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const user = await authRepository.findUserById(existing.user_id);
    authRepository.validateUser(user);

    const newRawToken = generateRawToken();
    const newTokenHash = hashToken(newRawToken);
    const newExpiresAt = getExpiryDate();

    // Both writes happen atomically: issuing the replacement and revoking
    // the original must never be visible out of sync with each other.
    await transaction(async (connection) => {
        const newTokenId = await refreshTokenRepository.create(existing.user_id, newTokenHash, newExpiresAt, connection);

        // 0 rows affected here means someone else's refresh of this exact
        // token won the race between our read above and this write (e.g.
        // two tabs refreshing at once) — the new row we just inserted is
        // simply discarded by the rollback, and the caller should retry
        // with whatever token the winning request's response set.
        const revoked = await refreshTokenRepository.revoke(existing.id, newTokenId, connection);

        if (revoked === 0) {
            throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
        }
    });

    const permissions = normalizePermissions(
        user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role_name] ?? []
    );
    const accessToken = generateToken({
        userId: user.id,
        schoolId: user.school_id,
        email: user.email,
        role: user.role_name,
        permissions
    });

    return { accessToken, refreshToken: newRawToken };
}

// req.user is only the decoded JWT payload (userId, schoolId, email, role,
// permissions) — it does not carry first_name/last_name/role_name, so
// GET /auth/me looks the user back up rather than echoing the token as-is.
export const getCurrentUser = async (userId) => {
    const user = await authRepository.findUserById(userId);
    authRepository.validateUser(user);

    const permissions = normalizePermissions(
        user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role_name] ?? []
    );

    return { ...authRepository.sensitizeUser(user), permissions };
}

export const logout = async (userId, rawRefreshToken) => {
    if (rawRefreshToken) {
        const existing = await refreshTokenRepository.findByTokenHash(hashToken(rawRefreshToken));

        // Revoking without a replacement (null) — a logout ends the chain,
        // it doesn't continue it.
        if (existing && !existing.revoked_at) {
            await refreshTokenRepository.revoke(existing.id, null);
        }
    }

    if (!userId) {
        return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
    }

    return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
}

export const logoutAllDevices = async (userId) => {
    await refreshTokenRepository.revokeAllForUser(userId);
    return { message: AUTH_MESSAGES.LOGOUT_ALL_SUCCESS };
}
