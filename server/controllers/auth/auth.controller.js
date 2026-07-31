import { sendSuccess } from '../../helpers/response.helper.js';
import * as authService from '../../services/auth/auth.service.js';
import * as passwordResetService from '../../services/auth/password-reset.service.js';
import * as mfaService from '../../services/auth/mfa.service.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';
import env from '../../config/env.js';

const REFRESH_TOKEN_MAX_AGE_MS = env.refreshTokenTtlDays * 24 * 60 * 60 * 1000;

function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: REFRESH_TOKEN_MAX_AGE_MS
    });
}

function clearAuthCookies(res) {
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth' });
}

export const login = async (req, res) => {
    const result = await authService.login(req.body);

    // MFA-enabled account: no cookies yet, no session yet — just a
    // short-lived challenge token the client must post back with a code.
    if (result.mfaRequired) {
        return sendSuccess(res, {
            message: AUTH_MESSAGES.MFA_LOGIN_REQUIRED,
            data: { mfaRequired: true, challengeToken: result.challengeToken }
        });
    }

    const { token, refreshToken, user } = result;

    // The browser gets both as httpOnly cookies so neither is reachable
    // from JS. The refresh cookie is scoped to /api/auth specifically
    // (unlike the access token, which every route needs) — it's only ever
    // sent to refresh/logout, which shrinks its exposure surface.
    setAuthCookies(res, token, refreshToken);

    return sendSuccess(res, { message: AUTH_MESSAGES.LOGIN_SUCCESS, data: { token, refreshToken, user } });
}

// Step 2 of an MFA login — exchanges the challenge token from login() plus
// a TOTP/backup code for a real session, same cookie treatment as login().
export const verifyMfaLogin = async (req, res) => {
    const { challenge_token, code } = req.body;
    const { token, refreshToken, user } = await authService.completeMfaLogin(challenge_token, code);

    setAuthCookies(res, token, refreshToken);

    return sendSuccess(res, { message: AUTH_MESSAGES.LOGIN_SUCCESS, data: { token, refreshToken, user } });
}

// Enrollment step 1: generate + return the secret/QR data. Requires an
// already-authenticated session (this is a settings action, not a login step).
export const enrollMfa = async (req, res) => {
    const data = await mfaService.enrollMfa(req.user.userId);
    return sendSuccess(res, { message: AUTH_MESSAGES.MFA_ENROLLMENT_STARTED, data });
}

// Enrollment step 2: confirm with a real code from the authenticator app;
// returns backup codes exactly once.
export const confirmMfa = async (req, res) => {
    const { code } = req.body;
    const { message, backupCodes } = await mfaService.confirmMfa(req.user.userId, code);
    return sendSuccess(res, { message, data: { backupCodes } });
}

export const disableMfa = async (req, res) => {
    const { password } = req.body;
    const { message } = await mfaService.disableMfa(req.user.userId, password);
    return sendSuccess(res, { message });
}

export const regenerateMfaBackupCodes = async (req, res) => {
    const { password } = req.body;
    const { backupCodes } = await mfaService.regenerateBackupCodes(req.user.userId, password);
    return sendSuccess(res, { message: AUTH_MESSAGES.MFA_BACKUP_CODES_REGENERATED, data: { backupCodes } });
}

export const refresh = async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refresh_token;
    const { accessToken, refreshToken } = await authService.refreshAccessToken(rawRefreshToken);

    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(res, { message: AUTH_MESSAGES.REFRESH_SUCCESS, data: { token: accessToken, refreshToken } });
}

export const me = async (req, res) => {
    const user = await authService.getCurrentUser(req.user.userId);
    return sendSuccess(res, { message: AUTH_MESSAGES.ME_SUCCESS, data: user });
}

export const logout = async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken;
    await authService.logout(req.user.userId, rawRefreshToken);
    clearAuthCookies(res);
    return sendSuccess(res, { message: AUTH_MESSAGES.LOGOUT_SUCCESS });
}

export const logoutAllDevices = async (req, res) => {
    const { message } = await authService.logoutAllDevices(req.user.userId);
    clearAuthCookies(res);
    return sendSuccess(res, { message });
}

export const forgotPassword = async (req, res) => {
    const { message } = await passwordResetService.requestPasswordReset(req.body.email);
    return sendSuccess(res, { message });
}

export const resetPassword = async (req, res) => {
    const { message } = await passwordResetService.resetPassword(req.body.token, req.body.new_password);
    return sendSuccess(res, { message });
}