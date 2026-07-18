import { sendSuccess } from '../../helpers/response.helper.js';
import * as authService from '../../services/auth/auth.service.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';
import env from '../../config/env.js';

export const login = async (req, res) => {
    const { token, user } = await authService.login(req.body);

    // The browser gets the token as an httpOnly cookie so it's never
    // reachable from JS (no localStorage exposure to XSS). It's also
    // still returned in the body for non-browser clients (e.g. request.rest).
    res.cookie('token', token, {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, { message: AUTH_MESSAGES.LOGIN_SUCCESS, data: { token, user } });
}

export const me = async (req, res) => {
    return sendSuccess(res, { message: AUTH_MESSAGES.ME_SUCCESS, data: req.user });
}

export const logout = async (req, res) => {
    await authService.logout(req.user.userId);
    res.clearCookie('token');
    return sendSuccess(res, { message: AUTH_MESSAGES.LOGOUT_SUCCESS });
}